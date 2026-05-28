import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * Soften JSDoc rules for `packages/formatters/**` so the initial port can
 * land with the upstream JSDoc style (descriptions on the function body,
 * not on per-param tags). Temporary — backfill proper JSDoc on the
 * helpers and remove this override (at which point this whole file can go
 * away).
 */
export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'packages/formatters/**' ],
	rules: {
		'jsdoc/require-description': 'off',
		'jsdoc/require-param': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/check-indentation': 'off',
	},
} );
