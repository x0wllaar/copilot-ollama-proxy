import type {FastifyRequest, FastifyReply} from 'fastify';

/**
 * Handler for /api/version endpoint
 */
export async function handleVersion(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<{version: string}> {
	return {version: '0.0.0'};
}
