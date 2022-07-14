import { getCurrencyObject } from '@automattic/format-currency';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import * as React from 'react';
import { render, screen } from 'test/test-utils';
import JetpackProductCard from '../index';

describe( 'Jetpack Product Card', () => {
	const mockAttributes = {
		title: 'Product name',
		productSlug: 'my-super-product',
		description: 'Lorem Ipsum could be used here! Or not?',
		price: 1000,
		checkoutText: 'Go to checkout',
		checkoutUrl: '#some-url',
		currencyCode: 'USD',
		billingDescription: 'Monthly, paid yearly',
		features: [ 'Feature One', 'Feature Two', 'Feature Three' ],
	};

	it( 'show introduction text', () => {
		render( <JetpackProductCard { ...mockAttributes } /> );

		expect( screen.getByRole( 'heading', { name: mockAttributes.title } ) ).toBeInTheDocument();
		expect( screen.getByText( mockAttributes.description ) ).toBeInTheDocument();

		mockAttributes.features.map( feature => {
			expect( screen.getByText( feature ) ).toBeInTheDocument();
		} );
	} );

	it( 'price is shown', () => {
		render( <JetpackProductCard { ...mockAttributes } /> );

		const priceObject = getCurrencyObject( mockAttributes.price, mockAttributes.currencyCode );

		expect( screen.getByText( priceObject.symbol ) ).toBeInTheDocument();
		expect( screen.getByText( priceObject.integer ) ).toBeInTheDocument();
		expect( screen.getByText( priceObject.fraction ) ).toBeInTheDocument();
		expect( screen.getByText( mockAttributes.billingDescription ) ).toBeInTheDocument();
	} );

	it( 'discounted price is shown', () => {
		const discountedPrice = mockAttributes.price / 2;
		render( <JetpackProductCard { ...mockAttributes } discountedPrice={ discountedPrice } /> );

		// Show original price.
		const originalPriceObject = getCurrencyObject(
			mockAttributes.price,
			mockAttributes.currencyCode
		);

		expect( screen.getAllByText( originalPriceObject.symbol ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( originalPriceObject.integer ) ).toBeInTheDocument();
		expect( screen.getAllByText( originalPriceObject.fraction ).length ).toBeGreaterThan( 0 );

		// Show discounted price.
		const discountedPriceObject = getCurrencyObject( discountedPrice, mockAttributes.currencyCode );

		expect( screen.getAllByText( discountedPriceObject.symbol ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( discountedPriceObject.integer ) ).toBeInTheDocument();
		expect( screen.getAllByText( discountedPriceObject.fraction ).length ).toBeGreaterThan( 0 );
	} );

	it( 'cta is shown', () => {
		const ctaText = 'Buy this upgrade!';
		render( <JetpackProductCard { ...mockAttributes } callToAction={ ctaText } /> );
		expect( screen.getByText( ctaText ) ).toBeInTheDocument();
	} );

	it( 'features list hidden with empty array', () => {
		const mockAttributesWithoutFeatures = {
			...mockAttributes,
			features: [],
		};

		const { container } = render( <JetpackProductCard { ...mockAttributesWithoutFeatures } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.jp-product-card__features' ) ).not.toBeInTheDocument();
	} );

	it( 'track event - jetpack_product_card_view', () => {
		const recordEventStub = jest
			.spyOn( analytics.tracks, 'recordEvent' )
			.mockImplementation( () => {} );

		render( <JetpackProductCard { ...mockAttributes } /> );

		expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_product_card_view', {
			type: mockAttributes.productSlug,
		} );

		recordEventStub.mockRestore();
	} );

	it( 'track event - jetpack_product_card_checkout_click', async () => {
		const user = userEvent.setup();

		const recordEventStub = jest
			.spyOn( analytics.tracks, 'recordEvent' )
			.mockImplementation( () => {} );

		render( <JetpackProductCard { ...mockAttributes } /> );

		const checkoutButton = screen.getByRole( 'link', { name: mockAttributes.checkoutText } );
		expect( checkoutButton ).toBeInTheDocument();

		// JSDom will complain about the page being redirect to wordpress.com/checkout/...
		// so we replace the href attribute of the HTML Element to something irrelevant.
		await user.click( checkoutButton );

		// Verify that tracking is working.
		expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_product_card_checkout_click', {
			type: mockAttributes.productSlug,
		} );

		recordEventStub.mockRestore();
	} );
} );
