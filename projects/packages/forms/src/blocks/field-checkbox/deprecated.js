import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation';
import deprecateFieldStyles from '../shared/util/deprecate-field-styles';

export default [
	{
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
			const { restAttributes, labelStyles } = deprecateFieldStyles( attributes );
			const newInnerBlocks = [
				createBlock( 'jetpack/option', {
					label: attributes.label,
					placeholder: __( 'Add option…', 'jetpack-forms' ),
					isStandalone: true,
					style: labelStyles,
				} ),
			];

			return [ restAttributes, newInnerBlocks ];
		},
	},
];
