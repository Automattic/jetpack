import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

// `src/` is vendored verbatim from WordPress core's `@wordpress/widget-primitives`.
// These rules conflict with core's house style; turning them off keeps the port
// faithful and avoids churn on every upstream re-sync. Drop once core publishes it.
export default defineConfig( makeBaseConfig( import.meta.url ), {
	rules: {
		'react/jsx-no-bind': 'off',
		'import/order': 'off',
		'no-shadow': 'off',
		'jsdoc/check-indentation': 'off',
		'jsdoc/escape-inline-tags': 'off',
		'jsdoc/require-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
	},
} );
