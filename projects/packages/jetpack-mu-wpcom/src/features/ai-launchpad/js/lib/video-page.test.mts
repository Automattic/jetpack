import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createVideoPage } from './video-page.ts';

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

describe( 'createVideoPage', () => {
	it( 'creates a marked draft page: a heading, the AI intro, and one empty video block', async () => {
		const { fetcher, requests } = stubFetcher();
		const result = await createVideoPage( 'Every glaze test, filmed start to finish.', fetcher );

		assert.deepEqual( result, { page_id: 42, edit_url: '/wp-admin/post.php?post=42&action=edit' } );
		const request = requests[ 0 ];
		assert.equal( request.path, '/wp/v2/pages' );
		assert.equal( request.method, 'POST' );
		assert.equal( request.data.title, 'Videos' );
		assert.equal( request.data.status, 'draft' );
		assert.deepEqual( request.data.meta, { _wpcom_ai_launchpad_video_page: true } );

		// Pinned whole, like the contact and events pages', because the exact markup is the task.
		// The `<figure class="wp-block-video"></figure>` is not decoration: it is what core/video's own
		// save() emits for a block with no source, and the editor validates the markup against exactly
		// that. Verified by running the shipped @wordpress/blocks parser against core/video's real
		// registration — see the "does not shorten" test below.
		assert.equal(
			request.data.content,
			`<!-- wp:heading --><h2 class="wp-block-heading">Watch</h2><!-- /wp:heading -->

<!-- wp:paragraph --><p>Every glaze test, filmed start to finish.</p><!-- /wp:paragraph -->

<!-- wp:video --><figure class="wp-block-video"></figure><!-- /wp:video -->`
		);
	} );

	it( 'embeds no video of its own — no URL, no id, no third-party service', async () => {
		// The reason this page is hand-authored and not a pattern, and the regression this test exists
		// to catch. The WordPress.com pattern library has no video category at all (`?categories=video`
		// answers `{"error":"no_patterns"}`), and its only three video-ish patterns are filed under
		// Gallery and each embeds a specific real third-party YouTube video — `nGYGC6cxRlQ` alone
		// appears four times across the library. Shipping one of those puts a stranger's video on the
		// user's site, which no rewrite step would strip: the rewrite prompt only touches heading and
		// paragraph text, and the embed url is an attribute.
		//
		// So: nothing on this page points anywhere. If someone later "improves" the page by reaching
		// for a pattern or dropping in an example clip, this fails first and loudly.
		const { fetcher, requests } = stubFetcher();
		await createVideoPage( 'Watch the studio at work.', fetcher );
		const content = requests[ 0 ].data.content;

		assert.ok( ! /https?:|\/\//.test( content ), 'the page points at a URL' );
		assert.ok(
			! /"src"|"url"|"guid"|providerNameSlug/i.test( content ),
			'the page carries a media source'
		);
		assert.ok( ! /wp:(core\/)?embed/.test( content ), 'the page uses an embed block' );
		for ( const host of [
			'youtube',
			'youtu.be',
			'vimeo',
			'dailymotion',
			'wistia',
			'twitch',
			'tiktok',
			'facebook',
			'instagram',
		] ) {
			assert.ok( ! content.toLowerCase().includes( host ), `the page names ${ host }` );
		}
		// The literal ids the library's video-ish patterns ship, named so the evidence outlives this
		// comment: a future paste of one of those patterns trips here even if the check above is relaxed.
		for ( const id of [ 'nGYGC6cxRlQ' ] ) {
			assert.ok( ! content.includes( id ), `the page embeds the pattern library's ${ id }` );
		}
	} );

	it( 'asks the site for nothing beyond core blocks', async () => {
		// core/video is why this task needs no visibility gate: it is a core block, present on every
		// site with no plan and no plugin behind it, and it takes an upload OR a URL. A VideoPress
		// block here would be a plan-gated Jetpack module, so the task would have to be withheld from
		// every site that cannot use it — and the CTA on the sites that kept it would still open a
		// block half of them have never been sold. A namespaced block delimiter is the tell.
		const { fetcher, requests } = stubFetcher();
		await createVideoPage( undefined, fetcher );

		assert.deepEqual( blockNames( requests[ 0 ].data.content ), [ 'heading', 'video' ] );
	} );

	it( 'leaves exactly one video block, empty and unattributed', async () => {
		// One, not a scaffold of several. An empty core/video block is not a blank line: the editor
		// renders it as a full media placeholder card — label "Video", the instruction "Drag and drop a
		// video, upload, or choose from your library.", a drop zone, an Upload button and an Insert from
		// URL button. That is already legible on its own, which is why this page needs none of the
		// `placeholder`-attribute treatment the events page uses (core/video declares no such
		// attribute). It also means three of them would be three identical grey cards to scroll past
		// and delete, where three blank event entries cost two lines each.
		const { fetcher, requests } = stubFetcher();
		await createVideoPage( 'Watch the studio at work.', fetcher );
		const content = requests[ 0 ].data.content;

		assert.equal( blockNames( content ).filter( name => 'video' === name ).length, 1 );
		// No attribute JSON on the delimiter: every attribute core/video has is something only the
		// user's own video can fill in.
		assert.match( content, /<!-- wp:video -->/ );
	} );

	it( 'does not shorten the empty video block to a self-closing delimiter', async () => {
		// The tempting tidy-up, and a real bug. Running the shipped @wordpress/blocks parser over
		// core/video's real registration in jsdom: `<!-- wp:video /-->` parses to isValid=false, so the
		// editor would greet the user with "This block contains unexpected or invalid content" on a page
		// we just created for them. `<figure class="wp-block-video"></figure>` — what core/video's own
		// save() emits with no src — parses to isValid=true.
		const { fetcher, requests } = stubFetcher();
		await createVideoPage( undefined, fetcher );

		assert.ok( ! requests[ 0 ].data.content.includes( 'wp:video /-->' ) );
		assert.match( requests[ 0 ].data.content, /<figure class="wp-block-video"><\/figure>/ );
	} );

	it( 'escapes the AI-written intro rather than emitting it as markup', async () => {
		const { fetcher, requests } = stubFetcher();
		await createVideoPage( 'Takes <all> the guesswork out & shows the misfires.', fetcher );

		assert.match(
			requests[ 0 ].data.content,
			/<p>Takes &lt;all&gt; the guesswork out &amp; shows the misfires\.<\/p>/
		);
		assert.ok( ! requests[ 0 ].data.content.includes( '<all>' ) );
	} );

	it( 'still creates the page when the output carries no intro', async () => {
		// Outputs persisted before page_intros existed, and any run where the model omits the key. The
		// video block is what the task is for, so the page must arrive with it either way.
		for ( const intro of [ undefined, '', '   ' ] ) {
			const { fetcher, requests } = stubFetcher();
			await createVideoPage( intro, fetcher );

			const content = requests[ 0 ].data.content;
			assert.ok( content.includes( '<!-- wp:video -->' ), 'the video block must survive' );
			assert.ok( content.includes( '>Watch<' ), 'the heading must survive' );
			assert.ok( ! content.includes( '<!-- wp:paragraph -->' ), 'no empty intro paragraph' );
		}
	} );
} );
