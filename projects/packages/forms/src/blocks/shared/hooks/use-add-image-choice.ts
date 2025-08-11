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
import { getImageChoiceLabel } from '../../form-image-select-choice/label';
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
export default function useAddImageChoice( choicesClientId: string ): { addChoice: () => void } {
	const { insertBlock } = useDispatch( blockEditorStore ) as BlockEditorStoreDispatch;
	const { getBlock } = useSelect( blockEditorStore, [] ) as BlockEditorStoreSelect;

	const addChoice = useCallback( () => {
		// Get the current choices block
		const choicesBlock = getBlock( choicesClientId );

		// If there is no choices block, return
		if ( ! choicesBlock ) {
			return;
		}

		const newIndex = choicesBlock.innerBlocks.length + 1;
		const newChoiceBlock = createBlock( 'jetpack/form-image-select-choice', {}, [
			createBlock( 'jetpack/label', {
				label: getImageChoiceLabel( newIndex ),
			} ),
			createBlock( 'core/image' ),
		] );

		insertBlock( newChoiceBlock, choicesBlock.innerBlocks.length, choicesClientId );
	}, [ choicesClientId, insertBlock, getBlock ] );

	return { addChoice };
}
