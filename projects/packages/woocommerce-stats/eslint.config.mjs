import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	// The report client keeps the JSDoc style of the dashboard package it came from.
	files: [ 'src/reports/**' ],
	rules: {
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-description': 'off',
		'jsdoc/require-param': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/check-indentation': 'off',
		'jsdoc/escape-inline-tags': 'off',
	},
} );
