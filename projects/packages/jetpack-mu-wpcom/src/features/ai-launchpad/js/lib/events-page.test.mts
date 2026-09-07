import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEventsPage } from './events-page.ts';

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
 * The page as anybody reading it sees it: block delimiters carry editor-only attributes and tags carry
 * markup, and neither renders as words on the page.
 *
 * @param content - The serialized block markup.
 * @return The text the published page would show.
 */
function renderedText( content: string ): string {
	// Split on the markup and keep what falls between, rather than deleting the markup out of the
	// string. Same text either way, but a strip-shaped `replace` reads as a half-built HTML sanitizer
	// to any reader, CodeQL included, and this is not sanitizing anything — it is picking the text
	// nodes out of markup the test itself just built. Joining on a space also stops two text nodes
	// either side of a tag from fusing into a token neither of them contains.
	return content.split( /<!--[\s\S]*?-->|<[^>]*>/ ).join( ' ' );
}

/**
 * Every `placeholder` attribute in the markup, which is the editor-facing half of the page.
 *
 * @param content - The serialized block markup.
 * @return The placeholder strings, in document order.
 */
function placeholders( content: string ): string[] {
	return [ ...content.matchAll( /"placeholder":"([^"]*)"/g ) ].map( match => match[ 1 ] );
}

/**
 * Each heading/paragraph block, paired with its attribute JSON and its rendered text.
 *
 * @param content - The serialized block markup.
 * @return One entry per block.
 */
function blocks( content: string ): Array< { name: string; attrs: string; text: string } > {
	const pattern = /<!-- wp:(heading|paragraph)( \{[^}]*\})? -->(.*?)<!-- \/wp:\1 -->/g;
	return [ ...content.matchAll( pattern ) ].map( match => ( {
		name: match[ 1 ],
		attrs: match[ 2 ] ?? '',
		// Joined empty, not on a space: this text is only ever tested for emptiness, and a block
		// holding nothing must not come back holding a separator.
		text: match[ 3 ].split( /<[^>]*>/ ).join( '' ),
	} ) );
}

