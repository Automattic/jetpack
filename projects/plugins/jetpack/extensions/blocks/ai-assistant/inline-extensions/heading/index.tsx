/**
 * External dependencies
 */
import { renderMarkdownFromHTML, renderHTMLFromMarkdown } from '@automattic/jetpack-ai-client';
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { select, dispatch } from '@wordpress/data';
/**
 * Types
 */
import type { BlockEditorDispatch, BlockEditorSelect, IBlockHandler } from '../types';
import type { Block } from '@automattic/jetpack-ai-client';

export function getMarkdown( html ) {
	return renderMarkdownFromHTML( { content: html } );
}

export function renderContent( markdown ) {
	return renderHTMLFromMarkdown( { content: markdown, rules: [] } );
}

export class HeadingHandler implements IBlockHandler {
	public clientId: string;
	public firstUpdate: boolean = true;

	constructor( clientId: string ) {
		this.clientId = clientId;
	}

	public getBlock(): Block {
		const { getBlock } = select( 'core/block-editor' ) as BlockEditorSelect;
		return getBlock( this.clientId );
	}

	public getContent() {
		const block = this.getBlock();
		return getMarkdown( getBlockContent( block ) );
	}

	public onSuggestion( suggestion: string ): void {
		const block = this.getBlock();

		// Adjust suggestion if it does not start with a hash.
		if ( ! suggestion.startsWith( '#' ) ) {
			suggestion = `${ '#'.repeat( ( block?.attributes?.level as number ) || 1 ) } ${ suggestion }`;
		}

		// Ignore an empty suggestion, that is, a suggestion that only contains hashes and spaces.
		if ( suggestion.match( /^#*\s*$/ ) ) {
			return;
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

		const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } = dispatch(
			'core/block-editor'
		) as BlockEditorDispatch;

		if ( ! this.firstUpdate ) {
			// Mark the change as not persistent so we can undo all the changes in one step.
			__unstableMarkNextChangeAsNotPersistent();
		} else {
			this.firstUpdate = false;
		}

		// Replace the original block attributes with the new block attributes.
		updateBlockAttributes( this.clientId, newBlock.attributes );
	}
}
