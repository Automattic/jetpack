import apiFetch from '@wordpress/api-fetch';
import { paragraphsToBlocks } from './paragraph-blocks.ts';

interface CreatedPage {
	id: number;
}

/**
 * Gallery-page creation from hand-authored markup.
 *
 * This is the page that used to be built from the WordPress.com pattern library, and it is the last
 * one on the menu that was. The library fetch, the niche scoring and the pattern pick are all gone,
 * for two reasons that are worth keeping written down.
 *
 * The scoring never worked. The library holds 552 patterns under 9 tags, and every one of those tags
 * is structural — `Pattern`, `Assembler`, `Layout` — with no topical tag anywhere; the pattern titles
 * are layout vocabulary too ("Gallery: Three images single row"). So the inferred niche had nothing to
 * match against: across the whole 66-pattern gallery pool, six realistic niches scored a maximum of 0.
 * Production Logstash said the same thing on every post-fix event — `picked_score: 0, fallback:
 * first_usable`. The one event that ever scored above zero did it before the stop-word fix, by
 * matching "and" and "the" against a pattern title, and picked a VIDEO pattern for a
 * wildlife-photography site. The only time the mechanism fired, it fired wrongly.
 *
 * And the pattern it always settled on ships three photographs hotlinked from
 * dotcompatterns.wordpress.com, carrying that site's own attachment ids ("id":16531). Every gallery
 * page created this way arrived with three images the user does not own, cannot manage in their media
 * library, cannot edit or delete, and which load from someone else's site for as long as the page
 * lives. On a page whose whole purpose is to show the user's own work, that is the worst place on the
 * menu to put a stranger's photographs — the same argument the video and portfolio-piece pages already
 * made, only here it was actually shipping.
 *
 * So the page is a heading, one AI-written line, and one empty gallery block: the same shape as the
 * contact, events and video pages, which makes all five content tasks consistent. It also takes a
 * ~2.7 MB fetch off the CTA path — the library was downloaded before the page could be created.
 */

// Untranslated placeholder heading, in the same class as the "About", "Gallery", "Contact", "Upcoming
// events" and "Watch" ones: jetpack-mu-wpcom's JS strings are not extracted for translation, and the AI
// intro beside it is English-only for now. The user lands in the editor on it, which is where it gets
// changed. An invitation rather than a label, because the page title is already "Gallery" and a heading
// repeating it says nothing — the pattern flow carried a whole de-duplication pass for exactly that.
const HEADING_BLOCK =
	'<!-- wp:heading --><h2 class="wp-block-heading">Take a look</h2><!-- /wp:heading -->';

/**
 * One empty gallery block, and nothing in it.
 *
 * No attributes: `images`, `ids` and `caption` are things only the user's own pictures can fill, and
 * `columns` and `linkTo` are defaults the editor writes for itself once they do. The old fallback
 * markup carried `{"linkTo":"none"}`, which is the block's own default and bought nothing.
 *
 * The class list is load-bearing rather than decoration, and which classes was found by execution, not
 * by reading. Running the shipped `@wordpress/blocks` parser over block-library's real core/gallery
 * registration in jsdom, the tidy self-closing `<!-- wp:gallery /-->` parses `isValid: false`, and so
 * does a figure carrying only `class="wp-block-gallery"`; the form below parses `isValid: true`.
 * The invalid forms would greet the user with "This block contains unexpected or invalid content" on a
 * page we had just created for them — the same trap the video page found with `<!-- wp:video /-->` and
 * the portfolio piece found with an image figure holding no `<img>`. The valid form is byte-for-byte
 * the body `blocks.serialize( blocks.createBlock( 'core/gallery' ) )` emits, which is what WordPress
 * itself writes when an untouched Gallery block is saved.
 *
 * No `placeholder` attribute, and none is possible: core/gallery declares none (its attribute list is
 * `images`, `ids`, `columns`, `caption`, `linkTo`, …). None is needed either. Rendering this markup
 * through a real BlockEditorProvider canvas in jsdom shows the block already saying what goes in it:
 * the label "Gallery", the instruction "Drag and drop images, upload, or choose from your library.", a
 * drop zone, an Upload button and a "Use attached images" button. So it is the core/image and
 * core/video case, not the core/heading and core/paragraph one the events page had to work around.
 */
const GALLERY_BLOCK =
	'<!-- wp:gallery --><figure class="wp-block-gallery has-nested-images columns-default is-cropped"></figure><!-- /wp:gallery -->';

/**
 * Create the Gallery page as a draft: a heading, the AI-written intro line, and one empty gallery block.
 *
 * @param intro   - The AI-written opening line, or undefined for an output persisted before
 *                `page_intros` existed and for a run where the model omitted the key. The page is
 *                then created without an intro paragraph — the gallery block is what the task is for.
 * @param fetcher - Injectable request handler, so the node:test suite can stub the REST call.
 * @return The created page id and its editor URL.
 */
export async function createGalleryPage(
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
	blocks.push( GALLERY_BLOCK );

	const page = ( await fetcher( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			// Untranslated placeholder title, like core's "Auto Draft" and the About/Contact/Events/Videos
			// pages. Unchanged from the pattern flow, which used it for the same reason: the pattern's own
			// name ("Gallery: Two columns…") was never a useful page title.
			title: 'Gallery',
			content: blocks.join( '\n\n' ),
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { _wpcom_ai_launchpad_gallery_page: true },
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
