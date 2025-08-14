/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { getImageChoiceLabel } from '../form-image-select-choice/label';
import useAddImageChoice from '../shared/hooks/use-add-image-choice';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
/**
 * Types
 */
import type { BlockEditorStoreSelect } from '../../types';

export default function ImageChoiceFieldEdit( props ) {
	const { attributes, clientId, isSelected } = props;
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const { addChoice } = useAddImageChoice( clientId );

	const { isInnerBlockSelected } = useSelect(
		select => {
			const { hasSelectedInnerBlock } = select( blockEditorStore ) as BlockEditorStoreSelect;

			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-form-image-select-choices', {
			'is-selected': isSelected || isInnerBlockSelected,
		} ),
		style: blockStyle,
	} );

	// Starts with 3 empty choices.
	const template = [
		[ 'jetpack/form-image-select-choice', { label: getImageChoiceLabel( 1 ) } ],
		[ 'jetpack/form-image-select-choice', { label: getImageChoiceLabel( 2 ) } ],
		[ 'jetpack/form-image-select-choice', { label: getImageChoiceLabel( 3 ) } ],
	];

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-image-choices__wrapper' },
		{
			allowedBlocks: [ 'jetpack/form-image-select-choice' ],
			template,
			templateLock: false, // Allow adding, removing, and moving choices
			orientation: 'horizontal',
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />

			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ addChoice }>{ __( 'Add', 'jetpack-forms' ) }</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
		</div>
	);
}
