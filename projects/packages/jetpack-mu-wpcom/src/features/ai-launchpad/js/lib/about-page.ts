import apiFetch from '@wordpress/api-fetch';
import { paragraphsToBlocks } from './paragraph-blocks.ts';
import type { AboutPageDraft } from './types.ts';

interface CreatedPage {
	id: number;
}

/**
 * Create the About page as a draft from the AI-drafted content, emitted as Gutenberg
 * paragraph blocks.
 *
 * @param draft - The AI-drafted About page, or undefined for outputs persisted before the
 *              field existed — those get an empty shell the user fills in the editor.
 * @return The created page id and its editor URL.
 */
export async function createAboutPage(
	draft: AboutPageDraft | undefined
): Promise< { page_id: number; edit_url: string } > {
	// Untranslated placeholder title (like core's "Auto Draft"); the AI draft normally supplies it.
	const title = draft?.title ?? 'About';
	const content = draft ? paragraphsToBlocks( draft.paragraphs ) : '';

	const page = ( await apiFetch( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			title,
			content,
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { _wpcom_ai_launchpad_about_page: true },
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
