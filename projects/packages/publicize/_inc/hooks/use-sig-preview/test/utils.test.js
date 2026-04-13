import {
	calculateImageUrl,
	FEATURED_IMAGE_STILL_LOADING,
	getImageId,
	getSigImageUrl,
} from '../utils';

jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.fn( ( slug, { query } ) => `https://example.com/${ slug }?${ query }` ),
} ) );

describe( 'use-sig-preview utils', () => {
	describe( 'getSigImageUrl', () => {
		it( 'should return the correct URL with token', () => {
			const result = getSigImageUrl( 'test-token-123' );
			expect( result ).toBe( 'https://example.com/sigenerate?t=test-token-123' );
		} );

		it( 'should return empty string when token is empty', () => {
			const result = getSigImageUrl( '' );
			expect( result ).toBe( '' );
		} );

		it( 'should return empty string when token is null/undefined', () => {
			expect( getSigImageUrl( null ) ).toBe( '' );
			expect( getSigImageUrl( undefined ) ).toBe( '' );
		} );
	} );

	describe( 'getImageId', () => {
		const CUSTOM_ID = 100;
		const FEATURED_ID = 200;
		const DEFAULT_ID = 300;

		it( 'should return customImageId when type is custom', () => {
			expect( getImageId( 'custom', CUSTOM_ID, FEATURED_ID, DEFAULT_ID ) ).toBe( CUSTOM_ID );
		} );

		it( 'should return defaultImageId when type is default', () => {
			expect( getImageId( 'default', CUSTOM_ID, FEATURED_ID, DEFAULT_ID ) ).toBe( DEFAULT_ID );
		} );

		it( 'should return featuredImageId when type is featured', () => {
			expect( getImageId( 'featured', CUSTOM_ID, FEATURED_ID, DEFAULT_ID ) ).toBe( FEATURED_ID );
		} );

		it( 'should fallback to featuredImageId when type is custom but no custom image', () => {
			expect( getImageId( 'custom', null, FEATURED_ID, DEFAULT_ID ) ).toBe( FEATURED_ID );
		} );

		it( 'should fallback to featuredImageId when type is default but no default image', () => {
			expect( getImageId( 'default', CUSTOM_ID, FEATURED_ID, null ) ).toBe( FEATURED_ID );
		} );

		it( 'should fallback to defaultImageId when type is featured but no featured image', () => {
			expect( getImageId( 'featured', CUSTOM_ID, null, DEFAULT_ID ) ).toBe( DEFAULT_ID );
		} );

		it( 'should return featuredImageId for null/undefined imageType', () => {
			expect( getImageId( null, CUSTOM_ID, FEATURED_ID, DEFAULT_ID ) ).toBe( FEATURED_ID );
		} );
	} );

	describe( 'calculateImageUrl', () => {
		const CUSTOM_ID = 1;
		const FEATURED_ID = 2;
		const DEFAULT_ID = 10;
		const getMediaMock = id => ( {
			source_url: `https://example.com/image-${ id }.jpg`,
		} );

		it( 'should return null when imageType is none', () => {
			expect(
				calculateImageUrl( 'none', CUSTOM_ID, FEATURED_ID, DEFAULT_ID, getMediaMock )
			).toBeNull();
		} );

		it( 'should return null when type is custom but no custom image', () => {
			expect(
				calculateImageUrl( 'custom', null, FEATURED_ID, DEFAULT_ID, getMediaMock )
			).toBeNull();
		} );

		it( 'should return null when type is default but no default image', () => {
			expect(
				calculateImageUrl( 'default', CUSTOM_ID, FEATURED_ID, null, getMediaMock )
			).toBeNull();
		} );

		it( 'should return null when type is featured but no featured image and no default', () => {
			expect( calculateImageUrl( 'featured', CUSTOM_ID, null, null, getMediaMock ) ).toBeNull();
		} );

		it( 'should return FEATURED_IMAGE_STILL_LOADING when media is not loaded yet', () => {
			const getMediaMockUndefined = () => undefined;
			expect(
				calculateImageUrl( 'featured', CUSTOM_ID, FEATURED_ID, DEFAULT_ID, getMediaMockUndefined )
			).toBe( FEATURED_IMAGE_STILL_LOADING );
		} );

		it( 'should return null when media resolved but attachment does not exist', () => {
			const getMediaMockNull = () => null;
			expect(
				calculateImageUrl( 'featured', CUSTOM_ID, FEATURED_ID, DEFAULT_ID, getMediaMockNull )
			).toBeNull();
		} );

		it( 'should return null when type is default and default image was deleted', () => {
			const getMediaMockNull = () => null;
			expect(
				calculateImageUrl( 'default', null, FEATURED_ID, DEFAULT_ID, getMediaMockNull )
			).toBeNull();
		} );

		it( 'should return the source_url from media', () => {
			expect(
				calculateImageUrl( 'featured', CUSTOM_ID, FEATURED_ID, DEFAULT_ID, getMediaMock )
			).toBe( `https://example.com/image-${ FEATURED_ID }.jpg` );
		} );

		it( 'should prefer large size source_url when available', () => {
			const getMediaMockWithSizes = () => ( {
				source_url: 'https://example.com/full.jpg',
				media_details: {
					sizes: {
						large: {
							source_url: 'https://example.com/large.jpg',
						},
					},
				},
			} );
			expect(
				calculateImageUrl( 'featured', CUSTOM_ID, FEATURED_ID, DEFAULT_ID, getMediaMockWithSizes )
			).toBe( 'https://example.com/large.jpg' );
		} );
	} );
} );
