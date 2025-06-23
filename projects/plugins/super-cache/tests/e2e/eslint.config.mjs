import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ), {
	rules: {
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-hyphen-before-param-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-param-type': 'off',
		'jsdoc/require-returns': 'off',
	},
} );
