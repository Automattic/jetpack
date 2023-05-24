/**
 * External dependencies
 */
import { store as blockEditorStore, InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import React from 'react';
/**
 * Internal dependencies
 */
import GeneratePanel from './generate-panel';
import './style.scss';

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */

export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
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

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls>
					<GeneratePanel { ...props } blocksIds={ selectedBlocks } />
				</InspectorControls>
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
