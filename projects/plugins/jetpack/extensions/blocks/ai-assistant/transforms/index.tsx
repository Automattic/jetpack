/**
 * External dependencies
 */
import { createBlock, getBlockContent } from '@wordpress/blocks';
import TurndownService from 'turndown';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import {
	EXTENDED_BLOCKS,
	ExtendedBlockProp,
	isPossibleToExtendBlock,
} from '../extensions/ai-assistant';
/**
 * Types
 */
import { PromptItemProps } from '../lib/prompt';

const turndownService = new TurndownService( { emDelimiter: '_', headingStyle: 'atx' } );

const from = [];

/**
 * Return an AI Assistant block instance from a given block type.
 *
 * @param {object} attrs                - Block attributes.
 * @param {ExtendedBlockProp} blockType - Block type.
 * @returns {object}                      AI Assistant block instance.
 */
export function transfromToAIAssistantBlock( attrs, blockType: ExtendedBlockProp ) {
	const { content, ...otherAttrs } = attrs;
	// Create a temporary block to get the HTML content.
	const temporaryBlock = createBlock( blockType, { content } );
	let htmlContent = getBlockContent( temporaryBlock );

	// core/heading custom transform handling.
	if ( blockType === 'core/heading' && attrs?.level ) {
		// Replace the HTML tags with the block level.
		htmlContent = htmlContent.replace( /<(\/?)h\d([^>]*)>/g, `<$1h${ attrs.level }$2>` );
	}

	// Convert the content to markdown.
	const aiAssistantBlockcontent = turndownService.turndown( htmlContent );

	// Create a pair of user/assistant messages.
	const messages: Array< PromptItemProps > = [
		{
			role: 'user',
			content: 'Tell me some content for this block, please.',
		},
		{
			role: 'assistant',
			content: aiAssistantBlockcontent,
		},
	];

	return createBlock( blockName, {
		...otherAttrs,
		content: aiAssistantBlockcontent,
		originalContent: aiAssistantBlockcontent,
		messages,
		originalMessages: messages,
	} );
}

/*
 * Create individual transform handler for each block type.
 */
for ( const blockType of EXTENDED_BLOCKS ) {
	from.push( {
		type: 'block',
		blocks: [ blockType ],
		isMatch: () => isPossibleToExtendBlock(),
		transform: attrs => transfromToAIAssistantBlock( attrs, blockType ),
	} );
}

export default { from };
