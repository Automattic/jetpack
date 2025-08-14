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
/**
 * Types
 */
import type { BlockEditorStoreSelect } from '../../types';

// Attributes synced with other image choice blocks.
const SYNCED_ATTRIBUTE_KEYS = [
	'backgroundColor',
	'borderColor',
	'textColor',
	'fontSize',
	'style',
];

export default function ImageChoiceFieldEdit( props ) {
	const { clientId, isSelected, context, name, attributes, setAttributes } = props;
	const { 'jetpack/field-share-attributes': isSynced } = context;
	const { label } = attributes;

	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );

	const { isInnerBlockSelected, imageBlockAttributes } = useSelect(
		select => {
			const { getBlock, hasSelectedInnerBlock } = select(
				blockEditorStore
			) as BlockEditorStoreSelect;

			const currentBlock = getBlock( clientId );

			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				imageBlockAttributes: currentBlock?.innerBlocks[ 1 ]?.attributes,
			};
		},
		[ clientId ]
	);

	const {
		'jetpack/field-image-select-is-supersized': isSupersized,
		'jetpack/field-image-select-show-labels': showLabels,
	} = context || {};

	// Use the block's own synced attributes for styling
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-form-image-select-choice', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-image': !! imageBlockAttributes?.url,
			'is-supersized': isSupersized,
			'hide-labels': ! showLabels,
		} ),
		style: blockStyle,
	} );

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
		{ className: 'jetpack-field-image-choice__wrapper' },
		{
			allowedBlocks: [ 'core/image' ],
			template,
			templateLock: 'all', // The choice must have exactly one image.
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
			<RichText
				tagName="span"
				className="jetpack-form-image-select-choice__label"
				value={ label }
				placeholder={ __( 'Add choice…', 'jetpack-forms' ) }
				__unstableDisableFormats
				onChange={ ( newLabel: string ) => setAttributes( { label: newLabel } ) }
			/>
		</div>
	);
}
