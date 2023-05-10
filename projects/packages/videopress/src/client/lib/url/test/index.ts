/**
 * Internal dependencies
 */
import { buildVideoPressURL, pickVideoBlockAttributesFromUrl } from '..';

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
