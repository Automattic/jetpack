import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * Soften JSDoc rules for `src/modules/**` so the initial port can land with the
 * upstream JSDoc style (descriptions on the function body, not per-param tags).
 * Temporary — backfill proper JSDoc on the module and remove this override.
 */
export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'src/modules/**' ],
	rules: {
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-hyphen-before-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-yields': 'off',
	},
} );
