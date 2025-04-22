/**
 * Internal dependencies
 */
import {
	buildVideoPressURL,
	pickVideoBlockAttributesFromUrl,
	getVideoNameFromUrl,
	removeFileNameExtension,
	isVideoPressUrl,
} from '..';

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

describe( 'pickVideoBlockAttributesFromUrl', () => {
	it( 'should return empty object when no URL', () => {
		const attributes = pickVideoBlockAttributesFromUrl( '' );
		expect( attributes ).toStrictEqual( {} );
	} );

	it( 'should return empty object when not valid URL', () => {
		const attributes = pickVideoBlockAttributesFromUrl( 'not-valid-url' );
		expect( attributes ).toStrictEqual( {} );
	} );

	it( 'should return controls attribute False from controls=0', () => {
		const attributes = pickVideoBlockAttributesFromUrl(
			'https://videopress.com/embed/7GMaYckU?cover=1&autoPlay=1&controls=0&loop=1&muted=1&persistVolume=0&playsinline=1&posterUrl=http%3A%2F%2Flocalhost%2Fwp-content%2Fuploads%2F2023%2F04%2Fpexels-photo-2693212.jpg&preloadContent=metadata&sbc=%23cf2e2e&sbpc=%23fcb900&sblc=%239b51e0&hd=1'
		);
		expect( attributes.controls ).toBe( false );
	} );

	it( 'should return controls attribute False from controls=1', () => {
		const attributes = pickVideoBlockAttributesFromUrl(
			'https://videopress.com/embed/7GMaYckU?cover=1&autoPlay=1&controls=1&loop=1&muted=1&persistVolume=0&playsinline=1&posterUrl=http%3A%2F%2Flocalhost%2Fwp-content%2Fuploads%2F2023%2F04%2Fpexels-photo-2693212.jpg&preloadContent=metadata&sbc=%23cf2e2e&sbpc=%23fcb900&sblc=%239b51e0&hd=1'
		);
		expect( attributes.controls ).toBe( true );
	} );

	it( 'should return controls attribute False from controls=false', () => {
		const attributes = pickVideoBlockAttributesFromUrl(
			'https://videopress.com/embed/7GMaYckU?cover=1&autoPlay=1&controls=false&loop=1&muted=1&persistVolume=0&playsinline=1&posterUrl=http%3A%2F%2Flocalhost%2Fwp-content%2Fuploads%2F2023%2F04%2Fpexels-photo-2693212.jpg&preloadContent=metadata&sbc=%23cf2e2e&sbpc=%23fcb900&sblc=%239b51e0&hd=1'
		);
		expect( attributes.controls ).toBe( false );
	} );

	it( 'should return controls attribute False from controls=true', () => {
		const attributes = pickVideoBlockAttributesFromUrl(
			'https://videopress.com/embed/7GMaYckU?cover=1&autoPlay=1&controls=true&loop=1&muted=1&persistVolume=0&playsinline=1&posterUrl=http%3A%2F%2Flocalhost%2Fwp-content%2Fuploads%2F2023%2F04%2Fpexels-photo-2693212.jpg&preloadContent=metadata&sbc=%23cf2e2e&sbpc=%23fcb900&sblc=%239b51e0&hd=1'
		);
		expect( attributes.controls ).toBe( true );
	} );

	it( 'should return attributes without controls key', () => {
		const attributes = pickVideoBlockAttributesFromUrl(
			'https://videopress.com/embed/7GMaYckU?cover=1&autoPlay=1&loop=1&muted=1&persistVolume=0&playsinline=1&posterUrl=http%3A%2F%2Flocalhost%2Fwp-content%2Fuploads%2F2023%2F04%2Fpexels-photo-2693212.jpg&preloadContent=metadata&sbc=%23cf2e2e&sbpc=%23fcb900&sblc=%239b51e0&hd=1'
		);
		expect( attributes.controls ).toBeUndefined();
	} );

	it( 'should not return a not expected attribute', () => {
		const attributes = pickVideoBlockAttributesFromUrl(
			'https://videopress.com/embed/7GMaYckU?not-expected=1'
		);
		expect( attributes ).toStrictEqual( {} );
	} );

	it( 'should return the poster image URL', () => {
		const attributes = pickVideoBlockAttributesFromUrl(
			'https://videopress.com/embed/7GMaYckU?cover=1&autoPlay=1&loop=1&muted=1&persistVolume=0&playsinline=1&posterUrl=http%3A%2F%2Flocalhost%2Fwp-content%2Fuploads%2F2023%2F04%2Fpexels-photo-2693212.jpg&preloadContent=metadata&sbc=%23cf2e2e&sbpc=%23fcb900&sblc=%239b51e0&hd=1'
		);
		expect( attributes.poster ).toBe(
			'http://localhost/wp-content/uploads/2023/04/pexels-photo-2693212.jpg'
		);
	} );
} );

