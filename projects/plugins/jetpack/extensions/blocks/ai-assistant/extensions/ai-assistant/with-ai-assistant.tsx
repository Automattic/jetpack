/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, { KEY_ASK_AI_ASSISTANT } from '../../components/ai-assistant-controls';
import { getBlockTextContent } from '../../lib/utils/block-content';
/*
 * Types
 */

export function getStoreBlockId( clientId ) {
	return `ai-assistant-block-${ clientId }`;
}

export function getBlocksContent( blocks ) {
	return blocks
		.filter( block => block != null ) // Safeguard against null or undefined blocks
		.map( block => getBlockTextContent( block.clientId ) )
		.join( '\n\n' );
}
/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const { name: blockType } = props;

		/*
		 * Set exclude dropdown options.
		 * - Exclude "Ask AI Assistant" for core/list-item block.
		 */
		const exclude = [];
		if ( blockType === 'core/list-item' ) {
			exclude.push( KEY_ASK_AI_ASSISTANT );
		}

		const blockControlProps = {
			group: 'block',
		};

		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls { ...blockControlProps }>
					<AiAssistantDropdown blockType={ blockType } disabled={ false } exclude={ exclude } />
				</BlockControls>
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
