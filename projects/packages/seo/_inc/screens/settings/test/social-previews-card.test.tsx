/* eslint-disable testing-library/prefer-user-event */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

jest.unstable_mockModule( '../../../data/get-site', () => ( {
	default: () => ( {
		title: 'Example site',
		tagline: 'Example tagline',
		url: 'https://example.com',
		icon: '',
		image: 'https://example.com/representative.jpg',
	} ),
} ) );

const { default: SocialPreviewsCard } = await import( '../social-previews-card' );

describe( 'SocialPreviewsCard', () => {
	it( 'uses the site tagline when the front-page description is empty', () => {
		render( <SocialPreviewsCard description="" /> );
		fireEvent.click( screen.getByRole( 'button', { name: /Search & social previews/ } ) );

		expect( screen.getAllByText( 'Example tagline' ) ).toHaveLength( 3 );
	} );

	it( 'prefers the front-page description over the tagline', () => {
		render( <SocialPreviewsCard description="Custom description" /> );
		fireEvent.click( screen.getByRole( 'button', { name: /Search & social previews/ } ) );

		expect( screen.getAllByText( 'Custom description' ) ).toHaveLength( 3 );
		expect( screen.queryByText( 'Example tagline' ) ).not.toBeInTheDocument();
	} );
} );
