import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pickPattern, selectPatternPage, type PtkPattern } from './pattern-page.ts';
import type { TailoredInferred } from './types.ts';

const inferred: TailoredInferred = {
	goal: 'build',
	niche: 'coffee roastery',
	vibe: 'artisan',
	audience: 'enthusiasts',
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
		assert.equal( pickPattern( [ other, match ], inferred ), match );
	} );

	it( 'tolerates an empty-array taxonomy without throwing', () => {
		const pattern: PtkPattern = { title: 'About', html: '<p>x</p>', categories: [], tags: [] };
		assert.equal( pickPattern( [ pattern ], inferred ), pattern );
	} );

	it( 'falls back to the first usable pattern when nothing scores', () => {
		const first: PtkPattern = { title: 'Plain', html: '<p>a</p>', categories: {} };
		const second: PtkPattern = { title: 'Also plain', html: '<p>b</p>', categories: {} };
		assert.equal( pickPattern( [ first, second ], inferred ), first );
	} );

	it( 'skips patterns without usable HTML', () => {
		const noHtml: PtkPattern = { title: 'Coffee', categories: {} };
		const usable: PtkPattern = { title: 'Tea', html: '<p>x</p>', categories: {} };
		assert.equal( pickPattern( [ noHtml, usable ], inferred ), usable );
	} );

	it( 'returns null when no pattern has HTML', () => {
		assert.equal( pickPattern( [ { title: 'x' }, { title: 'y' } ], inferred ), null );
	} );
} );

describe( 'selectPatternPage', () => {
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

	it( 'gallery variant filters to the gallery category and sets the gallery marker', () => {
		const result = selectPatternPage( [ aboutPattern, galleryPattern ], inferred, 'gallery' );
		assert.equal( result.content, galleryPattern.html );
		assert.equal( result.markerMeta, '_wpcom_ai_launchpad_gallery_page' );
	} );

	it( 'gallery variant falls back to a bare gallery block when no gallery pattern exists', () => {
		const result = selectPatternPage( [ aboutPattern ], inferred, 'gallery' );
		assert.match( result.content, /wp:gallery/ );
		assert.equal( result.markerMeta, '_wpcom_ai_launchpad_gallery_page' );
		assert.equal( result.title, 'Gallery' );
	} );

	it( 'about variant is unfiltered and sets the about marker', () => {
		const result = selectPatternPage( [ aboutPattern, galleryPattern ], inferred, 'about' );
		assert.equal( result.markerMeta, '_wpcom_ai_launchpad_about_page' );
		assert.equal( result.content, aboutPattern.html );
	} );
} );
