import { store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { ResizableBox } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
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
	const { placeholder, style } = attributes;

	// Get height from style.dimensions.minHeight (global styles) or fallback to height attribute
	const minHeightFromStyle = style?.dimensions?.minHeight;
	const currentHeight = minHeightFromStyle
		? parseInt( minHeightFromStyle.replace( 'px', '' ), 10 ) || 200
		: attributes.height || 200;

	// Check if the parent block (e.g. textarea-field) is selected
	const isParentSelected = useSelect(
		select => {
			const { getBlockRootClientId, getSelectedBlockClientId } = select( blockEditorStore );
			const parentClientId = getBlockRootClientId( clientId );
			const selectedBlockClientId = getSelectedBlockClientId();
			return parentClientId && parentClientId === selectedBlockClientId;
		},
		[ clientId ]
	);

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
				height: currentHeight,
			} }
			minHeight={ '42' }
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
				const newHeight = currentHeight + delta.height;
				setAttributes( {
					style: {
						...style,
						dimensions: {
							...style?.dimensions,
							minHeight: `${ newHeight }px`,
						},
					},
				} );
				toggleSelection( true );
			} }
			onResizeStart={ () => {
				toggleSelection( false );
			} }
			showHandle={ isSelected || isParentSelected }
		>
			<textarea
				{ ...blockProps }
				onChange={ onChange }
				value={ isSelected ? placeholder : '' }
				placeholder={ placeholder }
				style={ { height: '100%' } }
			/>
		</ResizableBox>
	);
};

export default TextareaEdit;
