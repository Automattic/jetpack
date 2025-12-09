import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';
import { clsx } from 'clsx';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes.js';
import useVariationStyleProperties from '../shared/hooks/use-variation-style-properties.js';

const SYNCED_ATTRIBUTE_KEYS = [
	'backgroundColor',
	'borderColor',
	'fontFamily',
	'fontSize',
	'style',
	'textColor',
];

const TextareaEdit = ( { attributes, clientId, isSelected, name, setAttributes, context } ) => {
	const { 'jetpack/field-share-attributes': isSynced } = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );
	const { placeholder } = attributes;
	const variationProps = useVariationStyleProperties( {
		clientId,
		inputBlockName: name,
		inputBlockAttributes: attributes,
	} );
	const blockProps = useBlockProps( {
		className: 'jetpack-field__textarea',
		style: variationProps?.cssVars,
	} );

	const onChange = useCallback(
		event => {
			setAttributes( { placeholder: event.target.value } );
		},
		[ setAttributes ]
	);

	return (
		<textarea
			{ ...blockProps }
			onChange={ onChange }
			value={ isSelected ? placeholder : '' }
			placeholder={ placeholder }
		/>
	);
};

export default TextareaEdit;
