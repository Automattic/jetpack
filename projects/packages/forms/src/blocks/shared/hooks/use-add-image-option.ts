/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
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
	addOption: ( index?: number ) => void;
} {
	const { insertBlock } = useDispatch( blockEditorStore ) as BlockEditorStoreDispatch;
	const { getBlock } = useSelect( blockEditorStore, [] ) as BlockEditorStoreSelect;

	const newImageOption = useCallback( () => {
		return {
			name: 'jetpack/input-image-option',
			attributes: {
				label: '',
			},
		};
	}, [] );

	const addOption = useCallback(
		( index?: number ) => {
			// Get the current options block
			const optionsBlock = getBlock( optionsClientId );

			// If there is no options block, return
			if ( ! optionsBlock ) {
				return;
			}

			const { name, attributes } = newImageOption();
			const newOptionBlock = createBlock( name, attributes );

			if ( ! Number.isInteger( index ) || index < 0 || index > optionsBlock.innerBlocks.length ) {
				index = optionsBlock.innerBlocks.length;
			}

			insertBlock( newOptionBlock, index, optionsClientId );
		},
		[ getBlock, optionsClientId, newImageOption, insertBlock ]
	);

	return { newImageOption, addOption };
}
