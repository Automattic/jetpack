/**
 * Internal dependencies
 */
import { buildVideoPressURL } from '..';

describe( 'buildVideoPressURL', () => {
	it( 'should return empty object when invalid URL', () => {
		const result = buildVideoPressURL( 'https://custom-domain.com/v/xyrdcYF4' );
		expect( result ).toStrictEqual( {} );
	} );

	it( 'should return undefined GUID', () => {
		const { guid } = buildVideoPressURL( 'https://custom-domain.com/v/xyrdcYF4' );
		expect( guid ).toBeUndefined();
	} );

	it( 'should return undefined URL', () => {
		const { url } = buildVideoPressURL( 'https://custom-domain.com/v/xyrdcYF4' );
		expect( url ).toBeUndefined();
	} );

	it( 'should return for videopress.com/v/guid', () => {
		const result = buildVideoPressURL( 'https://videopress.com/v/xyrdcYF4' );
		expect( result ).toStrictEqual( {
			url: 'https://videopress.com/v/xyrdcYF4',
			guid: 'xyrdcYF4',
		} );
	} );

	it( 'should return for videopress.com/embed/guid', () => {
		const result = buildVideoPressURL( 'https://videopress.com/embed/xyrdcYF4' );
		expect( result ).toStrictEqual( {
			url: 'https://videopress.com/embed/xyrdcYF4',
			guid: 'xyrdcYF4',
		} );
	} );

	it( 'should return for video.wordpress.com/v/guid', () => {
		const result = buildVideoPressURL( 'https://video.wordpress.com/v/xyrdcYF4' );
		expect( result ).toStrictEqual( {
			url: 'https://video.wordpress.com/v/xyrdcYF4',
			guid: 'xyrdcYF4',
		} );
	} );

	it( 'should return for video.wordpress.com/embed/guid', () => {
		const result = buildVideoPressURL( 'https://video.wordpress.com/embed/xyrdcYF4' );
		expect( result ).toStrictEqual( {
			url: 'https://video.wordpress.com/embed/xyrdcYF4',
			guid: 'xyrdcYF4',
		} );
	} );

	it( 'should return for video.files.wordpress.com/guid/filename.ext', () => {
		const result = buildVideoPressURL(
			'https://videos.files.wordpress.com/xyrdcYF4/screen-recording-2023-01-13-at-08.21.53-1.mov'
		);
		expect( result ).toStrictEqual( {
			url: 'https://videos.files.wordpress.com/xyrdcYF4/screen-recording-2023-01-13-at-08.21.53-1.mov',
			guid: 'xyrdcYF4',
		} );
	} );
} );
