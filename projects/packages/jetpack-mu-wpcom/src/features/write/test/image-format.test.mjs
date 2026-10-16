import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	IMAGE_SIZE_SLUGS,
	IMAGE_ALIGNS,
	getMediaIdFromImg,
	setFigureSize,
	setFigureAlignment,
	getFigureAlignment,
	libraryThumbUrl,
} from '../image-format.js';

/**
 * Minimal stand-in for a DOM element's classList, backed by a Set. Covers the
 * add / remove / contains surface the figure helpers touch — no jsdom needed.
 *
 * @param {string[]} initial - Classes the element starts with.
 * @return {object} A fake element with `classList` and a `className` getter.
 */
function fakeEl( initial = [] ) {
	const set = new Set( initial );
	return {
		classList: {
			add: ( ...classes ) => classes.forEach( c => set.add( c ) ),
			remove: ( ...classes ) => classes.forEach( c => set.delete( c ) ),
			contains: c => set.has( c ),
		},
		get className() {
			return [ ...set ].join( ' ' );
		},
	};
}

describe( 'IMAGE_SIZE_SLUGS / IMAGE_ALIGNS', () => {
	it( 'ships the four size presets in order', () => {
		assert.deepEqual( IMAGE_SIZE_SLUGS, [ 'thumbnail', 'medium', 'large', 'full' ] );
	} );

	it( 'ships the three alignment values', () => {
		assert.deepEqual( IMAGE_ALIGNS, [ 'left', 'center', 'right' ] );
	} );
} );

describe( 'getMediaIdFromImg', () => {
	it( 'returns null for a missing image', () => {
		assert.equal( getMediaIdFromImg( null ), null );
		assert.equal( getMediaIdFromImg( undefined ), null );
	} );

	it( 'reads the numeric id from a wp-image-<id> class', () => {
		assert.equal( getMediaIdFromImg( { className: 'wp-image-42' } ), 42 );
	} );

	it( 'finds the class among other classes', () => {
		assert.equal( getMediaIdFromImg( { className: 'foo wp-image-123 bar' } ), 123 );
		assert.equal( getMediaIdFromImg( { className: 'size-large wp-image-7' } ), 7 );
	} );

	it( 'returns null when there is no wp-image class', () => {
		assert.equal( getMediaIdFromImg( { className: 'size-large aligncenter' } ), null );
		assert.equal( getMediaIdFromImg( { className: '' } ), null );
	} );

	it( 'does not match a partial or non-numeric wp-image token', () => {
		// A trailing word char after the digits breaks the (?:\s|$) boundary.
		assert.equal( getMediaIdFromImg( { className: 'wp-image-12x' } ), null );
		assert.equal( getMediaIdFromImg( { className: 'my-wp-image-9' } ), null );
		assert.equal( getMediaIdFromImg( { className: 'wp-image-abc' } ), null );
	} );
} );

describe( 'setFigureSize', () => {
	it( 'adds the requested size class', () => {
		const fig = fakeEl();
		setFigureSize( fig, 'large' );
		assert.equal( fig.classList.contains( 'size-large' ), true );
	} );

	it( 'replaces any existing size class', () => {
		const fig = fakeEl( [ 'size-thumbnail' ] );
		setFigureSize( fig, 'medium' );
		assert.equal( fig.classList.contains( 'size-thumbnail' ), false );
		assert.equal( fig.classList.contains( 'size-medium' ), true );
	} );

	it( 'clears all size classes when slug is empty', () => {
		const fig = fakeEl( [ 'size-full', 'aligncenter' ] );
		setFigureSize( fig, '' );
		IMAGE_SIZE_SLUGS.forEach( s => assert.equal( fig.classList.contains( 'size-' + s ), false ) );
		// Non-size classes are untouched.
		assert.equal( fig.classList.contains( 'aligncenter' ), true );
	} );
} );

describe( 'setFigureAlignment', () => {
	it( 'maps left to alignleft', () => {
		const fig = fakeEl();
		setFigureAlignment( fig, 'left' );
		assert.equal( fig.classList.contains( 'alignleft' ), true );
	} );

	it( 'maps right to alignright', () => {
		const fig = fakeEl();
		setFigureAlignment( fig, 'right' );
		assert.equal( fig.classList.contains( 'alignright' ), true );
	} );

	it( 'maps center (and any unknown value) to aligncenter', () => {
		const center = fakeEl();
		setFigureAlignment( center, 'center' );
		assert.equal( center.classList.contains( 'aligncenter' ), true );

		const unknown = fakeEl();
		setFigureAlignment( unknown, 'wide' );
		assert.equal( unknown.classList.contains( 'aligncenter' ), true );
	} );

	it( 'replaces any existing alignment class', () => {
		const fig = fakeEl( [ 'alignleft' ] );
		setFigureAlignment( fig, 'right' );
		assert.equal( fig.classList.contains( 'alignleft' ), false );
		assert.equal( fig.classList.contains( 'alignright' ), true );
	} );
} );

describe( 'getFigureAlignment', () => {
	it( 'reads left and right from the class list', () => {
		assert.equal( getFigureAlignment( fakeEl( [ 'alignleft' ] ) ), 'left' );
		assert.equal( getFigureAlignment( fakeEl( [ 'alignright' ] ) ), 'right' );
	} );

	it( 'defaults to center when no align class is present', () => {
		assert.equal( getFigureAlignment( fakeEl() ), 'center' );
		assert.equal( getFigureAlignment( fakeEl( [ 'aligncenter' ] ) ), 'center' );
		assert.equal( getFigureAlignment( fakeEl( [ 'size-large' ] ) ), 'center' );
	} );

	it( 'round-trips with setFigureAlignment', () => {
		for ( const align of IMAGE_ALIGNS ) {
			const fig = fakeEl();
			setFigureAlignment( fig, align );
			assert.equal( getFigureAlignment( fig ), align );
		}
	} );
} );

describe( 'libraryThumbUrl', () => {
	it( 'prefers the thumbnail size', () => {
		const media = {
			source_url: 'https://example.com/full.jpg',
			media_details: {
				sizes: {
					thumbnail: { source_url: 'https://example.com/thumb.jpg' },
					medium: { source_url: 'https://example.com/medium.jpg' },
				},
			},
		};
		assert.equal( libraryThumbUrl( media ), 'https://example.com/thumb.jpg' );
	} );

	it( 'falls back to medium when there is no thumbnail', () => {
		const media = {
			source_url: 'https://example.com/full.jpg',
			media_details: { sizes: { medium: { source_url: 'https://example.com/medium.jpg' } } },
		};
		assert.equal( libraryThumbUrl( media ), 'https://example.com/medium.jpg' );
	} );

	it( 'falls back to source_url when no registered sizes exist', () => {
		assert.equal(
			libraryThumbUrl( { source_url: 'https://example.com/full.jpg' } ),
			'https://example.com/full.jpg'
		);
		assert.equal(
			libraryThumbUrl( { source_url: 'https://example.com/full.jpg', media_details: {} } ),
			'https://example.com/full.jpg'
		);
	} );

	it( 'returns an empty string when nothing is available', () => {
		assert.equal( libraryThumbUrl( {} ), '' );
		assert.equal( libraryThumbUrl( { media_details: { sizes: {} } } ), '' );
	} );
} );
