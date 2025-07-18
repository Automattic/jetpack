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

		'@stylistic/at-rule-name-space-after': null,
		'@stylistic/block-closing-brace-newline-after': null,
		'@stylistic/block-closing-brace-newline-before': null,
		'@stylistic/block-opening-brace-newline-after': null,
		'@stylistic/block-opening-brace-space-before': null,
		'@stylistic/color-hex-case': null,
		'@stylistic/declaration-bang-space-after': null,
		'@stylistic/declaration-bang-space-before': null,
		'@stylistic/declaration-block-semicolon-newline-after': null,
		'@stylistic/declaration-block-semicolon-space-before': null,
		'@stylistic/declaration-block-trailing-semicolon': null,
		'@stylistic/declaration-colon-newline-after': null,
		'@stylistic/declaration-colon-space-after': null,
		'@stylistic/declaration-colon-space-before': null,
		'@stylistic/function-comma-space-after': null,
		'@stylistic/function-comma-space-before': null,
		'@stylistic/function-parentheses-space-inside': null,
		'@stylistic/function-whitespace-after': null,
		'@stylistic/indentation': null,
		'@stylistic/max-empty-lines': null,
		'@stylistic/max-line-length': null,
		'@stylistic/media-feature-colon-space-after': null,
		'@stylistic/media-feature-colon-space-before': null,
		'@stylistic/no-eol-whitespace': null,
		'@stylistic/no-extra-semicolons': null,
		'@stylistic/no-missing-end-of-source-newline': null,
		'@stylistic/number-leading-zero': null,
		'@stylistic/number-no-trailing-zeros': null,
		'@stylistic/property-case': null,
		'@stylistic/selector-attribute-brackets-space-inside': null,
		'@stylistic/selector-combinator-space-after': null,
		'@stylistic/selector-combinator-space-before': null,
		'@stylistic/selector-list-comma-newline-after': null,
		'@stylistic/selector-list-comma-space-before': null,
		'@stylistic/selector-max-empty-lines': null,
		'@stylistic/selector-pseudo-class-parentheses-space-inside': null,
		'@stylistic/string-quotes': null,
		'@stylistic/value-list-comma-newline-after': null,
		'@stylistic/value-list-comma-space-after': null,
	},
};

export default baseConfig;
