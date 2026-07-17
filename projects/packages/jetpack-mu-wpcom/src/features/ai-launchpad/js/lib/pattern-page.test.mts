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
	const galleryPattern: PtkPattern = {
		title: 'Gallery Page 1',
		html: '<!-- wp:gallery --><figure></figure><!-- /wp:gallery -->',
		categories: { c1: { slug: 'gallery', title: 'Gallery' } },
	};
	const aboutPattern: PtkPattern = {
		title: 'About Hero',
		html: '<p>about</p>',
		categories: { c2: { slug: 'about', title: 'About' } },
	};

	it( 'filters to the gallery category and uses the fixed title', () => {
		const result = selectGalleryPage( [ aboutPattern, galleryPattern ], inferred );
		assert.equal( result.content, galleryPattern.html );
		// The title is fixed, not the matched pattern's name.
		assert.equal( result.title, 'Gallery' );
	} );

	it( 'falls back to a bare gallery block when no gallery pattern exists', () => {
		const result = selectGalleryPage( [ aboutPattern ], inferred );
		assert.match( result.content, /wp:gallery/ );
		assert.equal( result.title, 'Gallery' );
		assert.equal( result.log.fallback, 'empty' );
	} );

	it( 'strips an in-pattern heading that repeats the title', () => {
		const withHeading: PtkPattern = {
			title: 'Gallery Page 2',
			html: '<!-- wp:heading --><h2 class="wp-block-heading">Gallery</h2><!-- /wp:heading -->\n<!-- wp:image --><figure></figure><!-- /wp:image -->',
			categories: { c1: { slug: 'gallery', title: 'Gallery' } },
		};
		const result = selectGalleryPage( [ withHeading ], inferred );
		assert.equal( result.title, 'Gallery' );
		assert.ok( ! /wp:heading/.test( result.content ), 'redundant heading removed' );
		assert.ok( /wp:image/.test( result.content ), 'other blocks kept' );
	} );

	it( 'keeps a heading whose text differs from the title', () => {
		const withHeading: PtkPattern = {
			title: 'Gallery Page 3',
			html: '<!-- wp:heading --><h2 class="wp-block-heading">Featured work</h2><!-- /wp:heading -->',
			categories: { c1: { slug: 'gallery', title: 'Gallery' } },
		};
		const result = selectGalleryPage( [ withHeading ], inferred );
		assert.ok( /Featured work/.test( result.content ), 'non-matching heading kept' );
	} );

	it( 'reports a first_usable fallback when nothing matches the niche words', () => {
		// The gallery pattern is in the pool but mentions no niche word, so the pick is arbitrary.
		const result = selectGalleryPage( [ aboutPattern, galleryPattern ], inferred );
		assert.deepEqual( result.log, {
			pool_size: 1,
			match_words: words,
			picked_title: 'Gallery Page 1',
			picked_score: 0,
			fallback: 'first_usable',
		} );
	} );

	it( 'reports a genuine match with its score and the filtered pool size', () => {
		const coffeeGallery: PtkPattern = {
			title: 'Coffee gallery',
			html: '<!-- wp:gallery --><figure></figure><!-- /wp:gallery -->',
			categories: { c1: { slug: 'gallery', title: 'Gallery' } },
		};
		const result = selectGalleryPage( [ aboutPattern, galleryPattern, coffeeGallery ], inferred );
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
		const result = selectGalleryPage( [], {
			goal: 'portfolio',
			niche: 'wildlife photography from the Alps',
			audience: 'photography enthusiasts',
		} );
		// "from"/"the" are stop words; "photography" appears in two fields but counts once.
		assert.deepEqual( result.log.match_words, [
			'wildlife',
			'photography',
			'alps',
			'enthusiasts',
		] );
	} );

	it( 'scores whole tokens only, so a niche word cannot match inside another word', () => {
		const smart: PtkPattern = {
			title: 'Smart marketing',
			html: '<p>x</p>',
			categories: { c1: { slug: 'gallery', title: 'Gallery' } },
		};
		const result = selectGalleryPage( [ smart ], { goal: 'portfolio', niche: 'art prints' } );
		// "art" must not match "Smart": the pick falls back rather than reporting a match.
		assert.equal( result.log.picked_score, 0 );
		assert.equal( result.log.fallback, 'first_usable' );
	} );
} );
