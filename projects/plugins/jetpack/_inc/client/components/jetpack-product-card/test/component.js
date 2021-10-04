/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import { getCurrencyObject } from '@automattic/format-currency';

/**
 * Internal dependencies
 */
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
	};

	it( 'text attributes are shown', () => {
		render( <JetpackProductCard { ...mockAttributes } /> );

		expect( screen.getByRole( 'heading', { name: mockAttributes.title } ) ).to.exist;
		expect( screen.getAllByText( mockAttributes.description ) ).to.exist;
		expect( screen.getAllByText( mockAttributes.billingDescription ) ).to.exist;
		expect( screen.getByRole( 'link', { name: mockAttributes.checkoutText, } ) ).to.exist;
	} );

	it( 'price is shown', () => {
		const { container } = render( <JetpackProductCard { ...mockAttributes } /> );
		const priceObject = getCurrencyObject( mockAttributes.price, mockAttributes.currencyCode );

		expect( getNodeText( container.querySelector( '.jp-product-card__currency-symbol' ) ) ).to.be.equal( priceObject.symbol );
		expect( getNodeText( container.querySelector( '.jp-product-card__price-integer' ) ) ).to.be.equal( priceObject.integer );
		expect( getNodeText( container.querySelector( '.jp-product-card__price-fraction' ) ) ).to.be.equal( priceObject.fraction );
	} );

	it( 'discounted price is shown', () => {
		const discount = 50;
		const { container } = render( <JetpackProductCard { ...mockAttributes } discount={ discount }/> );

		// Show original price.
		const originalPriceObject = getCurrencyObject( mockAttributes.price, mockAttributes.currencyCode );
		expect( getNodeText( container.querySelector( '.jp-product-card__raw-price.jp-product-card__raw-price--is-old-price .jp-product-card__currency-symbol' ) ) ).to.be.equal( originalPriceObject.symbol );
		expect( getNodeText( container.querySelector( '.jp-product-card__raw-price.jp-product-card__raw-price--is-old-price .jp-product-card__price-integer' ) ) ).to.be.equal( originalPriceObject.integer );
		expect( getNodeText( container.querySelector( '.jp-product-card__raw-price.jp-product-card__raw-price--is-old-price .jp-product-card__price-fraction' ) ) ).to.be.equal( originalPriceObject.fraction );

		// Show discounted price.
		const discountedPriceObject = getCurrencyObject( ( mockAttributes.price * ( 100 - discount ) / 100 ), mockAttributes.currencyCode );
		expect( getNodeText( container.querySelector( '.jp-product-card__raw-price:not( .jp-product-card__raw-price--is-old-price ) .jp-product-card__currency-symbol' ) ) ).to.be.equal( discountedPriceObject.symbol );
		expect( getNodeText( container.querySelector( '.jp-product-card__raw-price:not( .jp-product-card__raw-price--is-old-price ) .jp-product-card__price-integer' ) ) ).to.be.equal( discountedPriceObject.integer );
		expect( getNodeText( container.querySelector( '.jp-product-card__raw-price:not( .jp-product-card__raw-price--is-old-price ) .jp-product-card__price-fraction' ) ) ).to.be.equal( discountedPriceObject.fraction );
	} );

	it( 'cta is shown', () => {
		const ctaText = 'Buy this upgrade!';
		render( <JetpackProductCard { ...mockAttributes } callToAction={ ctaText }/> );
		expect( screen.getAllByText( ctaText ) ).to.exist;
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
