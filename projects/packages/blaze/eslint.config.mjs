import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

// The dashboard under src/dashboard is ported verbatim from wp-calypso; keeping Calypso's style keeps re-syncs mechanical.
export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [
		'src/dashboard/promote-post-i2/**',
		'src/dashboard/data/**',
		'src/dashboard/lib/**',
		'src/dashboard/components/**',
		'src/dashboard/compat/components/**',
	],
	rules: {
		'jsdoc/require-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-param-type': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-returns-description': 'off',
		'react/jsx-no-bind': 'off',
		'no-nested-ternary': 'off',
		'@wordpress/no-unused-vars-before-return': 'off',
		'@wordpress/no-global-active-element': 'off',
		'wpcalypso/jsx-classname-namespace': 'off',
		'no-shadow': 'off',
		'no-prototype-builtins': 'off',
		'@tanstack/query/exhaustive-deps': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@wordpress/use-recommended-components': 'off',
		'jsx-a11y/label-has-associated-control': 'off',
	},
} );
