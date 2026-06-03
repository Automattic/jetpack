import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * Soften JSDoc rules for `packages/datetime/**` so the initial port can
 * land. Temporary — backfill proper descriptions on the helpers and
 * remove this override (at which point this whole file can go away).
 */
export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'packages/datetime/**' ],
	rules: {
		'jsdoc/require-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/check-indentation': 'off',
	},
} );
