/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown from '../../components/ai-assistant-controls';

export function getStoreBlockId( clientId ) {
	return `ai-assistant-block-${ clientId }`;
}

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const { name: blockType } = props;

		const blockControlProps = {
			group: 'block',
		};

		/*
		 * CAUTION: code added before this line will be executed for all extended blocks,
		 * defined by the EXTENDED_BLOCKS constant in ../, not just the selected blocks.
		 * Code added above this line should be carefully evaluated for its impact on performance.
		 */
		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls { ...blockControlProps }>
					<AiAssistantDropdown blockType={ blockType } />
				</BlockControls>
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
