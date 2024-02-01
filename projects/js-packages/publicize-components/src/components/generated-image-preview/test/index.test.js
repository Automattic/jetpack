import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import GeneratedImagePreview, { calculateImageUrl, FEATURED_IMAGE_STILL_LOADING } from '..';
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
	path: '/jetpack/v4/social-image-generator/generate-preview-token',
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
		const getMediaMock = id => ( {
			source_url: id,
		} );

		it( 'should use the custom image if the type is custom', () => {
			const imageUrl = calculateImageUrl( 'custom', CUSTOM_ID, FEATURED_ID, getMediaMock );
			expect( imageUrl ).toBe( CUSTOM_ID );
		} );

		it( 'should use the featured image if the type is featured', () => {
			const imageUrl = calculateImageUrl( 'featured', CUSTOM_ID, FEATURED_ID, getMediaMock );
			expect( imageUrl ).toBe( FEATURED_ID );
		} );

		it( 'should return null if type is none', () => {
			const imageUrl = calculateImageUrl( 'none', CUSTOM_ID, FEATURED_ID, getMediaMock );
			expect( imageUrl ).toBeNull();
		} );

		it( 'should return null the type is custom but there is no image picked', () => {
			const imageUrl = calculateImageUrl( 'custom', undefined, FEATURED_ID, getMediaMock );
			expect( imageUrl ).toBeNull();
		} );

		it( 'should return status if featured image is still loading', () => {
			const imageUrl = calculateImageUrl( 'featured', undefined, FEATURED_ID, () => undefined );
			expect( imageUrl ).toBe( FEATURED_IMAGE_STILL_LOADING );
		} );
	} );
} );
