/**
 * External dependencies
 */
import { HTMLToMarkdown } from '@automattic/jetpack-ai-client';
import { getBlockContent } from '@wordpress/blocks';
/**
 * Types
 */
import { BlockHandler } from '../block-handler';

const HTMLConverter = new HTMLToMarkdown( { fixes: [ 'paragraph' ] } );

export function getParagraphMarkdown( html: string ) {
	return HTMLConverter.render( { content: html } );
}

export class ParagraphHandler extends BlockHandler {
	constructor( clientId: string ) {
		super( clientId, [ 'paragraph' ] );
	}

	public getContent() {
		const block = this.getBlock();

		return getParagraphMarkdown( getBlockContent( block ) );
	}
}
