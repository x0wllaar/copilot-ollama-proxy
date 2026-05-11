import {LM_STUDIO_URL} from '../../config.js';
import type {
	LmStudioModelsResponse,
	OllamaTagsResponse,
} from '../../types.js';
import type {FastifyRequest, FastifyReply} from 'fastify';

/**
 * Handler for /api/tags endpoint - lists loaded models from LM Studio
 */
export async function handleTags(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<OllamaTagsResponse> {
	try {
		const response = await fetch(`${LM_STUDIO_URL}/api/v1/models`);

		if (!response.ok) {
			throw new Error(`LM Studio error: ${response.statusText}`);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const data = (await response.json()) as LmStudioModelsResponse;
		const ollamaModels: OllamaTagsResponse['models'] = [];

		// Iterate through models and specifically extract loaded instances
		for (const lmModel of data.models) {
			if (
				lmModel.loaded_instances
				&& Array.isArray(lmModel.loaded_instances)
			) {
				for (const instance of lmModel.loaded_instances) {
					// We use the instance ID as the model name in the list
					const modelSpec = {model: instance.id, name: instance.id};
					ollamaModels.push(modelSpec);
				}
			}
		}

		return {models: ollamaModels};
	} catch (error) {
		console.error('Error fetching models from LM Studio:', error);
		return {models: []};
	}
}
