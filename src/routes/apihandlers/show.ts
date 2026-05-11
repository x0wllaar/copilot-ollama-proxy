import {LM_STUDIO_URL} from '../../config.js';
import type {
	LmStudioModelsResponse,
	ModelInfoResponse,
	ErrorResponse,
	ShowModelRequestBody,
} from '../../types.js';
import type {FastifyRequest, FastifyReply} from 'fastify';

/**
 * Handler for /api/show endpoint - retrieves model information
 */
export async function handleShow(
	request: FastifyRequest<{Body: ShowModelRequestBody}>,
	reply: FastifyReply,
): Promise<ModelInfoResponse | ErrorResponse> {
	const targetKey = request.body.model;

	try {
		const response = await fetch(`${LM_STUDIO_URL}/api/v1/models`);
		if (!response.ok) {
			throw new Error(`LM Studio error: ${response.statusText}`);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const data = (await response.json()) as LmStudioModelsResponse;
		const foundModel = data.models.find(m =>
			m.loaded_instances?.some(i => i.id === targetKey),
		);

		if (!foundModel?.loaded_instances) {
			return {error: 'Model not found or is not loaded into LM Studio'};
		}

		// Map capabilities from LM Studio format to Ollama string array format
		const capabilities: string[] = [];
		if (foundModel.capabilities?.vision) {
			capabilities.push('vision');
		}

		if (foundModel.capabilities?.trained_for_tool_use) {
			capabilities.push('tools');
		}

		const foundInstance = foundModel.loaded_instances.find(
			i => i.id === targetKey,
		);

		const modelArch = foundModel.architecture ?? 'unknown';
		const ro: ModelInfoResponse = {
			template: '',
			capabilities,
			details: {
				family: modelArch,
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			model_info: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'general.architecture': modelArch,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'general.basename': targetKey,
				[modelArch + '.context_length']:
					foundInstance?.config.context_length ?? 32_768,
			},
		};
		return ro;
	} catch (error) {
		console.error('Error fetching model info from LM Studio:', error);
		return {error: 'Failed to retrieve model information'};
	}
}
