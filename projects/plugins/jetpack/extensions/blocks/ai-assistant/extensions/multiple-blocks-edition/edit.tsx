/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import React from 'react';
/**
 * Internal dependencies
 */
import GeneratePanel from './generate-panel';
import './style.scss';

/*
 * Extend the withMultipleBlocksEdition function of the block
 * to implement multiple blocks edition
 */
export const withMultipleBlocksEdition = BlockEdit => props => {
	// Check whether there are multiple blocks selected
	const { selectedBlocks } = useSelect( select => {
		const { getSelectedBlockClientIds, __unstableGetVisibleBlocks } = select( 'core/block-editor' );
		return {
			selectedBlocks: getSelectedBlockClientIds(),
			visibleBlocks: __unstableGetVisibleBlocks(),
		};
	}, [] );

	const selectedBlocksCount = selectedBlocks.length;
	if ( selectedBlocksCount < 2 ) {
		return <BlockEdit { ...props } />;
	}

	return (
		<>
			<BlockEdit { ...props } />
			<InspectorControls>
				<GeneratePanel { ...props } blocksIds={ selectedBlocks } />
			</InspectorControls>
		</>
	);
};

export default withMultipleBlocksEdition;
