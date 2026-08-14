import { getVideoPressGuid, getEmbedUrl, getPlayerOptions } from '../utils';

describe( 'getVideoPressGuid', () => {
	it( 'returns a bare GUID unchanged', () => {
		expect( getVideoPressGuid( 'kUJmAcSf' ) ).toBe( 'kUJmAcSf' );
	} );

	it( 'extracts the GUID from canonical VideoPress URLs', () => {
		expect( getVideoPressGuid( 'https://videopress.com/v/kUJmAcSf' ) ).toBe( 'kUJmAcSf' );
		expect( getVideoPressGuid( 'https://videopress.com/embed/kUJmAcSf' ) ).toBe( 'kUJmAcSf' );
	} );

	it( 'handles the optional www. and .wordpress host branches', () => {
		expect( getVideoPressGuid( 'http://www.video.wordpress.com/v/kUJmAcSf' ) ).toBe( 'kUJmAcSf' );
	} );

	it( 'drops a trailing query string', () => {
		expect( getVideoPressGuid( 'https://videopress.com/v/kUJmAcSf?resizeToParent=true' ) ).toBe(
			'kUJmAcSf'
		);
	} );

	it( 'returns an empty string for empty or non-alphanumeric input', () => {
		expect( getVideoPressGuid( '' ) ).toBe( '' );
		expect( getVideoPressGuid( undefined ) ).toBe( '' );
		expect( getVideoPressGuid( '!!!' ) ).toBe( '' );
	} );

	// The host/path prefix is optional, so a non-VideoPress URL (or a VideoPress
	// URL with no GUID) falls back to capturing the scheme. Pinning this documents
	// that callers must not assume the result is a real GUID, and guards against a
	// regex change silently altering what gets fed into the embed URL.
	it( 'falls back to the URL scheme when no VideoPress GUID is present', () => {
		expect( getVideoPressGuid( 'https://example.com/v/abc' ) ).toBe( 'https' );
		expect( getVideoPressGuid( 'https://videopress.com/v/' ) ).toBe( 'https' );
	} );
} );

describe( 'getEmbedUrl', () => {
	it( 'omits player options at their defaults, keeping only the embedder', () => {
		expect( getEmbedUrl( 'kUJmAcSf' ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?embedder=divi-builder'
		);
	} );

	it( 'adds only the options that differ from the player defaults', () => {
		expect( getEmbedUrl( 'kUJmAcSf', { autoplay: true } ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?autoPlay=1&embedder=divi-builder'
		);
		expect( getEmbedUrl( 'kUJmAcSf', { loop: true } ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?loop=1&embedder=divi-builder'
		);
		expect( getEmbedUrl( 'kUJmAcSf', { playsinline: true } ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?playsinline=1&embedder=divi-builder'
		);
	} );

	it( 'mutes by disabling persistVolume, matching the VideoPress block', () => {
		expect( getEmbedUrl( 'kUJmAcSf', { muted: true } ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?muted=1&persistVolume=0&embedder=divi-builder'
		);
	} );

	it( 'emits controls=0 only when controls are turned off', () => {
		expect( getEmbedUrl( 'kUJmAcSf', { controls: true } ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?embedder=divi-builder'
		);
		expect( getEmbedUrl( 'kUJmAcSf', { controls: false } ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?controls=0&embedder=divi-builder'
		);
	} );

	it( 'combines all non-default options in a stable order', () => {
		expect(
			getEmbedUrl( 'kUJmAcSf', {
				autoplay: true,
				loop: true,
				muted: true,
				controls: false,
				playsinline: true,
			} )
		).toBe(
			'https://videopress.com/embed/kUJmAcSf?autoPlay=1&loop=1&muted=1&persistVolume=0&controls=0&playsinline=1&embedder=divi-builder'
		);
	} );
} );

describe( 'getPlayerOptions', () => {
	const toggle = value => ( { innerContent: { desktop: { value } } } );

	it( 'falls back to the player defaults when attributes are unset', () => {
		expect( getPlayerOptions( {} ) ).toEqual( {
			autoplay: false,
			loop: false,
			muted: false,
			controls: true,
			playsinline: false,
		} );
		expect( getPlayerOptions( undefined ) ).toEqual( {
			autoplay: false,
			loop: false,
			muted: false,
			controls: true,
			playsinline: false,
		} );
	} );

	it( 'reads on/off toggle values from attributes', () => {
		expect(
			getPlayerOptions( {
				autoplay: toggle( 'on' ),
				controls: toggle( 'off' ),
			} )
		).toEqual( {
			autoplay: true,
			loop: false,
			muted: false,
			controls: false,
			playsinline: false,
		} );
	} );
} );
