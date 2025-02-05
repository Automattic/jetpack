import { createBlock } from '@wordpress/blocks';
import { cleanEmptyObject } from './util/clean-empty-object';

const deprecateLabelAndInputStyles = attributes => {
	const {
		borderColor,
		borderRadius,
		borderWidth,
		fieldBackgroundColor,
		fieldFontSize,
		inputColor,
		labelColor,
		labelFontSize,
		labelLineHeight,
		lineHeight,
		placeholder,
		...restAttributes
	} = attributes;

	const labelStyles = cleanEmptyObject( {
		color: { text: labelColor },
		typography: {
			fontSize: labelFontSize,
			lineHeight: labelLineHeight,
		},
	} );

	const inputStyles = cleanEmptyObject( {
		border: {
			color: borderColor,
			radius: borderRadius,
			style: 'solid',
			width: borderWidth,
		},
		color: {
			text: inputColor,
			background: fieldBackgroundColor,
		},
		typography: {
			fontSize: fieldFontSize,
			lineHeight: lineHeight,
		},
	} );

	return { restAttributes, labelStyles, inputStyles };
};

export const INNER_BLOCKS_DEPRECATION = {
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
	migrate: attributes => {
		const { restAttributes, labelStyles, inputStyles } = deprecateLabelAndInputStyles( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/field-label', {
				label: attributes.label,
				requiredText: attributes.requiredText,
				style: labelStyles,
			} ),
			createBlock( 'jetpack/field-input', {
				placeholder: attributes.placeholder,
				style: inputStyles,
			} ),
		];

		return [ restAttributes, newInnerBlocks ];
	},
	isEligible: ( attributes, innerBlocks ) => ! innerBlocks.length,
	save: () => null,
};

export const TEXTAREA_INNER_BLOCKS_DEPRECATION = {
	...INNER_BLOCKS_DEPRECATION,
	migrate( attributes ) {
		const { restAttributes, labelStyles, inputStyles } = deprecateLabelAndInputStyles( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/field-label', {
				label: attributes.label,
				requiredText: attributes.requiredText,
				style: labelStyles,
			} ),
			createBlock( 'jetpack/field-input', {
				placeholder: attributes.placeholder,
				style: inputStyles,
				type: 'textarea',
			} ),
		];

		return [ restAttributes, newInnerBlocks ];
	},
};

export const CHECKBOX_INNER_BLOCKS_DEPRECATION = {
	...INNER_BLOCKS_DEPRECATION,
	attributes: {
		...INNER_BLOCKS_DEPRECATION.attributes,
		label: {
			type: 'string',
			default: '',
			role: 'content',
		},
	},
	migrate( attributes ) {
		const { restAttributes, labelStyles, inputStyles } = deprecateLabelAndInputStyles( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/field-input', {
				style: inputStyles,
				type: 'checkbox',
				inline: true,
			} ),
			createBlock( 'jetpack/field-label', {
				label: attributes.label,
				requiredText: attributes.requiredText,
				style: labelStyles,
				inline: true,
			} ),
		];

		return [ restAttributes, newInnerBlocks ];
	},
};