describe( 'getVideoNameFromUrl', () => {
	it( 'should return empty string when no URL', () => {
		expect( getVideoNameFromUrl( '' ) ).toBe( '' );

		expect( getVideoNameFromUrl( 'wrong-url' ) ).toBe( '' );
	} );

	it( 'should return video name from URL', () => {
		expect(
			getVideoNameFromUrl( 'https://test.wordpres.com/xxxx-photo-2693212/video-file.mp4' )
		).toBe( 'video-file.mp4' );

		expect( getVideoNameFromUrl( 'https://test.wordpres.com/xxxx-photo-2693212/video-file' ) ).toBe(
			'video-file'
		);
	} );
} );

describe( 'removeFileNameExtension', () => {
	it( 'should remove extension from a simple filename', () => {
		expect( removeFileNameExtension( 'video.mp4' ) ).toBe( 'video' );
	} );

	it( 'should remove extension from a filename with multiple dots', () => {
		expect( removeFileNameExtension( 'my.awesome.video.mp4' ) ).toBe( 'my.awesome.video' );
	} );

	it( 'should handle filenames without extension', () => {
		expect( removeFileNameExtension( 'video' ) ).toBe( 'video' );
	} );

	it( 'should handle filenames starting with a dot', () => {
		expect( removeFileNameExtension( '.htaccess' ) ).toBe( '' );
	} );

	it( 'should handle empty string', () => {
		expect( removeFileNameExtension( '' ) ).toBe( '' );
	} );
} );

describe( 'isVideoPressUrl', () => {
	describe( 'should return true for valid VideoPress URLs', () => {
		const validUrls = [
			'https://videopress.com/v/xyrdcYF4',
			'https://videopress.com/v/xyrdcYF4/',
			'https://videopress.com/embed/xyrdcYF4',
			'https://v.wordpress.com/xyrdcYF4/',
			'https://video.wordpress.com/v/xyrdcYF4',
			'https://video.wordpress.com/embed/xyrdcYF4/',
			'http://videopress.com/v/xyrdcYF4', // HTTP protocol
		];

		validUrls.forEach( url => {
			it( `should validate ${ url }`, () => {
				expect( isVideoPressUrl( url ) ).toBe( true );
			} );
		} );
	} );

	describe( 'should return false for invalid URLs', () => {
		const invalidUrls = [
			'https://example.com',
			'',
			'https://videopress.com/invalid/xyrdcYF4', // Invalid path
			'https://videopress.com/v/xyz', // Invalid GUID (too short)
			'https://videopress.com/v/xyrdcYF4extra', // Invalid GUID (too long)
			'https://videopress.com/v/', // Missing GUID
			'https://fakevideo.wordpress.com/v/xyrdcYF4', // Invalid subdomain
			'videopress.com/v/xyrdcYF4', // Missing protocol
		];

		invalidUrls.forEach( url => {
			it( `should not validate ${ url || '(empty string)' }`, () => {
				expect( isVideoPressUrl( url ) ).toBe( false );
			} );
		} );
	} );
} );
