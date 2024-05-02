/**
 * External dependencies
 */
import { renderMarkdownFromHTML, renderHTMLFromMarkdown } from '@automattic/jetpack-ai-client';
import { rawHandler } from '@wordpress/blocks';
import { select, dispatch } from '@wordpress/data';
/**
 * Types
 */
import type { BlockEditorSelect, IBlockHandler } from '../types';
import type { Block } from '@automattic/jetpack-ai-client';

export function getContent( html ) {
	return renderMarkdownFromHTML( { content: html } );
}

export function renderContent( markdown ) {
	return renderHTMLFromMarkdown( { content: markdown, rules: [] } );
}

export class HeadingHandler implements IBlockHandler {
	public block: Block;

	constructor( clientId: string ) {
		const { getBlock } = select( 'core/block-editor' ) as BlockEditorSelect;
		this.block = getBlock( clientId );
	}

	public onSuggestion( suggestion: string ): void {
		// Adjust suggestion if it does not start with a hash.
		if ( ! suggestion.startsWith( '#' ) ) {
			suggestion = `${ '#'.repeat(
				( this.block?.attributes?.level as number ) || 1
			) } ${ suggestion }`;
		}

		const HTML = renderContent( suggestion );
		this.replaceBlockContent( HTML );
	}

	private replaceBlockContent( newContent: string ): void {
		// Create a new block with the raw HTML content.
		const [ newBlock ] = rawHandler( { HTML: newContent } );
		if ( ! newBlock ) {
			return;
		}

		// Replace the original block attributes with the new block attributes.
		dispatch( 'core/block-editor' ).updateBlockAttributes(
			this.block.clientId as string,
			newBlock.attributes
		);
	}
}
