/**
 * External dependencies
 */
import { createBlock, getSaveContent } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '../extensions/ai-assistant';
import { areBackendPromptsEnabled } from '../lib/prompt';
import turndownService from '../lib/turndown';
/**
 * Types
 */
import type { ExtendedBlockProp } from '../extensions/ai-assistant';
import type { PromptItemProps } from '../lib/prompt';

const from: unknown[] = [];

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

	// A list of messages to start with
	const messages: Array< PromptItemProps > = [];

	// If the backend prompts are enabled, add the relevant content prompt.
	if ( areBackendPromptsEnabled ) {
		messages.push( {
			role: 'jetpack-ai',
			context: {
				type: 'ai-assistant-relevant-content',
				content: aiAssistantBlockcontent,
			},
		} );
	} else {
		messages.push( {
			role: 'user',
			content: 'Tell me some content for this block, please.',
		} );

		messages.push( {
			role: 'assistant',
			content: aiAssistantBlockcontent,
		} );
	}

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
