import apiFetch from '@wordpress/api-fetch';

interface CreatedPage {
	id: number;
}

/**
 * Portfolio-piece creation from hand-authored markup.
 *
 * One project, on a page of its own. Not a body of work — that is `add_gallery_page`, which puts many
 * images on one page and lets the visitor judge by looking. A piece is the other half of a portfolio:
 * one job, the picture of it, and the words that say what it was, who it was for, and what the user
 * actually did. A designer, an architect, a developer or a copywriter has work that means nothing as a
 * contact sheet, and until now the menu had nothing for them.
 *
 * NOT Jetpack's `jetpack-portfolio` custom post type, which is what the proof of concept opened
 * (`/post/new?type=jetpack-portfolio`). That CPT registers only when the `jetpack_portfolio` option is
 * on or the active theme declares support for it, and on a brand-new site with a block theme neither is
 * true — so the CPT is a dependency that is missing on exactly the sites this task exists to serve.
 * Gating the task on it hides the task from them; not gating it opens an editor for a post type that
 * does not exist. Enabling it from the CTA was the third way out and is the worst of the three: nothing
 * the client can reach writes that option on Simple and Atomic alike (`/jetpack/v4/settings` is the
 * Jetpack plugin's, absent on Simple; the WordPress.com settings endpoint is not the site's own REST
 * API), so it needs a new endpoint — and even with one, clicking "add a portfolio piece" would silently
 * restructure the site, adding an admin menu, two taxonomies and a CPT archive, then flushing rewrite
 * rules. The CPT is also from `classic-theme-helper`, and its display path (the `[portfolio]` shortcode,
 * its Customizer controls) is built for classic themes that ship portfolio templates; on the block theme
 * a new site has, a project would land somewhere the site never links to.
 *
 * A page has none of those problems, needs nothing enabled, and the block theme's navigation lists it —
 * the same route the contact, events and video pages already take.
 *
 * Not a block pattern either, for the reason the video page gave and more sharply: a pattern would put a
 * stranger's photograph on a page whose entire claim is "this is what I made". The rewrite pass would
 * not strip it, since it touches heading and paragraph text and an image is an attribute.
 */

/**
 * One empty image block: the work.
 *
 * The `<img alt=""/>` inside the figure is load-bearing and is NOT the same shape the video page uses.
 * core/video's `save()` emits a bare `<figure>` when it has no source, so
 * `<figure class="wp-block-video"></figure>` round-trips; core/image's `save()` always emits the `<img>`,
 * and the editor validates saved markup against that output. Running the shipped `@wordpress/blocks`
 * parser over block-library's real core/image registration in jsdom: `<!-- wp:image /-->` and
 * `<figure class="wp-block-image"></figure>` both parse `isValid: false`, which the user would meet as
 * "This block contains unexpected or invalid content" on a page we had just created for them, while the
 * form below parses `isValid: true`. It is byte-for-byte what core/image's own `save()` returns for a
 * block with no attributes, which is also what WordPress writes when an untouched Image block is saved.
 *
 * No attributes: `url`, `id`, `alt` and `caption` are all things only the user's own work can fill, and
 * there is nothing this page could put in `url` that would not be somebody else's photograph.
 *
 * No `placeholder` attribute either, and none is needed — core/image declares none. Rendering this
 * markup through a real editor canvas in jsdom shows the block already saying what goes in it: the label
 * "Image", the instruction "Drag and drop an image, upload, or choose from your library." and an Insert
 * from URL button.
 *
 * One, not several. A second image block would start to be a gallery, which is the task next door; a
 * project that needs more shots is one duplicate away in the editor.
 */
const IMAGE_BLOCK =
	'<!-- wp:image --><figure class="wp-block-image"><img alt=""/></figure><!-- /wp:image -->';

/**
 * One blank line for the story, and the prompt that says what belongs on it.
 *
 * The `placeholder` attribute is the events page's technique, and it is what makes the blank legible:
 * core/paragraph declares one, and RichText renders it greyed whenever the block is empty. Confirmed by
 * rendering this markup through a real BlockEditorProvider canvas in jsdom, which puts
 * `data-rich-text-placeholder` and `data-custom-placeholder="true"` on the paragraph. Without it the
 * line carries the editor's generic "Type / to choose a block", which says nothing about what a project
 * write-up needs. The attribute is editor-only — it lives in the block delimiter and renders nowhere on
 * the published page.
 *
 * The three things it asks for are the three that separate a piece from a gallery. They are also three
 * things no model has ever heard of, which is why this page ships no AI-written copy at all: unlike the
 * contact, events and video pages, it has no site-level line to open with. Its subject is one job.
 */
const DESCRIPTION_BLOCK =
	'<!-- wp:paragraph {"placeholder":"What this project was, who it was for, and what you did."} --><p></p><!-- /wp:paragraph -->';

/**
 * Create the portfolio piece as an untitled draft page: one empty image block, one prompted blank line.
 *
 * @param fetcher - Injectable request handler, so the node:test suite can stub the REST call.
 * @return The created page id and its editor URL.
 */
export async function createPortfolioPiece(
	fetcher: ( options: Parameters< typeof apiFetch >[ 0 ] ) => Promise< unknown > = apiFetch
): Promise< { page_id: number; edit_url: string } > {
	const page = ( await fetcher( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			// Deliberately empty, where the About/Gallery/Contact/Events/Videos pages all carry a fixed
			// English placeholder title. Those five name the page's role and are right as they stand. This
			// page's title is the project's name, which only the user has — so any string here would be an
			// invention on the most prominent line of the page, the same mistake the events page refuses to
			// make with dates. Empty leaves core's own "Add title" prompt at the top of the editor, which is
			// the first thing the user should be filling in anyway.
			title: '',
			content: [ IMAGE_BLOCK, DESCRIPTION_BLOCK ].join( '\n\n' ),
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { _wpcom_ai_launchpad_portfolio_piece: true },
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
