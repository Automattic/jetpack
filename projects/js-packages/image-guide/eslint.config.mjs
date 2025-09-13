import { makeBaseConfig, defineConfig, javascriptFiles } from 'jetpack-js-tools/eslintrc/base.mjs';
import svelteConfig from 'jetpack-js-tools/eslintrc/svelte.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), svelteConfig, {
	files: javascriptFiles,
	rules: {
		'space-in-parens': 'off',
		'computed-property-spacing': 'off',

		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-param-type': 'off',

		'import/order': 'off',
		'no-nested-ternary': 'off',
	},
} );
