import type { FirstPostDraft } from './types.ts';

/**
 * Stream F replaces this body with a real POST /wp/v2/posts call.
 */
export async function createFirstPostDraft(
	draft: FirstPostDraft // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise< { post_id: number; edit_url: string } > {
	return { post_id: 0, edit_url: '' };
}
