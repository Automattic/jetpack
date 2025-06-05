import { createBlock } from '@wordpress/blocks';
import deprecateFieldStyles from '../util/deprecate-field-styles';

const INNER_BLOCKS_DEPRECATION = {
	attributes: {
		label: {
			type: 'string',
			default: null,
		},
		required: {
			type: 'boolean',
			default: false,
		},
		requiredText: {
			type: 'string',
		},
		options: {
			type: 'array',
			default: [],
		},
		defaultValue: {
			type: 'string',
			default: '',
		},
		placeholder: {
			type: 'string',
			default: '',
		},
		id: {
			type: 'string',
			default: '',
		},
		width: {
			type: 'number',
			default: 100,
		},
		borderRadius: {
			type: 'number',
			default: '',
		},
		borderWidth: {
			type: 'number',
			default: '',
		},
		labelFontSize: {
			type: 'string',
		},
		fieldFontSize: {
			type: 'string',
		},
		lineHeight: {
			type: 'number',
		},
		labelLineHeight: {
			type: 'number',
		},
		inputColor: {
			type: 'string',
		},
		labelColor: {
			type: 'string',
		},
		fieldBackgroundColor: {
			type: 'string',
		},
		buttonBackgroundColor: {
			type: 'string',
		},
		buttonBorderRadius: {
			type: 'number',
			default: '',
		},
		buttonBorderWidth: {
			type: 'number',
			default: '',
		},
		borderColor: {
			type: 'string',
		},
		shareFieldAttributes: {
			type: 'boolean',
			default: true,
		},
	},
	supports: {
		reusable: false,
		html: false,
	},
	migrate: attributes => {
		const { restAttributes, labelStyles, inputStyles } = deprecateFieldStyles( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/label', {
				label: attributes.label,
				requiredText: attributes.requiredText,
				style: labelStyles,
			} ),
			createBlock( 'jetpack/input', {
				placeholder: attributes.placeholder,
				style: inputStyles,
			} ),
		];

		return [ restAttributes, newInnerBlocks ];
	},
	isEligible: ( _attributes, innerBlocks ) => ! innerBlocks.length,
	save: () => null,
};

export default INNER_BLOCKS_DEPRECATION;
