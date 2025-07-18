import { fileURLToPath } from 'node:url';

/**
 * @type {import('stylelint').Config}
 */
const baseConfig = {
	extends: fileURLToPath( import.meta.resolve( '@wordpress/stylelint-config/scss-stylistic' ) ),
	rules: {
		'font-family-no-missing-generic-family-keyword': [
			true,
			{
				ignoreFontFamilies: [
					'dashicons', // https://github.com/WordPress/dashicons
					'FontAwesome', // https://fontawesome.com/icons, used by CRM
					'Genericons', // https://github.com/Automattic/genericons
					'Noticons', // WordPress.com internal font
					'social-logos', // see js-packages/social-logos
				],
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
				ignoreProperties: [ 'shadow-color' ], // Ignore property used by React Native.
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

		// Total stylistic violations remaining: 30996
		'@stylistic/at-rule-name-space-after': null, // 15
		'@stylistic/block-closing-brace-newline-after': null, // 7
		'@stylistic/block-closing-brace-newline-before': null, // 464
		'@stylistic/block-opening-brace-newline-after': null, // 425
		'@stylistic/block-opening-brace-space-before': null, // 900
		'@stylistic/color-hex-case': null, // 283
		'@stylistic/declaration-bang-space-after': null, // 4
		'@stylistic/declaration-bang-space-before': null, // 35
		'@stylistic/declaration-block-semicolon-newline-after': null, // 78
		'@stylistic/declaration-block-semicolon-space-before': null, // 6
		'@stylistic/declaration-block-trailing-semicolon': null, // 774
		'@stylistic/declaration-colon-newline-after': null, // 50
		'@stylistic/declaration-colon-space-after': null, // 2925
		'@stylistic/declaration-colon-space-before': null, // 5
		'@stylistic/function-comma-space-after': null, // 634
		'@stylistic/function-comma-space-before': null, // 2
		'@stylistic/function-parentheses-space-inside': null, // 5893
		'@stylistic/function-whitespace-after': null, // 1
		'@stylistic/indentation': null, // 11061
		'@stylistic/max-empty-lines': null, // 70
		'@stylistic/max-line-length': null, // 267
		'@stylistic/media-feature-colon-space-after': null, // 35
		'@stylistic/media-feature-colon-space-before': null, // 2
		'@stylistic/no-eol-whitespace': null, // 405
		'@stylistic/no-extra-semicolons': null, // 38
		'@stylistic/no-missing-end-of-source-newline': null, // 111
		'@stylistic/number-leading-zero': null, // 276
		'@stylistic/number-no-trailing-zeros': null, // 13
		'@stylistic/property-case': null, // 3
		'@stylistic/selector-attribute-brackets-space-inside': null, // 4
		'@stylistic/selector-combinator-space-after': null, // 1430
		'@stylistic/selector-combinator-space-before': null, // 1433
		'@stylistic/selector-list-comma-newline-after': null, // 1421
		'@stylistic/selector-list-comma-space-before': null, // 2
		'@stylistic/selector-max-empty-lines': null, // 1
		'@stylistic/selector-pseudo-class-parentheses-space-inside': null, // 216
		'@stylistic/string-quotes': null, // 1620
		'@stylistic/value-list-comma-newline-after': null, // 49
		'@stylistic/value-list-comma-space-after': null, // 49
	},
};

export default baseConfig;
