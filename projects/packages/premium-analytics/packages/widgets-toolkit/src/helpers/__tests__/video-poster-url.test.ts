/**
 * Internal dependencies
 */
import { getVideoPosterUrl } from '../video-poster-url';

describe( 'getVideoPosterUrl', () => {
	it.each( [
		[ 'https://i0.wp.com/v/launch.jpg', 'https://i0.wp.com/v/launch.jpg?resize=100%2C56' ],
		[
			'https://i0.wp.com/v/launch.jpg?ssl=1',
			'https://i0.wp.com/v/launch.jpg?ssl=1&resize=100%2C56',
		],
		[ 'javascript:alert(1)', undefined ],
	] )( 'resolves %p to %p', ( poster, expected ) => {
		expect( getVideoPosterUrl( poster, 100, 56 ) ).toBe( expected );
	} );
} );
