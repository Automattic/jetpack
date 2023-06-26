/**
 * External dependencies
 */
import { createBlock, getBlockContent } from '@wordpress/blocks';
import TurndownService from 'turndown';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '../extensions/ai-assistant';
/**
 * Types
 */
import { PromptItemProps } from '../lib/prompt';

const turndownService = new TurndownService( { emDelimiter: '_' } );

const from = [];

export function transfromToAIAssistantBlock( { content, blockType } ) {
	// Create a temporary block to get the HTML content.
	const temporaryBlock = createBlock( blockType, { content } );
	const htmlContent = getBlockContent( temporaryBlock );

	// Convert the content to markdown.
	content = turndownService.turndown( htmlContent );

	// Create a pair of user/assistant messages.
	const messages: Array< PromptItemProps > = [
		{
			role: 'user',
			content: 'Tell me some content for this block, please.',
		},
		{
			role: 'assistant',
			content,
		},
	];

	return createBlock( blockName, { content, messages } );
}

/*
 * Create individual transform handler for each block type.
 */
for ( const blockType of EXTENDED_BLOCKS ) {
	from.push( {
		type: 'block',
		blocks: [ blockType ],
		isMatch: () => isPossibleToExtendBlock(),
		transform: ( { content } ) => transfromToAIAssistantBlock( { content, blockType } ),
	} );
}

export default { from };
