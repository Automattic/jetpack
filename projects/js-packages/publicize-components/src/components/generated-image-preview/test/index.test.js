import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import GeneratedImagePreview, {
	calculateImageUrl,
	getImageId,
	FEATURED_IMAGE_STILL_LOADING,
} from '..';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';

jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/api-fetch' );

jest.mock( '../../../hooks/use-image-generator-config', () => jest.fn() );

jest.mock( '../styles.module.scss', () => ( { hidden: 'hidden' } ) );

const TEST_TOKEN = 'test_token_123';
const TEST_IMAGE_URL = 'https://example.com/image.jpg';

const setupMocks = ( title = 'Title', customText = 'Custom text' ) => {
	useSelect.mockImplementation( () => {
		return {
			title,
			featuredImage: 1,
			imageUrl: TEST_IMAGE_URL,
		};
	} );
	apiFetch.mockReturnValue( Promise.resolve( TEST_TOKEN ) );
	useImageGeneratorConfig.mockReturnValue( {
		customText,
		imageTyp: 'Featured',
		imageId: 1,
		template: 'dois',
	} );
};

const getPostBody = ( text, template ) => ( {
	path: 'wpcom/v2/publicize/social-image-generator/generate-token',
	method: 'POST',
	data: {
		text: text,
		image_url: TEST_IMAGE_URL,
		template: template,
	},
} );

