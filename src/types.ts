import type {FastifyInstance} from 'fastify';

/**
 * LM Studio model data structure
 */
export type LmStudioModel = {
	key: string;
	name?: string;
	capabilities?: {
		vision?: boolean;
		trained_for_tool_use?: boolean;
	};
	max_context_length?: number;
	architecture?: string;
	loaded_instances?: Array<{
		id: string;
		config: {
			context_length: number;
		};
	}>;
};

/**
 * LM Studio API response for models list
 */
export type LmStudioModelsResponse = {
	models: LmStudioModel[];
};

/**
 * Ollama-compatible model entry
 */
export type OllamaModelEntry = {
	model: string;
};

/**
 * Ollama-compatible tags response
 */
export type OllamaTagsResponse = {
	models: OllamaModelEntry[];
};

/**
 * Request body for /api/show endpoint
 */
export type ShowModelRequestBody = {
	model: string;
};

/**
 * Model information response structure
 */
export type ModelInfoResponse = {
	template?: string;
	capabilities: string[];
	details: {
		family: string;
	};
	model_info: Record<string, unknown>;
};

/**
 * Error response structure
 */
export type ErrorResponse = {
	error: string;
	message?: string;
};

/**
 * Server instance type for route handlers
 */
export type ServerInstance = FastifyInstance;
