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
export default function useAddImageOption( optionsClientId: string ): {
	newImageOption: () => {
		name: string;
		attributes: Record< string, unknown >;
	};
	addOption: () => void;
} {
	const { insertBlock } = useDispatch( blockEditorStore ) as BlockEditorStoreDispatch;
	const { getBlock, getBlocks } = useSelect( blockEditorStore, [] ) as BlockEditorStoreSelect;

	const childBlocksCount = getBlocks( optionsClientId ).length;

	const newImageOption = useCallback( () => {
		const newIndex = childBlocksCount + 1;

		return {
			name: 'jetpack/input-image-option',
			attributes: {
				label: getImageOptionLabel( newIndex ),
			},
		};
	}, [ childBlocksCount ] );

	const addOption = useCallback( () => {
		// Get the current options block
		const optionsBlock = getBlock( optionsClientId );

		// If there is no options block, return
		if ( ! optionsBlock ) {
			return;
		}

		const { name, attributes } = newImageOption();
		const newOptionBlock = createBlock( name, attributes );

		insertBlock( newOptionBlock, optionsBlock.innerBlocks.length, optionsClientId );
	}, [ getBlock, optionsClientId, newImageOption, insertBlock ] );

	return { newImageOption, addOption };
}
