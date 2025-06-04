import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation';
import deprecateFieldStyles from '../shared/util/deprecate-field-styles';

export default [
	{
		...INNER_BLOCKS_DEPRECATION,
		attributes: {
			...INNER_BLOCKS_DEPRECATION.attributes,
			toggleLabel: {
				type: 'string',
				default: null,
				role: 'content',
			},
			options: {
				type: 'array',
				default: [ '' ],
				role: 'content',
			},
		},
		migrate( attributes ) {
			const { restAttributes, labelStyles, inputStyles } = deprecateFieldStyles( attributes );
			const { toggleLabel, ...newAttributes } = restAttributes;

			const labelBlock = createBlock( 'jetpack/label', {
				label: attributes.label,
				requiredText: attributes.requiredText,
				style: labelStyles,
			} );

			const inputBlock = createBlock( 'jetpack/input', {
				placeholder: toggleLabel ?? __( 'Select one option', 'jetpack-forms' ),
				style: inputStyles,
				type: 'dropdown',
			} );

			return [ newAttributes, [ labelBlock, inputBlock ] ];
		},
		isEligible( attributes, innerBlocks ) {
			const hasToggleLabel = attributes.toggleLabel && attributes.toggleLabel !== '';
			return hasToggleLabel || ! innerBlocks.length;
		},
	},
];
