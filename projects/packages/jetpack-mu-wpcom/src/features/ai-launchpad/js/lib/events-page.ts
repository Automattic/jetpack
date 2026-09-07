import apiFetch from '@wordpress/api-fetch';
import { paragraphsToBlocks } from './paragraph-blocks.ts';

interface CreatedPage {
	id: number;
}

/**
 * Events-page creation from hand-authored markup.
 *
 * Not built from the WordPress.com pattern library, for a harder reason than the contact page's. Every
 * events pattern in the library is a fabricated tour listing — "Austin, Texas / 12 Dec 2024", "Venue
 * Name / Cincinnati, OH", "Sept 18, 2025" — and every date in it falls between December 2024 and
 * September 2025, so using one verbatim publishes a page of expired events on day one. Rewriting the
 * slots does not rescue it either: the rewrite prompt has to leave dates, times, prices and addresses
 * alone, and no model can invent the dates of events it has never heard of.
 *
 * That is the shape of this task. The contact page could be finished markup because the payload — a
 * form — is the same for every site; an events page cannot be, because its payload is a list only the
 * user has. So what gets created is a scaffold: a heading, one AI-written line, and three blank event
 * entries the user types into. The right affordance for content only the user possesses is a visible
 * blank, not a plausible invention, which is why there is not one example date, venue or price in here,
 * not even as a placeholder.
 */

// Untranslated placeholder heading, in the same class as the "About", "Gallery" and "Contact" page
// titles: jetpack-mu-wpcom's JS strings are not extracted for translation, and the AI intro beside it is
// English-only for now. The user lands in the editor on it, which is where it gets changed.
const HEADING_BLOCK =
	'<!-- wp:heading --><h2 class="wp-block-heading">Upcoming events</h2><!-- /wp:heading -->';

/**
 * One blank event: a name, and a line for when and where it happens.
 *
 * Empty core blocks rather than example content. The `placeholder` attribute is what makes the blank
 * legible — core/heading and core/paragraph both declare one, and their RichText renders it, greyed,
 * whenever the block's text is empty, whether or not the block is selected. Without it the entries
 * would be an invisible run of empty lines carrying the editor's own generic prompts ("Heading", "Type
 * / to choose a block"), which says nothing about what belongs there. The attribute is editor-only: it
 * lives in the block delimiter and renders nowhere on the published page.
 *
 * A heading and a paragraph rather than a list, because the event name is a heading in every sense —
 * it is what the page's outline should show, and it is what a visitor scans for. The pair is also the
 * unit of deletion: an unused entry is two adjacent blocks to select and remove.
 */
const EVENT_ENTRY_BLOCKS = `<!-- wp:heading {"level":3,"placeholder":"Event name"} --><h3 class="wp-block-heading"></h3><!-- /wp:heading -->

<!-- wp:paragraph {"placeholder":"Date, time, and place"} --><p></p><!-- /wp:paragraph -->`;

/**
 * How many blank entries to leave.
 *
 * One reads as a single event to fill in, two as a pair; three is the smallest number that unmistakably
 * reads as "this repeats, add as many as you have". It is also cheap to walk back — a site with one
 * event deletes two entries — where too few would leave the user to work out how to build the third.
 */
const EVENT_ENTRY_COUNT = 3;

/**
 * Create the Events page as a draft: a heading, the AI-written intro line, and three blank event entries.
 *
 * @param intro   - The AI-written opening line, or undefined for an output persisted before
 *                `page_intros` existed and for a run where the model omitted the key. The page is
 *                then created without an intro paragraph — the scaffold is what the task is for.
 * @param fetcher - Injectable request handler, so the node:test suite can stub the REST call.
 * @return The created page id and its editor URL.
 */
export async function createEventsPage(
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
	blocks.push( ...Array( EVENT_ENTRY_COUNT ).fill( EVENT_ENTRY_BLOCKS ) );

	const page = ( await fetcher( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			// Untranslated placeholder title, like core's "Auto Draft" and the About/Gallery/Contact pages.
			title: 'Events',
			content: blocks.join( '\n\n' ),
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { _wpcom_ai_launchpad_events_page: true },
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
