import {
	formatRuntime,
	formatTimecode,
	moveEntry,
	playlistEmbedUrl,
	playlistRuntimeMs,
	resolutionLabel,
} from '../utils';

describe( 'formatTimecode', () => {
	it( 'formats minutes and seconds', () => {
		expect( formatTimecode( 724000 ) ).toBe( '12:04' );
	} );

	it( 'formats hours', () => {
		expect( formatTimecode( 4430000 ) ).toBe( '1:13:50' );
	} );

	it( 'pads seconds and minutes', () => {
		expect( formatTimecode( 3601000 ) ).toBe( '1:00:01' );
	} );

	it( 'returns an empty string for unknown durations', () => {
		expect( formatTimecode( undefined ) ).toBe( '' );
		expect( formatTimecode( 0 ) ).toBe( '' );
		expect( formatTimecode( -5 ) ).toBe( '' );
		expect( formatTimecode( NaN ) ).toBe( '' );
	} );
} );

describe( 'formatRuntime', () => {
	it( 'formats hours and minutes', () => {
		expect( formatRuntime( 4380000 ) ).toBe( '1 hr 13 min' );
	} );

	it( 'formats whole hours', () => {
		expect( formatRuntime( 7200000 ) ).toBe( '2 hr' );
	} );

	it( 'formats minutes only', () => {
		expect( formatRuntime( 300000 ) ).toBe( '5 min' );
	} );

	it( 'rounds very short durations up to one minute', () => {
		expect( formatRuntime( 10000 ) ).toBe( '1 min' );
	} );

	it( 'returns an empty string for unknown durations', () => {
		expect( formatRuntime( undefined ) ).toBe( '' );
		expect( formatRuntime( 0 ) ).toBe( '' );
	} );
} );

describe( 'resolutionLabel', () => {
	it( 'labels common heights', () => {
		expect( resolutionLabel( 1080 ) ).toBe( '1080p' );
		expect( resolutionLabel( 720 ) ).toBe( '720p' );
	} );

	it( 'labels 4K from 2160 up', () => {
		expect( resolutionLabel( 2160 ) ).toBe( '4K' );
		expect( resolutionLabel( 4320 ) ).toBe( '4K' );
	} );

	it( 'returns an empty string for unknown heights', () => {
		expect( resolutionLabel( undefined ) ).toBe( '' );
		expect( resolutionLabel( 0 ) ).toBe( '' );
	} );
} );

describe( 'playlistRuntimeMs', () => {
	it( 'sums known durations and ignores unknown ones', () => {
		expect(
			playlistRuntimeMs( [
				{ guid: 'aaaaaaaa', durationMs: 1000 },
				{ guid: 'bbbbbbbb' },
				{ guid: 'cccccccc', durationMs: 500 },
			] )
		).toBe( 1500 );
	} );

	it( 'returns 0 for an empty playlist', () => {
		expect( playlistRuntimeMs( [] ) ).toBe( 0 );
	} );
} );

describe( 'moveEntry', () => {
	it( 'moves an entry forward', () => {
		expect( moveEntry( [ 'a', 'b', 'c' ], 0, 2 ) ).toEqual( [ 'b', 'c', 'a' ] );
	} );

	it( 'moves an entry backward', () => {
		expect( moveEntry( [ 'a', 'b', 'c' ], 2, 0 ) ).toEqual( [ 'c', 'a', 'b' ] );
	} );

	it( 'returns the same list for no-op or out-of-range moves', () => {
		const list = [ 'a', 'b' ];
		expect( moveEntry( list, 0, 0 ) ).toBe( list );
		expect( moveEntry( list, 0, 5 ) ).toBe( list );
		expect( moveEntry( list, -1, 0 ) ).toBe( list );
	} );
} );

describe( 'playlistEmbedUrl', () => {
	it( 'builds the embed URL', () => {
		expect( playlistEmbedUrl( 'abcDEF12', false ) ).toBe(
			'https://videopress.com/embed/abcDEF12?cover=1&preloadContent=metadata&autoPlay=0'
		);
	} );

	it( 'toggles autoplay', () => {
		expect( playlistEmbedUrl( 'abcDEF12', true ) ).toContain( 'autoPlay=1' );
	} );
} );
