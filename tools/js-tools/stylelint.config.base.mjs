import { fileURLToPath } from 'node:url';

/**
 * @type {import('stylelint').Config}
 */
const baseConfig = {
	extends: fileURLToPath( import.meta.resolve( '@wordpress/stylelint-config/scss' ) ),
	rules: {
		'selector-pseudo-class-no-unknown': [
			true,
			{
				ignorePseudoClasses: [ 'export', 'global' ],
			},
		],

		// Disable all other rules for now.
		'color-hex-length': null,
		'color-named': null,
		'declaration-block-no-duplicate-custom-properties': null,
		'declaration-block-no-duplicate-properties': null,
		'declaration-block-no-shorthand-property-overrides': null,
		'declaration-property-unit-allowed-list': null,
		'font-family-name-quotes': null,
		'font-family-no-duplicate-names': null,
		'font-family-no-missing-generic-family-keyword': null,
		'font-weight-notation': null,
		'function-linear-gradient-no-nonstandard-direction': null,
		'function-url-quotes': null,
		'keyframe-declaration-no-important': null,
		'length-zero-no-unit': null,
		'media-feature-name-no-unknown': null,
		'no-descending-specificity': null,
		'no-duplicate-at-import-rules': null,
		'no-duplicate-selectors': null,
		'no-empty-source': null,
		'no-invalid-position-at-import-rule': null,
		'property-no-unknown': null,
		'scss/at-extend-no-missing-placeholder': null,
		'scss/comment-no-empty': null,
		'scss/load-no-partial-leading-underscore': null,
		'scss/load-partial-extension': null,
		'scss/no-global-function-names': null,
		'scss/selector-no-redundant-nesting-selector': null,
		'selector-attribute-quotes': null,
		'selector-class-pattern': null,
		'selector-id-pattern': null,
		'selector-pseudo-element-colon-notation': null,
		'selector-type-no-unknown': null,
		'unit-no-unknown': null,
		'value-keyword-case': null,
	},
};

export default baseConfig;
