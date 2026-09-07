import apiFetch from '@wordpress/api-fetch';
import { paragraphsToBlocks } from './paragraph-blocks.ts';

interface CreatedPage {
	id: number;
}

/**
 * Video-page creation from hand-authored markup.
 *
 * Not built from the WordPress.com pattern library, and here that is a hard blocker rather than a
 * quality judgement. There is no video category to ask for — `?categories=video` answers
 * `{"error":"no_patterns"}` — and the only three video-ish patterns in the library are filed under
 * Gallery, each embedding a specific real third-party YouTube video (one id, `nGYGC6cxRlQ`, appears
 * four times across the library). Shipping one of those puts a stranger's video on the user's site,
 * which is a rights problem, and the slot-rewriting pass would not catch it: rewriting only touches
 * heading and paragraph text, and the video is an attribute. Niche scoring could not have picked a
 * better one anyway — the library carries no topical tags, and production Logstash reported
 * `picked_score: 0, fallback: first_usable` on every event, which is why the gallery page dropped the
 * library too and the scoring no longer exists.
 *
 * So the page is a heading, one AI-written line, and one empty video block.
 *
 * The block is core/video, not VideoPress. VideoPress is a plan-gated Jetpack module, so a page built
 * on it would have to declare a registry `is_visible` gate and be withheld from every site without the
 * plan — and since the earlier round dropped the VideoPress plugin-discovery task, this is the only
 * thing on the menu serving sites whose work is watched. core/video asks the site for nothing: it is a
 * core block present everywhere, and it accepts an upload or a URL. A site that also has VideoPress
 * loses nothing, since VideoPress registers its own block and transforms alongside core/video rather
 * than replacing it.
 */

// Untranslated placeholder heading, in the same class as the "About", "Gallery", "Contact" and
// "Upcoming events" page titles: jetpack-mu-wpcom's JS strings are not extracted for translation, and the
// AI intro beside it is English-only for now. The user lands in the editor on it, which is where it gets
// changed.
const HEADING_BLOCK =
	'<!-- wp:heading --><h2 class="wp-block-heading">Watch</h2><!-- /wp:heading -->';

/**
 * One empty video block, and nothing in it.
 *
 * No attributes: every attribute core/video has — `src`, `id`, `poster`, `caption` — is something only
 * the user's own video can fill in, and there is nothing this page could put in `src` that would not be
 * somebody else's video.
 *
 * The `<figure class="wp-block-video"></figure>` body is load-bearing, not decoration. It is exactly
 * what core/video's own `save()` emits for a block with no source, and the editor validates saved
 * markup against that output. Verified by running the shipped `@wordpress/blocks` parser over
 * core/video's real registration in jsdom: this form parses `isValid: true`, while the shorter
 * `<!-- wp:video /-->` parses `isValid: false` — which the user would meet as "This block contains
 * unexpected or invalid content" on a page we had just created for them.
 *
 * Nor does this need the `placeholder`-attribute treatment the events page's blank entries use.
 * core/video declares no `placeholder` attribute, and does not need one: rendering the same markup
 * through the real editor canvas shows the block's own media placeholder — the label "Video", the
 * instruction "Drag and drop a video, upload, or choose from your library.", a drop zone, an Upload
 * button and an Insert from URL button. The empty block already says what goes in it.
 *
 * One rather than a scaffold of several, unlike the events page. An events page is a list, where the
 * repetition is the content and a spare blank entry costs two lines; a video placeholder is a
 * full-width card, so three would be three identical grey boxes to scroll past and delete. A second
 * video is one duplicate away in the editor, and a page that opens with a single video is what a
 * showreel, a trailer or a first episode actually wants.
 */
const VIDEO_BLOCK = '<!-- wp:video --><figure class="wp-block-video"></figure><!-- /wp:video -->';

/**
 * Create the Videos page as a draft: a heading, the AI-written intro line, and one empty video block.
 *
 * @param intro   - The AI-written opening line, or undefined for an output persisted before
 *                `page_intros` existed and for a run where the model omitted the key. The page is
 *                then created without an intro paragraph — the video block is what the task is for.
 * @param fetcher - Injectable request handler, so the node:test suite can stub the REST call.
 * @return The created page id and its editor URL.
 */
export async function createVideoPage(
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
	blocks.push( VIDEO_BLOCK );

	const page = ( await fetcher( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			// Untranslated placeholder title, like core's "Auto Draft" and the About/Gallery/Contact/Events pages.
			title: 'Videos',
			content: blocks.join( '\n\n' ),
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { _wpcom_ai_launchpad_video_page: true },
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
