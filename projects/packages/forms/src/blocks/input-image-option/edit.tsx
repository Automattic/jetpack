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
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';
import { getImageOptionLetter } from './label';
/**
 * Types
 */
import type { BlockEditorStoreSelect } from '../../types';

// Attributes synced with other image option blocks.
const SYNCED_ATTRIBUTE_KEYS = [
	'backgroundColor',
	'borderColor',
	'textColor',
	'fontSize',
	'style',
];

export default function ImageOptionInputEdit( props ) {
	const { clientId, isSelected, context, name, attributes, setAttributes } = props;
	const { 'jetpack/field-share-attributes': isSynced } = context;
	const { label } = attributes;

	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );

	const { isInnerBlockSelected, imageBlockAttributes, positionLetter } = useSelect(
		select => {
			const blockEditor = select( blockEditorStore ) as BlockEditorStoreSelect;
			const { getBlock, hasSelectedInnerBlock } = blockEditor;

			const currentBlock = getBlock( clientId );
			const parentClientIds = blockEditor.getBlockParentsByBlockName(
				clientId,
				'jetpack/fieldset-image-options'
			);
			const parentId = parentClientIds[ parentClientIds.length - 1 ];
			const parentBlock = getBlock( parentId );

			// Find position within parent's inner blocks
			const position =
				parentBlock.innerBlocks.findIndex( block => block.clientId === clientId ) + 1;

			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				imageBlockAttributes: currentBlock?.innerBlocks[ 1 ]?.attributes,
				positionLetter: getImageOptionLetter( position ),
			};
		},
		[ clientId ]
	);

	const {
		'jetpack/field-image-select-is-supersized': isSupersized,
		'jetpack/field-image-select-show-labels': showLabels,
		'jetpack/field-image-options-type': selectionType = 'radio',
	} = context || {};

	// Use the block's own synced attributes for styling
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-input-image-option', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-image': !! imageBlockAttributes?.url,
			[ `is-${ selectionType }` ]: !! selectionType,
			'is-supersized': isSupersized,
		} ),
		style: blockStyle,
	} );

	const labelClassName = useMemo( () => {
		return clsx( 'jetpack-input-image-option__label', {
			'visually-hidden': ! showLabels,
		} );
	}, [ showLabels ] );

	const template = useMemo( () => {
		return [
			[
				'core/image',
				{
					scale: 'cover',
					aspectRatio: '1', // Square aspect ratio for uniform grid
				},
			],
		];
	}, [] );

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
					className={ labelClassName }
					value={ label }
					placeholder={ __( 'Add option…', 'jetpack-forms' ) }
					__unstableDisableFormats
					onChange={ ( newLabel: string ) => setAttributes( { label: newLabel } ) }
				/>
			</div>
		</div>
	);
}
