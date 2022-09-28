import { render, screen } from '@testing-library/react';
import React from 'react';
import InPlaceConnection from '../index';

describe( 'InPlaceConnection', () => {
	const testProps = {
		title: 'Sample Title',
		connectUrl: 'https://jetpack.wordpress.com/jetpack.authorize/1/',
		scrollToIframe: false,
		displayTOS: false,
		location: 'testing',
	};

	describe( 'Loading state', () => {
		it( 'renders a "loading..." message', () => {
			render( <InPlaceConnection { ...testProps } isLoading={ true } /> );
			expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When the connect url is fetched', () => {
		it( 'has the iframe to jetpack.wordpress.com', () => {
			render( <InPlaceConnection { ...testProps } /> );
			const iframe = screen.getByTitle( 'Sample Title' );
			expect( iframe.nodeName ).toBe( 'IFRAME' );
			expect( iframe ).toHaveAttribute(
				'src',
				'https://jetpack.wordpress.com/jetpack.authorize_iframe/1/?&iframe_height=300&iframe_source=testing'
			);
			expect( iframe ).toHaveAttribute( 'width', '100%' );
			expect( iframe ).toHaveAttribute( 'height', '300' );
		} );
	} );

	describe( 'Secondary user, add "tos" flag to URL', () => {
		it( 'has a link to jetpack.wordpress.com', () => {
			render( <InPlaceConnection { ...testProps } displayTOS={ true } /> );
			const iframe = screen.getByTitle( 'Sample Title' );
			expect( iframe.nodeName ).toBe( 'IFRAME' );
			expect( iframe ).toHaveAttribute( 'src', expect.stringContaining( '&display-tos' ) );
		} );
	} );
} );
