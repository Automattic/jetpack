import { jest } from '@jest/globals';
import { render, screen, cleanup } from '@testing-library/react/pure';
import React from 'react';
import PricingCard from '../index';
import '@testing-library/jest-dom';

// Note we're using @testing-library/react/pure here to disable the automatic cleanup.
// So be sure to call `cleanup()` for each `render()`.
/* eslint-disable testing-library/no-render-in-setup */

describe( 'PricingCard', () => {
	const testProps = {
		title: 'Dummy Pricing Card',
		icon: 'dummy_icon',
		priceBefore: 9,
		priceAfter: 4.5,
		ctaText: 'Get Dummy Offer',
		infoText: 'Dummy Info Text',
		onCtaClick: jest.fn(),
	};

	describe( 'Initially', () => {
		let container;

		beforeAll( () => {
			( { container } = render( <PricingCard { ...testProps } /> ) );
		} );
		afterAll( () => {
			cleanup();
		} );

		it( 'renders the title', () => {
			expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Dummy Pricing Card' );
		} );

		it( 'renders the icon', () => {
			const img = screen.getByAltText( 'Icon for the product Dummy Pricing Card' );
			expect( img ).toBeInTheDocument();
			expect( img ).toHaveAttribute( 'src', 'dummy_icon' );
		} );

		it( 'renders the price before', () => {
			// eslint-disable-next-line testing-library/no-node-access
			const node = container.querySelector( '.jp-components__pricing-card__price-before' );
			expect( node ).toBeInTheDocument();
			expect( node ).toHaveTextContent( '$9' );
		} );

		it( 'renders the price after', () => {
			// eslint-disable-next-line testing-library/no-node-access
			const node = container.querySelector( '.jp-components__pricing-card__price-after' );
			expect( node ).toBeInTheDocument();
			expect( node ).toHaveTextContent( '$4.50' );
		} );

		it( 'renders the CTA button', () => {
			expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Get Dummy Offer' );
		} );

		it( 'renders the info text', () => {
			// eslint-disable-next-line testing-library/no-node-access
			const node = container.querySelector( '.jp-components__pricing-card__info' );
			expect( node ).toBeInTheDocument();
			expect( node ).toHaveTextContent( 'Dummy Info Text' );
		} );
	} );

	describe( 'When price before and price after match', () => {
		let container;

		beforeAll( () => {
			( { container } = render( <PricingCard { ...testProps } priceAfter={ 9 } /> ) );
		} );
		afterAll( () => {
			cleanup();
		} );

		it( "doesn't render the price before", () => {
			// eslint-disable-next-line testing-library/no-node-access
			const node = container.querySelector( '.jp-components__pricing-card__price-before' );
			expect( node ).not.toBeInTheDocument();
		} );

		it( 'renders the price after', () => {
			// eslint-disable-next-line testing-library/no-node-access
			const node = container.querySelector( '.jp-components__pricing-card__price-after' );
			expect( node ).toBeInTheDocument();
			expect( node ).toHaveTextContent( '$9' );
		} );
	} );
} );
