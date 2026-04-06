/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Configuration Constants
 */
import process from 'node:process';

export const LISTEN_PORT = Number(process.env.COPRX_LISTEN_PORT ?? 11_434);
export const LM_STUDIO_URL =
	process.env.COPRX_LM_STUDIO_URL ?? 'http://localhost:1234';
