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
	name: string;
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
 * Subset of generation options forwarded to LM Studio
 */
export type GenerateOptions = {
	temperature?: number;
	top_k?: number;
	top_p?: number;
	min_p?: number;
	seed?: number;
	stop?: string | string[];
	num_ctx?: number;
	num_predict?: number;
};

/**
 * Request body for /api/generate endpoint
 */
export type GenerateRequestBody = {
	model: string;
	prompt?: string;
	system?: string;
	stream?: boolean;
	options?: GenerateOptions;
	keep_alive?: string | number;
};

/**
 * Non-streaming response for /api/generate endpoint
 */
export type GenerateResponse = {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
	done_reason?: string;
	prompt_eval_count?: number;
	eval_count?: number;
};

/**
 * Single ndjson event for streaming /api/generate responses
 */
export type GenerateStreamEvent = {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
	done_reason?: string;
	prompt_eval_count?: number;
	eval_count?: number;
};

/**
 * LM Studio (OpenAI-compatible) chat completion request body
 */
export type LmStudioChatRequest = {
	model: string;
	messages: Array<{role: string; content: string}>;
	stream: boolean;
	temperature?: number;
	top_p?: number;
	top_k?: number;
	min_p?: number;
	seed?: number;
	stop?: string | string[];
	max_tokens?: number;
};

/**
 * LM Studio (OpenAI-compatible) chat completion response
 */
export type LmStudioChatCompletionResponse = {
	id?: string;
	model?: string;
	choices?: Array<{
		index?: number;
		message?: {role?: string; content?: string};
		finish_reason?: string;
	}>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
};

/**
 * Single SSE chunk from LM Studio chat completion stream
 */
export type LmStudioChatCompletionChunk = {
	id?: string;
	model?: string;
	choices?: Array<{
		index?: number;
		delta?: {role?: string; content?: string};
		finish_reason?: string | null;
	}>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
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
