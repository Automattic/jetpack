import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createGalleryPage } from './gallery-page.ts';

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

describe( 'createGalleryPage', () => {
	it( 'creates a marked draft page: a heading, the AI intro, and one empty gallery block', async () => {
		const { fetcher, requests } = stubFetcher();
		const result = await createGalleryPage(
			'Every piece that came out of the kiln this year.',
			fetcher
		);

		assert.deepEqual( result, { page_id: 42, edit_url: '/wp-admin/post.php?post=42&action=edit' } );
		const request = requests[ 0 ];
		assert.equal( request.path, '/wp/v2/pages' );
		assert.equal( request.method, 'POST' );
		assert.equal( request.data.title, 'Gallery' );
		assert.equal( request.data.status, 'draft' );
		assert.deepEqual( request.data.meta, { _wpcom_ai_launchpad_gallery_page: true } );

		// Pinned whole, like the contact, events, video and portfolio pages', because the exact markup
		// is the task. The class list is not decoration: it is what core/gallery's own save() emits for
		// a block with no images, and the editor validates saved markup against exactly that. Verified
		// by running the shipped @wordpress/blocks parser over block-library's real core/gallery
		// registration in jsdom — see the "only form the editor accepts" test below.
		assert.equal(
			request.data.content,
			`<!-- wp:heading --><h2 class="wp-block-heading">Take a look</h2><!-- /wp:heading -->

<!-- wp:paragraph --><p>Every piece that came out of the kiln this year.</p><!-- /wp:paragraph -->

<!-- wp:gallery --><figure class="wp-block-gallery has-nested-images columns-default is-cropped"></figure><!-- /wp:gallery -->`
		);
	} );

	it( 'brings no image of its own — no URL, no attachment id, no remote asset', async () => {
		// The regression this whole change exists to prevent, and the sharpest version of it on the
		// menu. Until now the page was built from the WordPress.com pattern library, and the pattern it
		// always settled on shipped three photographs hotlinked from dotcompatterns.wordpress.com with
		// that site's own attachment ids on them ("id":16531). Every gallery page therefore arrived
		// carrying images the user does not own, cannot see in their media library, cannot edit or
		// delete, and which load from somebody else's site forever.
		//
		// Nothing on this page may point anywhere. If someone later "improves" it by reaching for a
		// pattern again, or by dropping in an example photo, this fails first and loudly.
		const { fetcher, requests } = stubFetcher();
		await createGalleryPage( 'A year of work in one place.', fetcher );
		const content = requests[ 0 ].data.content;

		assert.ok( ! /https?:|\/\//.test( content ), 'the page points at a URL' );
		assert.ok(
			! /src=|srcset=|"url"|"id":|"ids"|wp-image-\d/.test( content ),
			'the page carries a media source'
		);
		assert.ok( ! /<img\b/.test( content ), 'the page ships an image of its own' );
		assert.ok( ! /wp:(core\/)?(embed|image)\b/.test( content ), 'the page embeds media' );
		for ( const host of [
			'dotcompatterns',
			'wp.com',
			'unsplash',
			'pexels',
			'flickr',
			'instagram',
			'pinterest',
		] ) {
			assert.ok( ! content.toLowerCase().includes( host ), `the page names ${ host }` );
		}
		// The literal attachment id the library's winning gallery pattern shipped, named so the
		// evidence outlives this comment: a future paste of that pattern trips here even if the
		// checks above are relaxed.
		assert.ok( ! content.includes( '16531' ), "the page carries the pattern's attachment id" );
	} );

	it( 'writes the empty gallery block in the only form the editor accepts', async () => {
		// Neither the tidy self-closing delimiter nor the bare class is safe here, and that was found
		// by execution rather than inferred. Running the shipped @wordpress/blocks parser over
		// block-library's real core/gallery registration in jsdom:
		//   <!-- wp:gallery /-->                                                        isValid: false
		//   <!-- wp:gallery --><figure class="wp-block-gallery"></figure><!-- ... -->   isValid: false
		//   <!-- wp:gallery --><figure class="wp-block-gallery has-nested-images
		//                      columns-default is-cropped"></figure><!-- ... -->        isValid: true
		// The invalid forms would greet the user with "This block contains unexpected or invalid
		// content" on a page we had just created for them. The valid form is byte-for-byte the body
		// that blocks.serialize( createBlock( 'core/gallery' ) ) emits, which is what WordPress itself
		// writes when an untouched Gallery block is saved.
		const { fetcher, requests } = stubFetcher();
		await createGalleryPage( undefined, fetcher );
		const content = requests[ 0 ].data.content;

		assert.ok(
			! content.includes( 'wp:gallery /-->' ),
			'the self-closing delimiter parses invalid'
		);
		assert.match(
			content,
			/<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><\/figure>/
		);
	} );

	it( 'leaves exactly one gallery block, empty and unattributed', async () => {
		// No attribute JSON on the delimiter. Every attribute core/gallery has — `images`, `ids`,
		// `columns`, `caption`, `linkTo` — is either something only the user's own pictures can fill
		// or a default the editor writes for itself once they do. The old fallback markup carried
		// {"linkTo":"none"}, which is the block's own default and buys nothing.
		const { fetcher, requests } = stubFetcher();
		await createGalleryPage( 'A year of work in one place.', fetcher );
		const content = requests[ 0 ].data.content;

		assert.equal( blockNames( content ).filter( name => 'gallery' === name ).length, 1 );
		assert.match( content, /<!-- wp:gallery -->/ );
	} );

	it( 'asks the site for nothing beyond core blocks', async () => {
		// core/gallery is why this task needs no registry `is_visible` gate: a core block on every
		// site, with no plan, plugin or pattern-library fetch behind it. A namespaced block delimiter
		// is the tell that a dependency crept back in.
		const { fetcher, requests } = stubFetcher();
		await createGalleryPage( undefined, fetcher );

		assert.deepEqual( blockNames( requests[ 0 ].data.content ), [ 'heading', 'gallery' ] );
	} );

	it( 'needs no network call of its own to build the page', async () => {
		// The pattern flow fetched the whole 552-pattern WordPress.com library — about 2.7 MB — on the
		// CTA click, before it could create anything, and then scored patterns against the site's
		// niche. The scoring was dead on arrival: the library carries no topical tags, so production
		// logged `picked_score: 0, fallback: first_usable` on every single event. One request creates
		// the page now, and the stub fetcher is the only fetch there is.
		const { fetcher, requests } = stubFetcher();
		await createGalleryPage( 'A year of work in one place.', fetcher );

		assert.equal( requests.length, 1 );
	} );

	it( 'escapes the AI-written intro rather than emitting it as markup', async () => {
		const { fetcher, requests } = stubFetcher();
		await createGalleryPage( 'Glazes <all> of them & the misfires too.', fetcher );

		assert.match(
			requests[ 0 ].data.content,
			/<p>Glazes &lt;all&gt; of them &amp; the misfires too\.<\/p>/
		);
		assert.ok( ! requests[ 0 ].data.content.includes( '<all>' ) );
	} );

	it( 'still creates the page when the output carries no intro', async () => {
		// Outputs persisted before page_intros existed, and any run where the model omits the key. The
		// gallery block is what the task is for, so the page must arrive with it either way.
		for ( const intro of [ undefined, '', '   ' ] ) {
			const { fetcher, requests } = stubFetcher();
			await createGalleryPage( intro, fetcher );

			const content = requests[ 0 ].data.content;
			assert.ok( content.includes( '<!-- wp:gallery -->' ), 'the gallery block must survive' );
			assert.ok( content.includes( '>Take a look<' ), 'the heading must survive' );
			assert.ok( ! content.includes( '<!-- wp:paragraph -->' ), 'no empty intro paragraph' );
		}
	} );
} );
