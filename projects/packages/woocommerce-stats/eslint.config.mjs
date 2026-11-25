import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url ),
	{
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
	},
	{
		// One block for both paths: a second `files` entry naming `no-restricted-imports` again would replace this rule rather than add to it.
		files: [ 'src/**', 'widgets/**' ],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							// Stylesheet side-effect imports are plain CSS, so they stay allowed.
							regex: '^(@automattic/charts|@wordpress/ui|@wordpress/dataviews)(/(?!.*\\.css$).*)?$',
							message:
								"Import these from @automattic/jetpack-premium-analytics-sdk instead: the dashboard serves them once, and a direct import bundles a second copy that fails in production. Missing an export? Add it to the facade in the Premium Analytics sdk package, not to this package's dependencies.",
						},
						{
							regex: '^@base-ui/react(/.*)?$',
							message:
								'Base UI is what @wordpress/ui builds on, and the dashboard already serves it. Take what you need from @automattic/jetpack-premium-analytics-sdk instead.',
						},
						{
							regex: '^@jetpack-premium-analytics/.*$',
							message:
								'These aliases are dashboard-internal and resolve only inside the Premium Analytics package. Import from @automattic/jetpack-premium-analytics-sdk instead.',
						},
					],
				},
			],
		},
	}
);
