import { fileURLToPath } from 'node:url';

/**
 * @type {import('stylelint').Config}
 */
const baseConfig = {
	extends: fileURLToPath( import.meta.resolve( '@wordpress/stylelint-config/scss' ) ),
	rules: {
		// Allow some pseudo-classes that are needed for CSS modules.
		'selector-pseudo-class-no-unknown': [
			true,
			{
				ignorePseudoClasses: [ 'export', 'global' ],
			},
		],
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

		// Disabled until a valid pattern has been decided on: https://github.com/WordPress/gutenberg/issues/28616
		'selector-class-pattern': null,

		// Disable all other rules for now.
		'declaration-block-no-duplicate-properties': null,
		'declaration-property-unit-allowed-list': null,
		'function-url-quotes': null,
		'length-zero-no-unit': null,
		'no-descending-specificity': null,
		'no-duplicate-selectors': null,
		'property-no-unknown': null,
		'scss/at-extend-no-missing-placeholder': null,
		'scss/comment-no-empty': null,
		'scss/no-global-function-names': null,
		'scss/selector-no-redundant-nesting-selector': null,
		'selector-attribute-quotes': null,
		'selector-id-pattern': null,
		'value-keyword-case': null,
	},
};

export default baseConfig;
