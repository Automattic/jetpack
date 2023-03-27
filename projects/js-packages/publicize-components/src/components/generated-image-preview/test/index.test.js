import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import GeneratedImagePreview from '..';

jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/api-fetch' );

jest.mock( '../../../hooks/use-image-generator-config', () => {
	return jest.fn( () => ( {
		customText: 'Custom text',
		imageTyp: 'Featured',
		imageId: 1,
		template: 'dois',
	} ) );
} );

jest.mock( '../styles.module.scss', () => ( { hidden: 'hidden' } ) );

const TEST_TOKEN = 'test_token_123';

describe( 'GeneratedImagePreview', () => {
	useSelect.mockImplementation( () => {
		return {
			title: 'Title',
			featuredImage: 1,
		};
	} );
	apiFetch.mockReturnValue( Promise.resolve( TEST_TOKEN ) );

	it( 'should define the component', () => {
		expect( 'GeneratedImagePreview' ).toBeDefined();
	} );

	it( 'should render component with the spinner and img hidden', async () => {
		render( <GeneratedImagePreview /> );

		const image = screen.queryByRole( 'img' );
		expect( image ).toHaveClass( 'hidden' );
		await expect( screen.findByTestId( 'spinner' ) ).resolves.toBeInTheDocument();
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
} );
