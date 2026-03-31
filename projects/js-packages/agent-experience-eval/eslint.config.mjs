import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ), {
	rules: {
		'no-console': 'off',
		'n/no-process-exit': 'off',
	},
} );
