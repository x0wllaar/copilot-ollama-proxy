import {Buffer} from 'node:buffer';
import {Readable} from 'node:stream';
import {LM_STUDIO_URL} from '../config.js';
import type {FastifyRequest, FastifyReply} from 'fastify';
/**
 * Proxy handler for forwarding requests to LM Studio
 */
export async function handleProxy(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const targetUrl = `${LM_STUDIO_URL}${request.url}`;

	try {
		// Create headers from request, removing connection-specific headers
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const headers = new Headers(request.headers as Record<string, string>);
		headers.delete('host');
		headers.delete('connection');
		headers.delete('content-length');

		// Create abort controller for request lifecycle management
		const controller = new AbortController();
		const {signal} = controller;

		// Abort if client connection is destroyed
		request.raw.on('error', error => {
			console.error('Upstream Request Error:', error);
			controller.abort();
		});

		reply.raw.on('close', () => {
			controller.abort();
		});

		// Prepare request body based on method and type
		let fetchBody: any;

		if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
			const rb = request.body as any;
			if (rb !== null && typeof rb === 'object') {
				fetchBody = JSON.stringify(rb);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			} else if (rb && typeof rb.toArray === 'function') {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fetchBody = Buffer.from(await rb.toArray());
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				fetchBody = rb;
			}
		}

		// Forward request to LM Studio
		const response = await fetch(targetUrl, {
			method: request.method,
			headers,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			body: fetchBody,
			signal,
		});

		void reply.status(response.status);
		for (const [key, value] of response.headers.entries()) {
			void reply.header(key, value);
		}

		// Handle streaming by piping the ReadableStream from fetch to Fastify reply
		if (response.body) {
			const reader = response.body.getReader();

			// Generator to yield chunks from web stream to Node stream
			async function* streamGenerator(): AsyncGenerator<Uint8Array> {
				while (true) {
					// eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-unsafe-assignment
					const {done, value} = await reader.read();
					if (done) break;
					yield value;
				}
			}

			// Set the response to use the stream
			await reply.send(Readable.from(streamGenerator()));
		} else {
			// Fallback for non-streaming responses
			const data = await response.arrayBuffer();
			await reply.send(Buffer.from(data));
		}
	} catch (error: unknown) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const error_ = error as Error & {name?: string};

		if (error_.name === 'AbortError') {
			console.log('Upstream request aborted');
			return;
		}

		console.error('Proxy error:', error_);
		await reply
			.status(502)
			.send({error: 'Bad Gateway', message: error_.message});
	}
}