describe( 'createEventsPage', () => {
	it( 'creates a marked draft page: a heading, the AI intro, and three blank event entries', async () => {
		const { fetcher, requests } = stubFetcher();
		const result = await createEventsPage( 'Come and throw a pot with us.', fetcher );

		assert.deepEqual( result, { page_id: 42, edit_url: '/wp-admin/post.php?post=42&action=edit' } );
		const request = requests[ 0 ];
		assert.equal( request.path, '/wp/v2/pages' );
		assert.equal( request.method, 'POST' );
		assert.equal( request.data.title, 'Events' );
		assert.equal( request.data.status, 'draft' );
		assert.deepEqual( request.data.meta, { _wpcom_ai_launchpad_events_page: true } );

		// Pinned whole, like the contact page's, because the exact markup is the task: everything
		// below the intro is a scaffold whose value is being empty in a legible way. Anything added
		// to it — a fourth entry, an example date, a wrapper — shows up here first.
		assert.equal(
			request.data.content,
			`<!-- wp:heading --><h2 class="wp-block-heading">Upcoming events</h2><!-- /wp:heading -->

<!-- wp:paragraph --><p>Come and throw a pot with us.</p><!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"placeholder":"Event name"} --><h3 class="wp-block-heading"></h3><!-- /wp:heading -->

<!-- wp:paragraph {"placeholder":"Date, time, and place"} --><p></p><!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"placeholder":"Event name"} --><h3 class="wp-block-heading"></h3><!-- /wp:heading -->

<!-- wp:paragraph {"placeholder":"Date, time, and place"} --><p></p><!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"placeholder":"Event name"} --><h3 class="wp-block-heading"></h3><!-- /wp:heading -->

<!-- wp:paragraph {"placeholder":"Date, time, and place"} --><p></p><!-- /wp:paragraph -->`
		);
	} );

	it( 'gives every blank a placeholder, so the scaffold is visible in the editor', async () => {
		// An empty block with no `placeholder` attribute is a blank line the user cannot see they are
		// meant to fill, which is worse than offering no scaffold at all. core/heading and core/paragraph
		// both declare a `placeholder` attribute that their RichText renders whenever the block's text
		// is empty, selected or not, so every empty block here must carry one.
		const { fetcher, requests } = stubFetcher();
		await createEventsPage( 'What we have coming up.', fetcher );

		const empty = blocks( requests[ 0 ].data.content ).filter( block => '' === block.text );
		assert.equal( empty.length, 6, 'three event entries, each a name and a details line' );
		for ( const block of empty ) {
			assert.match( block.attrs, /"placeholder":"[^"]+"/, `${ block.name } blank with no prompt` );
		}
		assert.deepEqual( placeholders( requests[ 0 ].data.content ), [
			'Event name',
			'Date, time, and place',
			'Event name',
			'Date, time, and place',
			'Event name',
			'Date, time, and place',
		] );
	} );

	it( 'names no date, time, venue or price anywhere on the page', async () => {
		// The reason this page is a scaffold and not a pattern. Every events pattern in the
		// WordPress.com library is a fabricated tour listing — "Austin, Texas / 12 Dec 2024",
		// "Venue Name / Cincinnati, OH", "Sept 18, 2025" — and every date in the library falls
		// between Dec 2024 and Sept 2025, so using one publishes a page of expired events on day one.
		// Nobody but the user knows when their events are, so the page must not guess, not even as an
		// example. Checked on the markup the reader sees AND on the placeholders, since an example
		// smuggled into a placeholder is the same mistake one layer down.
		const { fetcher, requests } = stubFetcher();
		await createEventsPage( undefined, fetcher );

		const probes: Array< [ string, RegExp ] > = [
			[ 'a date or a time', /\d/ ],
			[ 'a month', /\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)\b/i ],
			[ 'a weekday', /\b(mon|tue|wed|thu|fri|sat|sun)(day|s)?\b/i ],
			[ 'a price', /[$£€¥]|\b(free|from|only)\s*[\d$£€]/i ],
			[ 'a venue or a city', /\b[A-Z][a-z]+,\s*[A-Z]/ ],
		];
		for ( const [ label, pattern ] of probes ) {
			assert.ok(
				! pattern.test( renderedText( requests[ 0 ].data.content ) ),
				`the page states ${ label }`
			);
			for ( const placeholder of placeholders( requests[ 0 ].data.content ) ) {
				assert.ok(
					! pattern.test( placeholder ),
					`the placeholder "${ placeholder }" states ${ label }`
				);
			}
		}
	} );

	it( 'escapes the AI-written intro rather than emitting it as markup', async () => {
		const { fetcher, requests } = stubFetcher();
		await createEventsPage( 'Workshops for <all> levels & ages.', fetcher );

		assert.match(
			requests[ 0 ].data.content,
			/<p>Workshops for &lt;all&gt; levels &amp; ages\.<\/p>/
		);
		assert.ok( ! requests[ 0 ].data.content.includes( '<all>' ) );
	} );

	it( 'still creates the scaffold when the output carries no intro', async () => {
		// Outputs persisted before page_intros existed, and any run where the model omits the key.
		// The blank entries are what the task is for, so the page must arrive with them either way.
		for ( const intro of [ undefined, '', '   ' ] ) {
			const { fetcher, requests } = stubFetcher();
			await createEventsPage( intro, fetcher );

			const content = requests[ 0 ].data.content;
			assert.equal( placeholders( content ).length, 6, 'the three entries must survive' );
			assert.ok( content.includes( '>Upcoming events<' ), 'the heading must survive' );
			// Every scaffold paragraph carries attributes, so a bare delimiter is the intro's and only
			// the intro's: no empty AI paragraph when there is no line to put in it.
			assert.ok( ! content.includes( '<!-- wp:paragraph -->' ), 'no empty intro paragraph' );
		}
	} );
} );
