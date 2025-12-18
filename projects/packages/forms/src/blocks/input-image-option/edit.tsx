/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
	RichText,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useAddImageOption from '../shared/hooks/use-add-image-option.ts';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles.js';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes.js';
import { getImageOptionLetter } from './label.tsx';
/**
 * Types
 */
import type { BlockEditorStoreSelect } from '../../types/index.ts';

// Attributes synced with other image option blocks.
const SYNCED_ATTRIBUTE_KEYS = [
	'backgroundColor',
	'borderColor',
	'textColor',
	'fontSize',
	'style',
];

export default function ImageOptionInputEdit( props ) {
	const { clientId, context, name, attributes, setAttributes } = props;
	const { 'jetpack/field-share-attributes': isSynced } = context;
	const { label } = attributes;

	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );

	const { 'jetpack/field-image-select-is-supersized': isSupersized } = context || {};

	const { positionIndex, positionLetter, rowOptionsCount, parentId } = useSelect(
		select => {
			const blockEditor = select( blockEditorStore ) as BlockEditorStoreSelect;
			const { getBlock } = blockEditor;

			const parentClientIds = blockEditor.getBlockParentsByBlockName(
				clientId,
				'jetpack/fieldset-image-options'
			);
			const parentBlockId = parentClientIds[ parentClientIds.length - 1 ];
			const parentBlock = getBlock( parentBlockId );

			// Find position within parent's inner blocks
			const position =
				parentBlock.innerBlocks.findIndex( block => block.clientId === clientId ) + 1;

			// Compute the number of options per row to set the element width
			const totalOptionsCount = parentBlock.innerBlocks.length;
			// Those values are halved on mobile via CSS media query
			const maxImagesPerRow = isSupersized ? 2 : 4;
			const rowSiblingCount = Math.min( totalOptionsCount, maxImagesPerRow );

			return {
				positionIndex: position,
				positionLetter: getImageOptionLetter( position ),
				rowOptionsCount: rowSiblingCount,
				parentId: parentBlockId,
			};
		},
		[ clientId, isSupersized ]
	);

	const { addOption } = useAddImageOption( parentId );

	// Handle key events to prevent newlines and add new option on Enter
	const handleKeyDown = useCallback(
		( event: KeyboardEvent ) => {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				addOption( positionIndex );
			}
		},
		[ addOption, positionIndex ]
	);

	// Filter pasted content to remove newlines
	const handlePaste = useCallback(
		( event: ClipboardEvent ) => {
			event.preventDefault();

			const pastedText = event.clipboardData?.getData( 'text/plain' ) || '';
			const cleanText = pastedText.replace( /[\r\n]+/g, ' ' ).trim();

			if ( cleanText ) {
				setAttributes( { label: cleanText } );
			}
		},
		[ setAttributes ]
	);

	// Use the block's own synced attributes for styling
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-input-image-option', {
			'is-supersized': isSupersized,
		} ),
		style: {
			...blockStyle,
			'--row-options-count': rowOptionsCount >= 1 ? rowOptionsCount : 1,
		},
	} );

	const template = useMemo( () => {
		return [
			[
				'core/image',
				{
					scale: 'cover',
					aspectRatio: '1', // Square aspect ratio for uniform grid
					sizeSlug: isSupersized ? 'full' : 'medium',
				},
			],
		];
	}, [ isSupersized ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-input-image-option__wrapper' },
		{
			allowedBlocks: [ 'core/image' ],
			template,
			templateLock: 'all', // The option must have exactly one image.
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
			<div className="jetpack-input-image-option__label-wrapper">
				<div className="jetpack-input-image-option__label-code">{ positionLetter }</div>
				<RichText
					tagName="span"
					className="jetpack-input-image-option__label"
					value={ label }
					placeholder={ __( 'Add label', 'jetpack-forms' ) }
					__unstableDisableFormats
					onChange={ ( newLabel: string ) => setAttributes( { label: newLabel } ) }
					onKeyDown={ handleKeyDown }
					onPaste={ handlePaste }
				/>
			</div>
		</div>
	);
}
