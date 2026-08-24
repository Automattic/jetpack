import apiFetch from '@wordpress/api-fetch';
import { paragraphsToBlocks } from './paragraph-blocks.ts';

interface CreatedPage {
	id: number;
}

/**
 * Contact-page creation from hand-authored markup.
 *
 * Deliberately not built from the WordPress.com pattern library — the first page task to refuse it,
 * and the gallery has since followed. The library carries no topical tags at all (every tag is
 * structural), so niche scoring could never fire for a contact page, and production logging bore that
 * out: the picks came back `picked_score: 0, fallback: first_usable`. The pattern that would win for
 * "contact" is map-only, with no form on it, and ships a hardcoded San Francisco address and phone
 * number. A confident, specific, wrong address on a real business's contact page is worse than a
 * blank one.
 *
 * So the page is a heading, one AI-written line, and a form. The form is the whole payload and is
 * identical for every site; the intro is the only part worth tailoring, which is why it is the only
 * part the AI supplies.
 */

// Untranslated placeholder heading, in the same class as the "About" and "Gallery" page titles:
// jetpack-mu-wpcom's JS strings are not extracted for translation, and the AI intro beside it is
// English-only for now. The user lands in the editor on it, which is where it gets changed.
const HEADING_BLOCK =
	'<!-- wp:heading --><h2 class="wp-block-heading">Get in touch</h2><!-- /wp:heading -->';

/**
 * The form itself: name, email, message.
 *
 * Written in the flat, attribute-only field syntax rather than the label/input inner-block shape the
 * editor serializes today. That shape is an explicitly supported deprecation on every field block
 * (`INNER_BLOCKS_DEPRECATION`, eligible when a field has no inner blocks) whose `save` emits nothing,
 * so it validates without having to reproduce the current save output byte for byte — which is what
 * a hand-authored string would otherwise be pinned to across Jetpack Forms versions.
 *
 * No submit button block: Jetpack Forms renders its own translated submit button for a form that has
 * none, so leaving it out is both less markup to keep in step and the only way the button is
 * localized at all.
 */
const CONTACT_FORM_BLOCK = `<!-- wp:jetpack/contact-form -->
<!-- wp:jetpack/field-name {"label":"Name","required":true} /-->
<!-- wp:jetpack/field-email {"label":"Email","required":true} /-->
<!-- wp:jetpack/field-textarea {"label":"Message"} /-->
<!-- /wp:jetpack/contact-form -->`;

/**
 * Create the Contact page as a draft: a heading, the AI-written intro line, and a Jetpack contact form.
 *
 * @param intro   - The AI-written opening line, or undefined for an output persisted before
 *                `page_intros` existed and for a run where the model omitted the key. The page is
 *                then created without an intro paragraph — the form is what the task is for.
 * @param fetcher - Injectable request handler, so the node:test suite can stub the REST call.
 * @return The created page id and its editor URL.
 */
export async function createContactPage(
	intro: string | undefined,
	fetcher: ( options: Parameters< typeof apiFetch >[ 0 ] ) => Promise< unknown > = apiFetch
): Promise< { page_id: number; edit_url: string } > {
	const line = intro?.trim();
	const blocks = [ HEADING_BLOCK ];
	if ( line ) {
		// Through the shared helper, so the AI text is escaped exactly as the About and first-post
		// drafts escape theirs.
		blocks.push( paragraphsToBlocks( [ line ] ) );
	}
	blocks.push( CONTACT_FORM_BLOCK );

	const page = ( await fetcher( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			// Untranslated placeholder title, like core's "Auto Draft" and the About/Gallery pages.
			title: 'Contact',
			content: blocks.join( '\n\n' ),
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { _wpcom_ai_launchpad_contact_page: true },
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
