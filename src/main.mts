import {registerRoutes} from './routes/index.js';
import {LISTEN_PORT} from './config.js';
import Fastify, {type FastifyInstance} from 'fastify';

/**
 * Request Logging Hook
 * Logs all incoming requests to the console.
 */
function addRequestLogging(server: FastifyInstance): void {
	server.addHook('onRequest', async (request, reply) => {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] ${request.method} ${request.url}`);
	});
}

export async function main(): Promise<number> {
	// eslint-disable-next-line new-cap
	const server = Fastify();

	// Fallback JSON parser for requests that omit Content-Type: application/json
	// (e.g. `curl -d`, which defaults to application/x-www-form-urlencoded).
	// Real Ollama is permissive about this, so we mirror that behavior.
	server.addContentTypeParser(
		'*',
		{parseAs: 'string'},
		(_request, body: string, done) => {
			const trimmed = body.trim();
			if (trimmed === '') {
				done(null, {});
				return;
			}

			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const parsed = JSON.parse(trimmed);
				done(null, parsed);
			} catch (error) {
				done(error as Error, undefined);
			}
		},
	);

	// Add request logging hook
	addRequestLogging(server);

	// Register all routes
	await registerRoutes(server);

	// Setup graceful shutdown handling
	let onCloseResolve: () => void;
	const onClosePromise = new Promise<void>(resolve => {
		onCloseResolve = resolve;
	});

	server.addHook('onClose', (_instance, done) => {
		onCloseResolve();
		done();
	});

	// Start the server
	try {
		await server.listen({port: LISTEN_PORT, host: 'localhost'});
		console.log(
			`Ollama-compatible proxy running at http://localhost:${LISTEN_PORT}`,
		);
	} catch (error) {
		console.error('Failed to start Fastify server:', error);
		return 1;
	}

	await onClosePromise;

	return 0;
}
