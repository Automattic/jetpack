import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pickPattern, selectGalleryPage, type PtkPattern } from './pattern-page.ts';
import type { TailoredInferred } from './types.ts';

const inferred: TailoredInferred = {
	goal: 'build',
	niche: 'coffee roastery',
	vibe: 'artisan',
	audience: 'enthusiasts',
};

// The words nicheWords() derives from the inferred fixture above.
const words = [ 'coffee', 'roastery', 'artisan', 'enthusiasts' ];

const GALLERY_HTML = '<!-- wp:gallery --><figure></figure><!-- /wp:gallery -->';

/**
 * Build a pattern filed under the gallery category, which is what selectGalleryPage pools on.
 *
 * @param title - The pattern title, which is also what niche scoring reads.
 * @param html  - The pattern markup.
 * @return The pattern.
 */
function gallery( title: string, html: string = GALLERY_HTML ): PtkPattern {
	return { title, html, categories: { c1: { slug: 'gallery', title: 'Gallery' } } };
}

const aboutPattern: PtkPattern = {
	title: 'About Hero',
	html: '<p>about</p>',
	categories: { c2: { slug: 'about', title: 'About' } },
};

describe( 'pickPattern', () => {
	it( 'matches on category term titles, not slug keys', () => {
		// The niche-relevant term lives in the value's `title`; the slug key is opaque.
		const match: PtkPattern = {
			title: 'Hero',
			html: '<p>match</p>',
			categories: { cat_1: { slug: 'cat_1', title: 'Coffee shop intro' } },
		};
		const other: PtkPattern = {
			title: 'Hero',
			html: '<p>other</p>',
			categories: { cat_2: { slug: 'cat_2', title: 'Generic banner' } },
		};
		// `other` is first, so only correct title-based scoring promotes `match`.
		const result = pickPattern( [ other, match ], words );
		assert.equal( result.pattern, match );
		assert.equal( result.score, 1 );
	} );

	it( 'tolerates an empty-array taxonomy without throwing', () => {
		const pattern: PtkPattern = { title: 'About', html: '<p>x</p>', categories: [], tags: [] };
		assert.equal( pickPattern( [ pattern ], words ).pattern, pattern );
	} );

	it( 'falls back to the first usable pattern, with score 0, when nothing scores', () => {
		const first: PtkPattern = { title: 'Plain', html: '<p>a</p>', categories: {} };
		const second: PtkPattern = { title: 'Also plain', html: '<p>b</p>', categories: {} };
		const result = pickPattern( [ first, second ], words );
		assert.equal( result.pattern, first );
		assert.equal( result.score, 0 );
	} );

	it( 'skips patterns without usable HTML', () => {
		const noHtml: PtkPattern = { title: 'Coffee', categories: {} };
		const usable: PtkPattern = { title: 'Tea', html: '<p>x</p>', categories: {} };
		assert.equal( pickPattern( [ noHtml, usable ], words ).pattern, usable );
	} );

	it( 'returns a null pattern when no pattern has HTML', () => {
		assert.equal( pickPattern( [ { title: 'x' }, { title: 'y' } ], words ).pattern, null );
	} );
} );

describe( 'selectGalleryPage', () => {
	const galleryPattern = gallery( 'Gallery Page 1' );

	it( 'filters to the gallery category, fixes the title, and logs the arbitrary pick', () => {
		// The gallery pattern is in the pool but mentions no niche word, so the pick is arbitrary;
		// the About pattern is filtered out before scoring, leaving a pool of one.
		const result = selectGalleryPage( [ aboutPattern, galleryPattern ], inferred );
		assert.equal( result.content, galleryPattern.html );
		// The title is fixed, not the matched pattern's name.
		assert.equal( result.title, 'Gallery' );
		assert.deepEqual( result.log, {
			pool_size: 1,
			match_words: words,
			picked_title: 'Gallery Page 1',
			picked_score: 0,
			fallback: 'first_usable',
		} );
	} );

	it( 'falls back to a bare gallery block when no gallery pattern exists', () => {
		const result = selectGalleryPage( [ aboutPattern ], inferred );
		assert.match( result.content, /wp:gallery/ );
		assert.equal( result.title, 'Gallery' );
		assert.equal( result.log.fallback, 'empty' );
	} );

	it( 'strips an in-pattern heading that repeats the title, and keeps one that differs', () => {
		const heading = ( text: string ) =>
			`<!-- wp:heading --><h2 class="wp-block-heading">${ text }</h2><!-- /wp:heading -->`;
		const image = '<!-- wp:image --><figure></figure><!-- /wp:image -->';
		const repeats = gallery( 'Gallery Page 2', `${ heading( 'Gallery' ) }\n${ image }` );
		const differs = gallery( 'Gallery Page 3', heading( 'Featured work' ) );

		const stripped = selectGalleryPage( [ repeats ], inferred );
		assert.equal( stripped.title, 'Gallery' );
		assert.ok( ! /wp:heading/.test( stripped.content ), 'redundant heading removed' );
		assert.ok( /wp:image/.test( stripped.content ), 'other blocks kept' );

		const kept = selectGalleryPage( [ differs ], inferred ).content;
		assert.ok( /Featured work/.test( kept ), 'non-matching heading kept' );
	} );

	it( 'reports a genuine match with its score and the filtered pool size', () => {
		const patterns = [ aboutPattern, galleryPattern, gallery( 'Coffee gallery' ) ];
		const result = selectGalleryPage( patterns, inferred );
		// The about pattern is filtered out of the gallery pool before scoring.
		assert.equal( result.log.pool_size, 2 );
		assert.equal( result.log.picked_title, 'Coffee gallery' );
		assert.equal( result.log.picked_score, 1 );
		assert.equal( result.log.fallback, 'none' );
	} );

	it( 'reports an empty fallback when no usable pattern exists', () => {
		const result = selectGalleryPage( [], inferred );
		assert.equal( result.log.pool_size, 0 );
		assert.equal( result.log.picked_title, null );
		assert.equal( result.log.fallback, 'empty' );
	} );

	it( 'drops connective words and duplicates from the match words', () => {
		const { log } = selectGalleryPage( [], {
			goal: 'portfolio',
			niche: 'wildlife photography from the Alps',
			audience: 'photography enthusiasts',
		} );
		// "from"/"the" are stop words; "photography" appears in two fields but counts once.
		assert.deepEqual( log.match_words, [ 'wildlife', 'photography', 'alps', 'enthusiasts' ] );
	} );

	it( 'scores whole tokens only, so a niche word cannot match inside another word', () => {
		const smart = gallery( 'Smart marketing', '<p>x</p>' );
		const result = selectGalleryPage( [ smart ], { goal: 'portfolio', niche: 'art prints' } );
		// "art" must not match "Smart": the pick falls back rather than reporting a match.
		assert.equal( result.log.picked_score, 0 );
		assert.equal( result.log.fallback, 'first_usable' );
	} );
} );
