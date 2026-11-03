import { getInlinePlayerOptions } from '../options';

describe( 'getInlinePlayerOptions', () => {
	it( 'applies the player defaults to an empty block', () => {
		expect( getInlinePlayerOptions( {} ) ).toEqual( {
			autoPlay: false,
			controls: true,
			loop: false,
			muted: false,
			persistVolume: true,
			playsinline: false,
			cover: true,
			hd: false,
			useAverageColor: true,
			preloadContent: 'metadata',
			chrome: 'v2',
		} );
	} );

	it( 'maps the block attributes the way the server does', () => {
		expect(
			getInlinePlayerOptions( {
				autoplay: true,
				controls: false,
				loop: true,
				muted: true,
				playsinline: true,
				poster: 'https://example.com/poster.jpg',
				preload: 'None',
				seekbarColor: '#111',
				seekbarPlayedColor: '#222',
				seekbarLoadingColor: '#333',
				useAverageColor: false,
			} )
		).toEqual(
			expect.objectContaining( {
				autoPlay: true,
				controls: false,
				loop: true,
				muted: true,
				persistVolume: false,
				playsinline: true,
				poster: 'https://example.com/poster.jpg',
				preloadContent: 'none',
				seekbarColor: '#111',
				seekbarPlayedColor: '#222',
				seekbarLoadedColor: '#333',
				useAverageColor: false,
			} )
		);
	} );

	it( 'falls back to metadata for unknown preload values and lets the site opt out', () => {
		expect( getInlinePlayerOptions( { preload: 'eager' } ).preloadContent ).toBe( 'metadata' );
		expect(
			getInlinePlayerOptions( { preload: 'auto' }, { preloadDisabled: true } ).preloadContent
		).toBe( 'none' );
	} );
} );
