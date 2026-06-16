import { getVideoPressGuid, getEmbedUrl } from '../utils';

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
	it( 'builds the embed URL with the divi-builder embedder params', () => {
		expect( getEmbedUrl( 'kUJmAcSf' ) ).toBe(
			'https://videopress.com/embed/kUJmAcSf?autoPlay=0&permalink=0&loop=0&embedder=divi-builder'
		);
	} );
} );
