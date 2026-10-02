/**
 * Internal dependencies
 */
import { getVideoPosterUrl } from '../video-poster-url';

describe( 'getVideoPosterUrl', () => {
	it( 'asks Photon for the poster at the given size', () => {
		expect( getVideoPosterUrl( 'https://i0.wp.com/v/launch.jpg', 100, 56 ) ).toBe(
			'https://i0.wp.com/v/launch.jpg?resize=100%2C56'
		);
	} );

	it( 'keeps an existing query string', () => {
		expect( getVideoPosterUrl( 'https://i0.wp.com/v/launch.jpg?ssl=1', 100, 56 ) ).toBe(
			'https://i0.wp.com/v/launch.jpg?ssl=1&resize=100%2C56'
		);
	} );

	it.each( [ undefined, null, '', 'javascript:alert(1)', 42 ] )(
		'returns undefined for %p',
		poster => {
			expect( getVideoPosterUrl( poster, 100, 56 ) ).toBeUndefined();
		}
	);
} );
