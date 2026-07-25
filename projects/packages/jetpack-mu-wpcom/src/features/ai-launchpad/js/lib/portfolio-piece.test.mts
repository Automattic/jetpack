import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createPortfolioPiece } from './portfolio-piece.ts';

type PageData = { title: string; content: string; status: string; meta: object };
type PageRequest = { path: string; method: string; data: PageData };

/**
 * Stub fetcher that records the request and returns a created page.
 *
 * @return The stub and its recorded requests.
 */
function stubFetcher() {
	const requests: PageRequest[] = [];
	const fetcher = async ( options: object ) => {
		requests.push( options as PageRequest );
		return { id: 42 };
	};
	return { fetcher, requests };
}

/**
 * Every block name the markup opens, in document order.
 *
 * @param content - The serialized block markup.
 * @return The block names, without the `wp:` prefix.
 */
function blockNames( content: string ): string[] {
	return [ ...content.matchAll( /<!-- wp:([a-z0-9/-]+)/g ) ].map( match => match[ 1 ] );
}

describe( 'createPortfolioPiece', () => {
	it( 'creates a marked draft page: one empty image block and one prompted blank line', async () => {
		const { fetcher, requests } = stubFetcher();
		const result = await createPortfolioPiece( fetcher );

		assert.deepEqual( result, { page_id: 42, edit_url: '/wp-admin/post.php?post=42&action=edit' } );
		const request = requests[ 0 ];
		assert.equal( request.path, '/wp/v2/pages' );
		assert.equal( request.method, 'POST' );
		assert.equal( request.data.status, 'draft' );
		assert.deepEqual( request.data.meta, { _wpcom_ai_launchpad_portfolio_piece: true } );

		// Pinned whole, like the contact, events and video pages', because the exact markup is the task.
		// Both halves were verified by running the shipped @wordpress/blocks parser over block-library's
		// real core registrations in jsdom — see the two tests below for what each one is guarding.
		assert.equal(
			request.data.content,
			`<!-- wp:image --><figure class="wp-block-image"><img alt=""/></figure><!-- /wp:image -->

<!-- wp:paragraph {"placeholder":"What this project was, who it was for, and what you did."} --><p></p><!-- /wp:paragraph -->`
		);
	} );

	it( 'leaves the page title empty rather than inventing one', async () => {
		// The one place this page deliberately breaks with the other four. "Contact", "Events",
		// "Videos" and "Gallery" name the page's role and are correct as they stand, so a fixed title
		// costs the user nothing. A portfolio piece's title is the project's name — content only the
		// user has — so any fixed string here is the events page's invented-date problem moved to the
		// most prominent line on the page. An empty title puts core's own "Add title" prompt at the top
		// of the editor, which is a visible blank, and the blank is the point.
		const { fetcher, requests } = stubFetcher();
		await createPortfolioPiece( fetcher );

		assert.equal( requests[ 0 ].data.title, '' );
	} );

	it( 'writes the empty image block in the only form the editor accepts', async () => {
		// The video page's technique does NOT transfer, and this is where that was found. core/video's
		// save() emits an empty <figure>, so `<figure class="wp-block-video"></figure>` parses clean;
		// core/image's save() always emits the <img>, so the same tidy-looking shape is a real bug.
		// Running the shipped @wordpress/blocks parser over block-library's core/image registration in
		// jsdom:
		//   <!-- wp:image --><figure class="wp-block-image"></figure><!-- /wp:image -->  isValid: false
		//   <!-- wp:image /-->                                                           isValid: false
		//   <!-- wp:image --><figure class="wp-block-image"><img alt=""/></figure>...     isValid: true
		// The invalid forms would greet the user with "This block contains unexpected or invalid
		// content" on a page we had just created for them. The valid form is byte-for-byte what
		// core/image's own save() returns for a block with no attributes, which is also what WordPress
		// itself writes when an untouched Image block is saved.
		const { fetcher, requests } = stubFetcher();
		await createPortfolioPiece( fetcher );
		const content = requests[ 0 ].data.content;

		assert.ok( ! content.includes( 'wp:image /-->' ), 'the self-closing delimiter parses invalid' );
		assert.match( content, /<figure class="wp-block-image"><img alt=""\/><\/figure>/ );
	} );

	it( 'gives the blank description line a placeholder that says what belongs there', async () => {
		// Same technique as the events page's blank entries, and confirmed the same way: rendering this
		// markup through a real BlockEditorProvider canvas in jsdom puts
		// `data-rich-text-placeholder="What this project was, who it was for, and what you did."` and
		// `data-custom-placeholder="true"` on the paragraph. Without it the line is an invisible blank
		// carrying the editor's generic "Type / to choose a block", which says nothing about what a
		// portfolio piece needs written on it — and the description is the whole difference between this
		// page and a gallery.
		const { fetcher, requests } = stubFetcher();
		await createPortfolioPiece( fetcher );

		assert.match(
			requests[ 0 ].data.content,
			/<!-- wp:paragraph \{"placeholder":"[^"]*who it was for[^"]*"\} --><p><\/p>/
		);
	} );

	it( 'brings no image of its own — no URL, no source, no attachment id', async () => {
		// The regression this shares with the video page: nothing on this page may point anywhere. A
		// future "improvement" that reaches for a block pattern would drop somebody else's photograph
		// onto a page presented as the user's own work, which on a portfolio is worse than anywhere
		// else on the menu — the page's entire claim is that this is what they made. The AI copy pass
		// would not strip it either: rewriting touches heading and paragraph text, and an image is an
		// attribute.
		const { fetcher, requests } = stubFetcher();
		await createPortfolioPiece( fetcher );
		const content = requests[ 0 ].data.content;

		assert.ok( ! /https?:|\/\//.test( content ), 'the page points at a URL' );
		assert.ok(
			! /src=|"url"|"id":|wp-image-\d/.test( content ),
			'the page carries a media source'
		);
		assert.ok( ! /wp:(core\/)?embed/.test( content ), 'the page uses an embed block' );
		for ( const host of [ 'unsplash', 'pexels', 'flickr', 'behance', 'dribbble', 'instagram' ] ) {
			assert.ok( ! content.toLowerCase().includes( host ), `the page names ${ host }` );
		}
	} );

	it( 'is one piece of work with words about it, not a gallery', async () => {
		// The task exists only if it is not add_gallery_page, so the shape has to hold the line. A
		// gallery is many images and no words — a page you judge by looking. A piece is one image and
		// the story of it: what it was, who it was for, what the user did. A second image block, or a
		// core/gallery in place of the image, collapses this task into the one already on the menu, and
		// dropping the description does the same from the other direction.
		const { fetcher, requests } = stubFetcher();
		await createPortfolioPiece( fetcher );
		const content = requests[ 0 ].data.content;

		assert.deepEqual( blockNames( content ), [ 'image', 'paragraph' ] );
		assert.ok( ! content.includes( 'wp:gallery' ), 'a gallery block is the other task' );
	} );

	it( 'asks the site for nothing beyond core blocks', async () => {
		// Why this task needs no registry `is_visible` gate. The proof of concept opened the editor on
		// Jetpack's `jetpack-portfolio` custom post type, which is registered only once the
		// `jetpack_portfolio` option is on — off on every brand-new site, i.e. off on exactly the sites
		// this task exists for. A namespaced block delimiter, or a post type in the path, is the tell
		// that the dependency came back.
		const { fetcher, requests } = stubFetcher();
		await createPortfolioPiece( fetcher );

		assert.ok(
			! /wp:(?!image|paragraph)[a-z]+\//.test( requests[ 0 ].data.content ),
			'the page uses a namespaced block'
		);
		assert.ok( ! requests[ 0 ].path.includes( 'portfolio' ), 'the page is a plain page' );
	} );
} );
