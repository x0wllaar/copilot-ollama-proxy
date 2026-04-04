import process from 'node:process';
import {main} from './main.mjs';

/* eslint-disable unicorn/prefer-top-level-await */

(async () => {
	try {
		const code = await main();
		process.exit(code); // eslint-disable-line unicorn/no-process-exit
	} catch (error) {
		console.error('Unrecoverable error');
		console.error(error);
		console.trace();
		process.exit(3); // eslint-disable-line unicorn/no-process-exit
	}
})();

/* eslint-enable unicorn/prefer-top-level-await */
