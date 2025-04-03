import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import deprecateFieldStyles from '../util/deprecate-field-styles';

// Legacy choice fields used inner blocks for only individual options.
// This function migrates that to use inner blocks for label + options,
// moving the previous individual option blocks under the new options block.
export default function migrateInnerOptionBlocks( attributes, innerBlocks, fieldType ) {
	const { restAttributes, labelStyles, optionStyles } = deprecateFieldStyles( attributes );

	const optionBlocks = innerBlocks.map( optionBlock =>
		createBlock( 'jetpack/option', {
			label: optionBlock.attributes.label,
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

	return [ restAttributes, newInnerBlocks ];
}
