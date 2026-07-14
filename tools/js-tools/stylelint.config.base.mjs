import { fileURLToPath } from 'node:url';

/**
 * @type {import('stylelint').Config}
 */
const baseConfig = {
	extends: fileURLToPath( import.meta.resolve( '@wordpress/stylelint-config/scss-stylistic' ) ),
	reportNeedlessDisables: true,
	plugins: [
		'@wordpress/theme/stylelint-plugins/no-unknown-ds-tokens',
		'@wordpress/theme/stylelint-plugins/no-setting-wpds-custom-properties',
		'@wordpress/theme/stylelint-plugins/no-token-fallback-values',
	],
	rules: {
		'plugin-wpds/no-unknown-ds-tokens': true,
		'plugin-wpds/no-setting-wpds-custom-properties': true,
		// Disabled globally: only wp-build dashboards configure `@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks`
		// which adds fallbacks at build time.
		'plugin-wpds/no-token-fallback-values': null,
		// In addition to what `@wordpress/stylelint-config/scss-stylistic` does by default, also ignore comments containing /stylelint-disable/.
		'@stylistic/max-line-length': [
			80,
			{
				ignore: 'non-comments',
				ignorePattern: [
					'/(https?://[0-9,a-z]*.*)|(^description:.+)|(^tags:.+)/i',
					'/stylelint-disable/',
				],
			},
		],

		'font-family-no-missing-generic-family-keyword': [
			true,
			{
				ignoreFontFamilies: [
					'dashicons', // https://github.com/WordPress/dashicons
					'Genericons', // https://github.com/Automattic/genericons
					'Noticons', // WordPress.com internal font
					'social-logos', // see js-packages/social-logos
				],
			},
		],

		// Stylelint allows `0px` in math-type functions, but sometimes those math-type functions are
		// passed vars instead of hard-coded values, and we need to prevent those from being unitless.
		'length-zero-no-unit': [
			true,
			{
				ignore: [ 'custom-properties' ],
			},
		],

		// In theory this is a good rule, but in practice it's a massive lift to resolve existing violations.
		// Here's an example that has no good answers:
		// https://github.com/Automattic/jetpack/blob/86e27497d4b8e0736cae61c325f017dedad16dbb/projects/js-packages/components/components/button/style.module.scss#L73-L94
		//
		// Even Stylelint suggests disabling this rule if nesting is used:
		// https://github.com/stylelint/stylelint/issues/7844#issuecomment-2230857428
		'no-descending-specificity': null,

		'property-no-unknown': [
			true,
			{
				ignoreSelectors: [ ':export' ], // Ignore selector used by CSS Modules.
			},
		],

		// Disabled until a valid pattern has been decided on: https://github.com/WordPress/gutenberg/issues/28616
		'selector-class-pattern': null,

		// Disabled due to widespread inconsistent patterns throughout that would require coordinated changes across CSS, JS, and PHP across multiple repos.
		'selector-id-pattern': null,

		'selector-pseudo-class-no-unknown': [
			true,
			{
				ignorePseudoClasses: [ 'export', 'global' ], // Ignore pseudo-classes used by CSS Modules.
			},
		],

		'value-keyword-case': [
			'lower',
			{
				ignoreProperties: [ /^(--|\$)/ ], // Ignore CSS and SCSS vars.
				camelCaseSvgKeywords: true, // This is the overwhelming convention in our codebase and in core.
			},
		],
	},
	overrides: [
		{
			// Packages with `build:wp-build` in package.json.
			files: [
				'projects/packages/backup/routes/**/*.{css,scss,sass}',
				'projects/packages/forms/routes/**/*.{css,scss,sass}',
				'projects/packages/forms/src/dashboard/wp-build/**/*.{css,scss,sass}',
				'projects/packages/jetpack-mu-wpcom/routes/**/*.{css,scss,sass}',
				'projects/packages/newsletter/routes/**/*.{css,scss,sass}',
				'projects/packages/podcast/routes/**/*.{css,scss,sass}',
				'projects/packages/premium-analytics/routes/**/*.{css,scss,sass}',
				'projects/packages/publicize/routes/**/*.{css,scss,sass}',
				'projects/packages/scan/routes/**/*.{css,scss,sass}',
				'projects/packages/seo/routes/**/*.{css,scss,sass}',
				'projects/packages/videopress/routes/**/*.{css,scss,sass}',
			],
			rules: {
				'plugin-wpds/no-token-fallback-values': true,
			},
		},
	],
};

export default baseConfig;
