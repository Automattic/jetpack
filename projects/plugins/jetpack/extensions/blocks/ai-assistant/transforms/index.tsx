/**
 * External dependencies
 */
import { renderMarkdownFromHTML } from '@automattic/jetpack-ai-client';
import { createBlock, getSaveContent } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import metadata from '../block.json';
/**
 * Types
 */
import type { ExtendedBlockProp } from '../extensions/constants';
import type { PromptItemProps } from '../lib/prompt';

export const TRANSFORMABLE_BLOCKS = [ 'core/heading', 'core/paragraph', 'core/list' ];

const from: unknown[] = [];

/**
 * Return an AI Assistant block instance from a given block type.
 *
 * @param {ExtendedBlockProp} blockType - Block type.
 * @param {object}            attrs     - Block attributes.
 * @return {object}                      AI Assistant block instance.
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
	const aiAssistantBlockcontent = renderMarkdownFromHTML( { content: htmlContent } );

	// A list of messages to start with
	const messages: Array< PromptItemProps > = [];

	messages.push( {
		role: 'jetpack-ai',
		context: {
			type: 'ai-assistant-relevant-content',
			content: aiAssistantBlockcontent,
		},
	} );

	return createBlock( metadata.name, {
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
for ( const blockType of TRANSFORMABLE_BLOCKS ) {
	from.push( {
		type: 'block',
		blocks: [ blockType ],
		isMatch: () => TRANSFORMABLE_BLOCKS.includes( blockType ),
		transform: ( attrs, innerBlocks ) => {
			const content = getSaveContent( blockType, attrs, innerBlocks );
			return transformToAIAssistantBlock( blockType as ExtendedBlockProp, { ...attrs, content } );
		},
	} );
}

export default { from };
