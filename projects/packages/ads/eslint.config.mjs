import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	// The widgets keep the JSDoc style of the dashboard package they came from,
	// and import the dashboard's link packages, whose deps are declared on the
	// parent manifest.
	files: [ 'widgets/**' ],
	rules: {
		'import/order': 'off',
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-description': 'off',
		'jsdoc/require-param': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/check-indentation': 'off',
		'jsdoc/escape-inline-tags': 'off',
		'import/no-extraneous-dependencies': 'off',
	},
} );
