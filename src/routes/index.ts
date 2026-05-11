import {handleVersion, handleTags, handleShow} from './handlers.js';
import {handleProxy} from './proxy-handler.js';
import type {FastifyInstance} from 'fastify';

/**
 * Register all routes with the Fastify server
 */
export async function registerRoutes(
	server: FastifyInstance,
): Promise<void> {
	// 1. Check Server Version
	server.get(
		'/api/version',
		{
			schema: {
				response: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					200: {
						type: 'object',
						properties: {
							version: {type: 'string'},
						},
					},
				},
			},
		},
		handleVersion,
	);

	// 2. List Models
	server.get(
		'/api/tags',
		{
			schema: {
				response: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					200: {
						type: 'object',
						properties: {
							models: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										model: {type: 'string'},
										name: {type: 'string'},
									},
								},
							},
						},
					},
				},
			},
		},
		handleTags,
	);

	// 3. Retrieve Model Information
	server.post(
		'/api/show',
		{
			schema: {
				body: {
					type: 'object',
					required: ['model'],
					properties: {
						model: {type: 'string'},
					},
				},
				response: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					200: {
						oneOf: [
							{
								type: 'object',
								properties: {
									template: {type: 'string'},
									capabilities: {
										type: 'array',
										items: {type: 'string'},
									},
									details: {
										type: 'object',
										properties: {
											family: {type: 'string'},
										},
									},
									// eslint-disable-next-line @typescript-eslint/naming-convention
									model_info: {
										type: 'object',
										additionalProperties: true,
									},
								},
							},
							{
								type: 'object',
								properties: {
									error: {type: 'string'},
								},
							},
						],
					},
				},
			},
		},
		handleShow,
	);

	// Default Proxy Route - forwards all other requests to LM Studio
	server.all('*', {}, handleProxy);
}
