/**
 * External dependencies
 */
import { createBlock, getSaveContent } from '@wordpress/blocks';
import TurndownService from 'turndown';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '../extensions/ai-assistant';
/**
 * Types
 */
import type { ExtendedBlockProp } from '../extensions/ai-assistant';
import type { PromptItemProps } from '../lib/prompt';

const turndownService = new TurndownService( { emDelimiter: '_', headingStyle: 'atx' } );

const from = [];

/**
 * Return an AI Assistant block instance from a given block type.
 *
 * @param {ExtendedBlockProp} blockType - Block type.
 * @param {object} attrs                - Block attributes.
 * @returns {object}                      AI Assistant block instance.
 */
export function transformToAIAssistantBlock( blockType: ExtendedBlockProp, attrs ) {
	const { content, ...restAttrs } = attrs;
	let htmlContent = content;

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
		...restAttrs,
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
		transform: ( attrs, innerBlocks ) => {
			const content = getSaveContent( blockType, attrs, innerBlocks );
			return transformToAIAssistantBlock( blockType, { ...attrs, content } );
		},
	} );
}

export default { from };
