import { photonResize } from '../photon-resize';

test( 'returns a Photon URL for a supported image type when enabled', () => {
	expect( photonResize( 'http://example.com/okapi.jpg', 600, 600, true ) ).toMatch(
		/i[0-9]\.wp\.com/
	);
} );

test( 'returns the original URL when Photon is disabled', () => {
	const url = 'http://example.com/okapi.jpg';
	expect( photonResize( url, 600, 600, false ) ).toEqual( url );
} );

test( 'returns the original URL for an unsupported image type', () => {
	const url = 'http://example.com/okapi.svg';
	expect( photonResize( url, 600, 600, true ) ).toEqual( url );
} );

test( 'returns an empty value unchanged', () => {
	expect( photonResize( '', 600, 600, true ) ).toBe( '' );
} );
