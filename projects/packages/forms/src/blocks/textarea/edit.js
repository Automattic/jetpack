import { useBlockProps } from '@wordpress/block-editor';
import { ResizableBox } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
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

const TextareaEdit = ( {
	attributes,
	clientId,
	context,
	isSelected,
	name,
	setAttributes,
	toggleSelection,
} ) => {
	const { 'jetpack/field-share-attributes': isSynced } = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );
	const { placeholder, height } = attributes;
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
		<ResizableBox
			size={ {
				height,
			} }
			minHeight="200"
			enable={ {
				top: false,
				right: false,
				bottom: true,
				left: false,
				topRight: false,
				bottomRight: false,
				bottomLeft: false,
				topLeft: false,
			} }
			onResizeStop={ ( event, direction, elt, delta ) => {
				setAttributes( {
					height: height + delta.height,
				} );
				toggleSelection( true );
			} }
			onResizeStart={ () => {
				toggleSelection( false );
			} }
			isSelected={ isSelected }
		>
			<textarea
				{ ...blockProps }
				onChange={ onChange }
				value={ isSelected ? placeholder : '' }
				placeholder={ placeholder }
			/>
		</ResizableBox>
	);
};

export default TextareaEdit;
