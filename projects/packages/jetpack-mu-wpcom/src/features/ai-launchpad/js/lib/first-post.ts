import apiFetch from '@wordpress/api-fetch';
import type { FirstPostDraft } from './types.ts';

interface CreatedPost {
	id: number;
}

/**
 * Escape HTML-significant characters in plain text to keep AI-drafted output
 * from injecting markup (stored XSS) or breaking block delimiters.
 *
 * @param text - The plain text to escape.
 * @return The escaped text, safe to embed in HTML.
 */
function escapeHtml( text: string ): string {
	return text.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
}

/**
 * Wrap each paragraph in a Gutenberg paragraph block.
 *
 * @param paragraphs - The paragraph strings.
 * @return The serialized block markup.
 */
function toBlocks( paragraphs: string[] ): string {
	return paragraphs
		.map( text => '<!-- wp:paragraph --><p>' + escapeHtml( text ) + '</p><!-- /wp:paragraph -->' )
		.join( '\n\n' );
}

/**
 * Create a WordPress draft post from the AI-drafted first post, emitting content
 * as Gutenberg paragraph blocks.
 *
 * @param draft - The AI-drafted first post.
 * @return The created post id and its editor URL.
 */
export async function createFirstPostDraft(
	draft: FirstPostDraft
): Promise< { post_id: number; edit_url: string } > {
	const post = ( await apiFetch( {
		path: '/wp/v2/posts',
		method: 'POST',
		data: {
			title: draft.title,
			content: toBlocks( draft.paragraphs ),
			status: 'draft',
			// Tag as the AI Launchpad first post so the server can recognise this exact draft and show the
			// in-progress "Continue" treatment, reopening it instead of drafting a second one.
			meta: { _wpcom_ai_launchpad_first_post: true },
		},
	} ) ) as CreatedPost;

	return {
		post_id: post.id,
		edit_url: '/wp-admin/post.php?post=' + post.id + '&action=edit',
	};
}
