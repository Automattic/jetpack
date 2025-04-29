import { fileURLToPath } from 'node:url';

/**
 * @type {import('stylelint').Config}
 */
const baseConfig = {
	extends: fileURLToPath( import.meta.resolve( '@wordpress/stylelint-config/scss' ) ),
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

		// Disable all other rules for now.
		'scss/no-global-function-names': null,
		'scss/selector-no-redundant-nesting-selector': null,
	},
};

export default baseConfig;
