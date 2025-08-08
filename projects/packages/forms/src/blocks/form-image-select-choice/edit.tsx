/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
/**
 * Types
 */
import type { Block } from '../../types';

export default function ImageChoiceFieldEdit( props ) {
	const { attributes, clientId, isSelected } = props;
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected, imageBlockAttributes, choiceIndex } = useSelect(
		select => {
			const { getBlock, hasSelectedInnerBlock, getBlockRootClientId } = select(
				blockEditorStore
			) as {
				getBlock: ( clientId: string ) => Block;
				hasSelectedInnerBlock: ( clientId: string, isInnerBlock: boolean ) => boolean;
				getBlockRootClientId: ( clientId: string ) => string;
			};
			const currentBlock = getBlock( clientId );
			const parentClientId = getBlockRootClientId( clientId );
			const parentBlock = getBlock( parentClientId );
			const index = parentBlock?.innerBlocks.findIndex( block => block.clientId === clientId ) + 1;

			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				imageBlockAttributes: currentBlock?.innerBlocks[ 1 ]?.attributes,
				choiceIndex: index || 1,
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-form-image-select-choice', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-image': !! imageBlockAttributes?.url,
		} ),
		style: blockStyle,
	} );

	const template = useMemo( () => {
		return [
			[
				'jetpack/label',
				{
					label: sprintf(
						// translators: %d is the number of the image choice field.
						__( 'Image choice %d', 'jetpack-forms' ),
						choiceIndex
					),
				},
			],
			[ 'core/image' ],
		];
	}, [ choiceIndex ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-image-choice__wrapper' },
		{
			allowedBlocks: [ 'jetpack/label', 'core/image' ],
			template,
			templateLock: 'all', // The choice must have exactly one label and one image.
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
		</div>
	);
}
