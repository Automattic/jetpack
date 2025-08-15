/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { getImageOptionLabel } from '../../input-image-option/label';
/**
 * Types
 */
import type { BlockEditorStoreDispatch, BlockEditorStoreSelect } from '../../../types';

/**
 * Custom hook for adding new image choice blocks.
 *
 * @param {string} choicesClientId - The client ID of the choices container block.
 * @return {Function} Function to add a new choice block.
 */
export default function useAddImageOption( choicesClientId: string ): { addOption: () => void } {
	const { insertBlock } = useDispatch( blockEditorStore ) as BlockEditorStoreDispatch;
	const { getBlock } = useSelect( blockEditorStore, [] ) as BlockEditorStoreSelect;

	const addOption = useCallback( () => {
		// Get the current choices block
		const choicesBlock = getBlock( choicesClientId );

		// If there is no choices block, return
		if ( ! choicesBlock ) {
			return;
		}

		const newIndex = choicesBlock.innerBlocks.length + 1;
		const newChoiceBlock = createBlock(
			'jetpack/input-image-option',
			{
				label: getImageOptionLabel( newIndex ),
			},
			[
				createBlock( 'core/image', {
					scale: 'cover',
					aspectRatio: '1',
				} ),
			]
		);

		insertBlock( newChoiceBlock, choicesBlock.innerBlocks.length, choicesClientId );
	}, [ choicesClientId, insertBlock, getBlock ] );

	return { addOption };
}
