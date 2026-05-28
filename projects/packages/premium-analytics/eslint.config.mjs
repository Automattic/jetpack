import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * `packages/datetime/` is a near-verbatim port of
 * `next-woocommerce-analytics/packages/datetime/`. Forcing full JSDoc
 * on the port would add churn on each upstream re-sync without adding
 * clarity (param names match signatures). Soften the Jetpack profile
 * for the ported sources only.
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
