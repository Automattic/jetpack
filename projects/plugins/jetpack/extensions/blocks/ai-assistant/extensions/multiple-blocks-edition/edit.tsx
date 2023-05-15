/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import React from 'react';

/*
 * Extend the withMultipleBlocksEdition function of the block
 * to implement multiple blocks edition
 */
export const withMultipleBlocksEdition = BlockEdit => props => {
	// Check whether there are multiple blocks selected
	const { selectedBlocks } = useSelect( select => {
		const { getSelectedBlockClientIds, __unstableGetVisibleBlocks } = select( blockEditorStore );
		return {
			selectedBlocks: getSelectedBlockClientIds(),
			visibleBlocks: __unstableGetVisibleBlocks(),
		};
	}, [] );

	const selectedBlocksCount = selectedBlocks.length;
	if ( selectedBlocksCount < 2 ) {
		return <BlockEdit { ...props } />;
	}

	return <BlockEdit { ...props } />;
};

export default withMultipleBlocksEdition;
