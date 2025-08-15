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
 * Custom hook for adding new image option blocks.
 *
 * @param {string} optionsClientId - The client ID of the options container block.
 * @return {Function} Function to add a new option block.
 */
export default function useAddImageOption( optionsClientId: string ): { addOption: () => void } {
	const { insertBlock } = useDispatch( blockEditorStore ) as BlockEditorStoreDispatch;
	const { getBlock } = useSelect( blockEditorStore, [] ) as BlockEditorStoreSelect;

	const addOption = useCallback( () => {
		// Get the current options block
		const optionsBlock = getBlock( optionsClientId );

		// If there is no options block, return
		if ( ! optionsBlock ) {
			return;
		}

		const newIndex = optionsBlock.innerBlocks.length + 1;
		const newOptionBlock = createBlock(
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

		insertBlock( newOptionBlock, optionsBlock.innerBlocks.length, optionsClientId );
	}, [ optionsClientId, insertBlock, getBlock ] );

	return { addOption };
}
