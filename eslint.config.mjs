import eslintConfigXo from 'eslint-config-xo';
import {globalIgnores} from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const config = [
	...eslintConfigXo(),
	eslintConfigPrettier,
	globalIgnores([
		'build/*',
		'dist/*',
		'.pnp.cjs',
		'.pnp.loader.mjs',
		'.yarn/*',
	]),
];

export default config;
