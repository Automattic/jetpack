import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import deprecateFieldStyles from '../util/deprecate-field-styles';

const isValidOption = value => typeof value === 'string' && value.trim().length > 0;

export default function migrateOptionsToInnerBlocks( attributes, fieldType ) {
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
}
