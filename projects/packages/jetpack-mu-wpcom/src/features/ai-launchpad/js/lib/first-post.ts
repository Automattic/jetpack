import apiFetch from '@wordpress/api-fetch';
import type { FirstPostDraft } from './types.ts';

interface CreatedPost {
	id: number;
}

/**
 * Wrap each paragraph in a Gutenberg paragraph block.
 *
 * @param paragraphs - The paragraph strings.
 * @return The serialized block markup.
 */
function toBlocks( paragraphs: string[] ): string {
	return paragraphs
		.map( text => '<!-- wp:paragraph --><p>' + text + '</p><!-- /wp:paragraph -->' )
		.join( '\n\n' );
}

/**
 * Create a WordPress draft post from the AI-drafted first post and return the
 * new post id with its block-editor URL. Content is emitted as Gutenberg
 * paragraph blocks so the editor opens with structured blocks, not raw HTML.
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
		},
	} ) ) as CreatedPost;

	return {
		post_id: post.id,
		edit_url: '/wp-admin/post.php?post=' + post.id + '&action=edit',
	};
}
