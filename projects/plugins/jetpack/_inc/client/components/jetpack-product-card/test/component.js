import * as React from 'react';
import { expect } from 'chai';
import { getCurrencyObject } from '@automattic/format-currency';

import JetpackProductCard from '../index';
import analytics from 'lib/analytics';
import { fireEvent, render, screen, getNodeText } from 'test/test-utils';
import sinon from "sinon";

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
		features: [
			'Feature One',
			'Feature Two',
			'Feature Three',
		],
	};

	it( 'show introduction text', () => {
		render( <JetpackProductCard { ...mockAttributes } /> );

		expect( screen.getByRole( 'heading', { name: mockAttributes.title } ) ).to.exist;
		expect( screen.getAllByText( mockAttributes.description ) ).to.exist;

		mockAttributes.features.map( ( feature ) => {
			expect( screen.getAllByText( feature ) ).to.exist;
		} );
	} );

	it( 'price is shown', () => {
		const { container } = render( <JetpackProductCard { ...mockAttributes } /> );
		
		const priceObject = getCurrencyObject( mockAttributes.price, mockAttributes.currencyCode );

		expect( container.getAllByText( priceObject.symbol ) ).to.exist;
		expect( container.getAllByText( priceObject.integer ) ).to.exist;
		expect( container.getAllByText( priceObject.fraction ) ).to.exist;
		expect( container.getAllByText( mockAttributes.billingDescription ) ).to.exist;
	} );

	it( 'discounted price is shown', () => {
		const discountedPrice = mockAttributes.price / 2;
		const { container } = render( <JetpackProductCard { ...mockAttributes } discountedPrice={ discountedPrice }/> );

		// Show original price.
		const originalPriceObject = getCurrencyObject( mockAttributes.price, mockAttributes.currencyCode );

		expect( container.getAllByText( originalPriceObject.symbol ) ).to.exist;
		expect( container.getAllByText( originalPriceObject.integer ) ).to.exist;
		expect( container.getAllByText( originalPriceObject.fraction ) ).to.exist;
		
		// Show discounted price.
		const discountedPriceObject = getCurrencyObject( discountedPrice, mockAttributes.currencyCode );

		expect( container.getAllByText( discountedPriceObject.symbol ) ).to.exist;
		expect( container.getAllByText( discountedPriceObject.integer ) ).to.exist;
		expect( container.getAllByText( discountedPriceObject.fraction ) ).to.exist;
	} );

	it( 'cta is shown', () => {
		const ctaText = 'Buy this upgrade!';
		render( <JetpackProductCard { ...mockAttributes } callToAction={ ctaText }/> );
		expect( screen.getAllByText( ctaText ) ).to.exist;
	} );

	it( 'features list hidden with empty array', () => {
		const mockAttributesWithoutFeatures = {
			...mockAttributes,
			features: [],
		};

		const { container } = render( <JetpackProductCard { ...mockAttributesWithoutFeatures } /> );
		expect( container.querySelector( '.jp-product-card__features' ) ).to.not.exist;
	} );

	it( 'track event - jetpack_product_card_view', () => {
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <JetpackProductCard { ...mockAttributes }/> );

		expect(
			recordEventStub.withArgs(
				'jetpack_product_card_view',
				{ type: mockAttributes.productSlug },
			).callCount
		).to.be.equal( 1 );

		recordEventStub.restore();
	} );

	it( 'track event - jetpack_product_card_checkout_click', () => {
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <JetpackProductCard { ...mockAttributes }/> );

		const checkoutButton = screen.getByRole( 'link', { name: mockAttributes.checkoutText } );
		expect( checkoutButton ).to.exist;

		// JSDom will complain about the page being redirect to wordpress.com/checkout/...
		// so we replace the href attribute of the HTML Element to something irrelevant.
		fireEvent.click( checkoutButton );

		// Verify that tracking is working.
		expect(
			recordEventStub.withArgs(
				'jetpack_product_card_checkout_click',
				{ type: mockAttributes.productSlug },
			).callCount
		).to.be.equal( 1 );

		recordEventStub.restore();
	} );

} );
