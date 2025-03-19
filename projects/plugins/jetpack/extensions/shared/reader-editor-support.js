import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { getQueryArgs } from '@wordpress/url';
import { waitForEditor } from './wait-for-editor';

const { url, title, text, comment_content, comment_author, answer_prompt } = getQueryArgs(
	window.location.href
);

if ( url || answer_prompt ) {
	( async () => {
		// Wait for the editor to be initialized and the core blocks registered.
		await waitForEditor();

		// This enables functionality to "repost" from the reader, adding context like an embed of the
		// original post, and any extra comment or text data if applicable.
		if ( url ) {
			const blocks = [];

			if ( text && text !== title ) {
				const link = `<a href="${ url }">${ title }</a>`;
				blocks.push(
					createBlock( 'core/quote', {
						value: `<p>${ text }</p>`,
						citation: link,
					} )
				);
			}

			if ( comment_content ) {
				blocks.push(
					createBlock( 'core/quote', { value: comment_content, citation: comment_author } )
				);
			}
			blocks.push( createBlock( 'core/embed', { url, type: 'wp-embed' } ) );

			dispatch( 'core/editor' ).resetEditorBlocks( blocks );
		}
		// This enables funcionality for answering a daily prompt CTA (also available in the
		// reader), inserting the prompt block which also adds the corresponding tags.
		else if ( answer_prompt ) {
			dispatch( 'core/editor' ).resetEditorBlocks( [
				createBlock( 'jetpack/blogging-prompt', { promptId: answer_prompt } ),
			] );
		}
	} )();
}
