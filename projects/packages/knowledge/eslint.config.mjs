import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'routes/guidelines/**/*.{ts,tsx}' ],
	rules: {
		// Keep the upstream screen's callbacks and documentation intact for future ports.
		'react/jsx-no-bind': 'off',
		'jsdoc/require-jsdoc': 'off',
		'@wordpress/no-unsafe-wp-apis': [
			'error',
			{
				'@wordpress/components': [
					'__experimentalText',
					'__experimentalHeading',
					'__experimentalVStack',
					'__experimentalHStack',
					'__experimentalConfirmDialog',
				],
			},
		],
	},
} );