describe( 'GeneratedImagePreview', () => {
	setupMocks();

	it( 'should define the component', () => {
		expect( 'GeneratedImagePreview' ).toBeDefined();
	} );

	it( 'should render component with the spinner and img hidden', async () => {
		render( <GeneratedImagePreview /> );

		const image = screen.queryByRole( 'img' );
		expect( image ).toHaveClass( 'hidden' );
		await expect( screen.findByTestId( 'spinner' ) ).resolves.toBeInTheDocument();
	} );

	it( 'should use custom text over title', async () => {
		render( <GeneratedImagePreview /> );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( getPostBody( 'Custom text', 'dois' ) );
		} );
	} );

	it( 'should use title if there is no custom text', async () => {
		setupMocks( 'Title', '' );
		render( <GeneratedImagePreview /> );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( getPostBody( 'Title', 'dois' ) );
		} );
	} );

	it( 'should have the correct image source', async () => {
		render( <GeneratedImagePreview /> );

		const image = screen.queryByRole( 'img' );
		await expect( screen.findByTestId( 'spinner' ) ).resolves.toBeInTheDocument();
		await waitFor( () => {
			expect( image ).toHaveAttribute(
				'src',
				`https://jetpack.com/redirect/?source=sigenerate&query=t%3D${ TEST_TOKEN }`
			);
		} );
	} );

	it( 'should not show the spinner on image load', async () => {
		render( <GeneratedImagePreview /> );

		const image = screen.queryByRole( 'img' );
		fireEvent.load( image );

		await waitFor( () => {
			expect( screen.queryByTestId( 'spinner' ) ).not.toBeInTheDocument();
		} );
		expect( image ).not.toHaveClass( 'hidden' );
	} );

	describe( 'Image URL calculation', () => {
		const CUSTOM_ID = 1;
		const FEATURED_ID = 2;
		const DEFAULT_ID = 10;
		const getMediaMock = id => ( {
			source_url: id,
		} );

		it( 'should use the default image if the type is default', () => {
			const imageUrl = calculateImageUrl(
				'default',
				CUSTOM_ID,
				FEATURED_ID,
				DEFAULT_ID,
				getMediaMock
			);
			expect( imageUrl ).toBe( DEFAULT_ID );
		} );

		it( 'should use the default image if the type is null and there is no featured image', () => {
			const imageUrl = calculateImageUrl( null, 0, 0, DEFAULT_ID, getMediaMock );
			expect( imageUrl ).toBe( DEFAULT_ID );
		} );

		it( 'should use the custom image if the type is custom', () => {
			const imageUrl = calculateImageUrl(
				'custom',
				CUSTOM_ID,
				FEATURED_ID,
				DEFAULT_ID,
				getMediaMock
			);
			expect( imageUrl ).toBe( CUSTOM_ID );
		} );

		it( 'should use the featured image if the type is featured', () => {
			const imageUrl = calculateImageUrl(
				'featured',
				CUSTOM_ID,
				FEATURED_ID,
				DEFAULT_ID,
				getMediaMock
			);
			expect( imageUrl ).toBe( FEATURED_ID );
		} );

		it( 'should return null if type is none', () => {
			const imageUrl = calculateImageUrl(
				'none',
				CUSTOM_ID,
				FEATURED_ID,
				DEFAULT_ID,
				getMediaMock
			);
			expect( imageUrl ).toBeNull();
		} );

		it( 'should return null the type is custom but there is no image picked', () => {
			const imageUrl = calculateImageUrl(
				'custom',
				undefined,
				FEATURED_ID,
				DEFAULT_ID,
				getMediaMock
			);
			expect( imageUrl ).toBeNull();
		} );

		it( 'should return status if featured image is still loading', () => {
			const imageUrl = calculateImageUrl(
				'featured',
				undefined,
				FEATURED_ID,
				DEFAULT_ID,
				() => undefined
			);
			expect( imageUrl ).toBe( FEATURED_IMAGE_STILL_LOADING );
		} );

		it( 'should return null if type is default but defaultImageId is 0', () => {
			const imageUrl = calculateImageUrl( 'default', null, 0, 0, getMediaMock );
			expect( imageUrl ).toBeNull();
		} );
	} );

	describe( 'getImageId', () => {
		const CUSTOM_ID = 100;
		const FEATURED_ID = 200;
		const DEFAULT_ID = 300;

		describe( 'Custom image type', () => {
			it( 'should return customImageId when type is custom and customImageId is provided', () => {
				const result = getImageId( 'custom', CUSTOM_ID, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( CUSTOM_ID );
			} );

			it( 'should fallback to featuredImageId when type is custom but no customImageId', () => {
				const result = getImageId( 'custom', null, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should fallback to defaultImageId when type is custom, no customImageId, and no featuredImageId', () => {
				const result = getImageId( 'custom', null, null, DEFAULT_ID );
				expect( result ).toBe( DEFAULT_ID );
			} );

			it( 'should return undefined when type is custom and no images available', () => {
				const result = getImageId( 'custom', null, null, null );
				expect( result ).toBeNull();
			} );
		} );

		describe( 'Default image type', () => {
			it( 'should return defaultImageId when type is default and defaultImageId is provided', () => {
				const result = getImageId( 'default', CUSTOM_ID, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( DEFAULT_ID );
			} );

			it( 'should fallback to featuredImageId when type is default but no defaultImageId', () => {
				const result = getImageId( 'default', CUSTOM_ID, FEATURED_ID, null );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should return undefined when type is default and no defaultImageId or featuredImageId', () => {
				const result = getImageId( 'default', CUSTOM_ID, null, null );
				expect( result ).toBeNull();
			} );
		} );

		describe( 'Featured image type', () => {
			it( 'should return featuredImageId when type is featured and featuredImageId is provided', () => {
				const result = getImageId( 'featured', CUSTOM_ID, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should fallback to defaultImageId when type is featured but no featuredImageId', () => {
				const result = getImageId( 'featured', CUSTOM_ID, null, DEFAULT_ID );
				expect( result ).toBe( DEFAULT_ID );
			} );

			it( 'should return undefined when type is featured and no featuredImageId or defaultImageId', () => {
				const result = getImageId( 'featured', CUSTOM_ID, null, null );
				expect( result ).toBeNull();
			} );
		} );

		describe( 'Fallback behavior', () => {
			it( 'should fallback to featuredImageId when imageType is null/undefined', () => {
				const result = getImageId( null, CUSTOM_ID, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should fallback to defaultImageId when imageType is null and no featuredImageId', () => {
				const result = getImageId( null, CUSTOM_ID, null, DEFAULT_ID );
				expect( result ).toBe( DEFAULT_ID );
			} );

			it( 'should return undefined when imageType is null and no images available', () => {
				const result = getImageId( null, CUSTOM_ID, null, null );
				expect( result ).toBeNull();
			} );

			it( 'should fallback to featuredImageId for unknown imageType', () => {
				const result = getImageId( 'unknown', CUSTOM_ID, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should fallback to defaultImageId for unknown imageType when no featuredImageId', () => {
				const result = getImageId( 'unknown', CUSTOM_ID, null, DEFAULT_ID );
				expect( result ).toBe( DEFAULT_ID );
			} );
		} );

		describe( 'Edge cases', () => {
			it( 'should handle zero values correctly for customImageId', () => {
				const result = getImageId( 'custom', 0, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should handle zero values correctly for featuredImageId', () => {
				const result = getImageId( 'featured', CUSTOM_ID, 0, DEFAULT_ID );
				expect( result ).toBe( DEFAULT_ID );
			} );

			it( 'should handle zero values correctly for defaultImageId', () => {
				const result = getImageId( 'default', CUSTOM_ID, FEATURED_ID, 0 );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should prefer featuredImageId over defaultImageId in fallback (featuredImageId first)', () => {
				const result = getImageId( 'unknown', null, FEATURED_ID, DEFAULT_ID );
				expect( result ).toBe( FEATURED_ID );
			} );

			it( 'should prefer defaultImageId when featuredImageId is 0', () => {
				const result = getImageId( 'unknown', null, 0, DEFAULT_ID );
				expect( result ).toBe( DEFAULT_ID );
			} );
		} );
	} );
} );
