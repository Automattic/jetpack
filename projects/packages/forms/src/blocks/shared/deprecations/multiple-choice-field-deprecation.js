import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import deprecateFieldStyles from '../util/deprecate-field-styles';
import INNER_BLOCKS_DEPRECATION from './inner-blocks-deprecation';

// Storing in variables to avoid JS mangling breaking translation calls
const severalOptionsDefault = __( 'Choose several options', 'jetpack-forms' );
const oneOptionDefault = __( 'Choose one option', 'jetpack-forms' );

const isValidOption = value => typeof value === 'string' && value.trim().length > 0;

export default function multiFieldV1( fieldType ) {
	return {
		attributes: {
			...INNER_BLOCKS_DEPRECATION.attributes,
			label: {
				type: 'string',
				default: fieldType === 'checkbox' ? severalOptionsDefault : oneOptionDefault,
			},
		},
		supports: INNER_BLOCKS_DEPRECATION.supports,
		migrate: attributes => {
			const { restAttributes, labelStyles, optionStyles } = deprecateFieldStyles( attributes );
			const { options, ...migratedAttributes } = restAttributes;

			const nonEmptyOptions = options ? options.filter( option => isValidOption( option ) ) : [];
			const optionBlocks = nonEmptyOptions.map( option =>
				createBlock( 'jetpack/option', {
					label: option,
					defaultLabel: __( 'Add option…', 'jetpack-forms' ),
					style: optionStyles,
				} )
			);

			const newInnerBlocks = [
				createBlock( 'jetpack/label', {
					label: attributes.label,
					requiredText: attributes.requiredText,
					style: labelStyles,
				} ),
				createBlock( 'jetpack/options', { type: fieldType }, optionBlocks ),
			];

			return [ migratedAttributes, newInnerBlocks ];
		},
		save: () => null,
	};
}
