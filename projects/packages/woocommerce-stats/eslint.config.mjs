import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'src/reports/**' ],
	rules: {
		'jsdoc/require-description': 'off',
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-param': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/check-indentation': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
	},
} );
