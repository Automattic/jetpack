import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation';
import deprecateFieldStyles from '../shared/util/deprecate-field-styles';

export default [
	{
		...INNER_BLOCKS_DEPRECATION,
		migrate( attributes ) {
			const { restAttributes, labelStyles, inputStyles } = deprecateFieldStyles( attributes );
			const newInnerBlocks = [
				createBlock( 'jetpack/label', {
					label: attributes.label ?? __( 'Message', 'jetpack-forms' ),
					requiredText: attributes.requiredText,
					style: labelStyles,
				} ),
				createBlock( 'jetpack/input', {
					placeholder: attributes.placeholder,
					style: inputStyles,
					type: 'textarea',
				} ),
			];

			return [ restAttributes, newInnerBlocks ];
		},
	},
];
