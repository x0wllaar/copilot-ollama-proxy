import {Readable} from 'node:stream';
import {LM_STUDIO_URL} from '../../config.js';
import type {
	GenerateRequestBody,
	GenerateResponse,
	GenerateStreamEvent,
	LmStudioChatRequest,
	LmStudioChatCompletionResponse,
	LmStudioChatCompletionChunk,
} from '../../types.js';
import type {FastifyRequest, FastifyReply} from 'fastify';

function buildLmStudioRequest(
	body: GenerateRequestBody,
	stream: boolean,
): LmStudioChatRequest {
	const messages: Array<{role: string; content: string}> = [];
	if (body.system) {
		messages.push({role: 'system', content: body.system});
	}

	messages.push({role: 'user', content: body.prompt ?? ''});

	const lmRequest: LmStudioChatRequest = {
		model: body.model,
		messages,
		stream,
	};

	const opts = body.options;
	if (opts) {
		if (opts.temperature !== undefined)
			lmRequest.temperature = opts.temperature;
		if (opts.top_p !== undefined) lmRequest.top_p = opts.top_p;
		if (opts.top_k !== undefined) lmRequest.top_k = opts.top_k;
		if (opts.min_p !== undefined) lmRequest.min_p = opts.min_p;
		if (opts.seed !== undefined) lmRequest.seed = opts.seed;
		if (opts.stop !== undefined) lmRequest.stop = opts.stop;
		if (opts.num_predict !== undefined)
			lmRequest.max_tokens = opts.num_predict;
	}

	return lmRequest;
}

/**
 * Handler for /api/generate endpoint - translates an Ollama generate request
 * into an LM Studio (OpenAI-compatible) chat completion request.
 */
export async function handleGenerate(
	request: FastifyRequest<{Body: GenerateRequestBody}>,
	reply: FastifyReply,
): Promise<void> {
	const body = request.body;
	const stream = body.stream ?? true;
	const lmRequest = buildLmStudioRequest(body, stream);

	const controller = new AbortController();
	reply.raw.on('close', () => {
		controller.abort();
	});

	let lmResp: Response;
	try {
		lmResp = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify(lmRequest),
			signal: controller.signal,
		});
	} catch (error) {
		console.error('Error contacting LM Studio for /api/generate:', error);
		await reply
			.status(502)
			.send({error: 'Bad Gateway', message: (error as Error).message});
		return;
	}

	if (!lmResp.ok) {
		const text = await lmResp.text();
		await reply
			.status(lmResp.status)
			.send({error: 'LM Studio error', message: text});
		return;
	}

	if (!stream) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const data = (await lmResp.json()) as LmStudioChatCompletionResponse;
		const choice = data.choices?.[0];
		const out: GenerateResponse = {
			model: body.model,
			created_at: new Date().toISOString(),
			response: choice?.message?.content ?? '',
			done: true,
			done_reason: choice?.finish_reason ?? 'stop',
		};
		if (data.usage?.prompt_tokens !== undefined) {
			out.prompt_eval_count = data.usage.prompt_tokens;
		}

		if (data.usage?.completion_tokens !== undefined) {
			out.eval_count = data.usage.completion_tokens;
		}

		await reply.header('content-type', 'application/json').send(out);
		return;
	}

	if (!lmResp.body) {
		await reply.status(502).send({error: 'LM Studio returned no body'});
		return;
	}

	const reader = lmResp.body.getReader();
	const decoder = new TextDecoder();
	const model = body.model;

	async function* ndjsonGenerator(): AsyncGenerator<string> {
		let buffer = '';
		let promptTokens: number | undefined;
		let completionTokens: number | undefined;
		let finishReason: string | undefined;

		while (true) {
			// eslint-disable-next-line no-await-in-loop
			const {done, value} = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, {stream: true});

			let newlineIndex = buffer.indexOf('\n');
			while (newlineIndex !== -1) {
				const rawLine = buffer.slice(0, newlineIndex).trim();
				buffer = buffer.slice(newlineIndex + 1);
				newlineIndex = buffer.indexOf('\n');

				if (!rawLine.startsWith('data:')) continue;
				const payload = rawLine.slice(5).trim();
				if (payload === '' || payload === '[DONE]') continue;

				let chunk: LmStudioChatCompletionChunk;
				try {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
					chunk = JSON.parse(payload) as LmStudioChatCompletionChunk;
				} catch (error) {
					console.error(
						'Failed to parse LM Studio chunk:',
						error,
						payload,
					);
					continue;
				}

				const choice = chunk.choices?.[0];
				const text = choice?.delta?.content ?? '';
				if (chunk.usage?.prompt_tokens !== undefined) {
					promptTokens = chunk.usage.prompt_tokens;
				}

				if (chunk.usage?.completion_tokens !== undefined) {
					completionTokens = chunk.usage.completion_tokens;
				}

				if (choice?.finish_reason) {
					finishReason = choice.finish_reason;
				}

				if (text !== '') {
					const event: GenerateStreamEvent = {
						model,
						created_at: new Date().toISOString(),
						response: text,
						done: false,
					};
					yield JSON.stringify(event) + '\n';
				}
			}
		}

		const finalEvent: GenerateStreamEvent = {
			model,
			created_at: new Date().toISOString(),
			response: '',
			done: true,
			done_reason: finishReason ?? 'stop',
		};
		if (promptTokens !== undefined) {
			finalEvent.prompt_eval_count = promptTokens;
		}

		if (completionTokens !== undefined) {
			finalEvent.eval_count = completionTokens;
		}

		yield JSON.stringify(finalEvent) + '\n';
	}

	void reply.header('content-type', 'application/x-ndjson');
	await reply.send(Readable.from(ndjsonGenerator()));
}
