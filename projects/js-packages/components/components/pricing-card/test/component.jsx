/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { noop } from 'lodash';
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import PricingCard from '../index';

describe( 'PricingCard', () => {
	const testProps = {
		title: 'Dummy Pricing Card',
		icon: 'dummy_icon',
		priceBefore: 9,
		priceAfter: 4.5,
		ctaText: 'Get Dummy Offer',
		infoText: 'Dummy Info Text',
		onCtaClick: noop,
	};

	describe( 'Initially', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <PricingCard { ...testProps } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( 'renders the title', () => {
			expect( wrapper.find( '.jp-components__pricing-card__title' ).render().text() ).to.be.equal(
				'Dummy Pricing Card'
			);
		} );

		it( 'renders the icon', () => {
			expect( wrapper.find( '.jp-components__pricing-card__icon img' ).prop( 'src' ) ).to.be.equal(
				'dummy_icon'
			);
		} );

		it( 'renders the price before', () => {
			expect(
				wrapper
					.find( '.jp-components__pricing-card__price-before .jp-components__pricing-card__price' )
					.render()
					.text()
			).to.be.equal( '9' );
		} );

		it( 'renders the integer portion of the price after', () => {
			expect(
				wrapper
					.find( '.jp-components__pricing-card__price-after .jp-components__pricing-card__price' )
					.render()
					.text()
			).to.be.equal( '4' );
		} );

		it( 'renders the decimal portion of the price after', () => {
			expect(
				wrapper
					.find(
						'.jp-components__pricing-card__price-after .jp-components__pricing-card__price-decimal'
					)
					.render()
					.text()
			).to.be.equal( '.50' );
		} );

		it( 'renders the CTA button', () => {
			expect( wrapper.find( '.jp-components__pricing-card__button' ).render().text() ).to.be.equal(
				'Get Dummy Offer'
			);
		} );

		it( 'renders the info text', () => {
			expect( wrapper.find( '.jp-components__pricing-card__info' ).render().text() ).to.be.equal(
				'Dummy Info Text'
			);
		} );
	} );

	describe( 'When price before and price after match', () => {
		const renderer = new ShallowRenderer();
		renderer.render( <PricingCard { ...testProps } priceAfter={ 9 } /> );

		const wrapper = shallow( renderer.getRenderOutput() );

		it( "doesn't render the price before", () => {
			expect(
				wrapper.find(
					'.jp-components__pricing-card__price-before .jp-components__pricing-card__price'
				)
			).to.have.length( 0 );
		} );

		it( 'renders the price after', () => {
			expect(
				wrapper
					.find( '.jp-components__pricing-card__price-after .jp-components__pricing-card__price' )
					.render()
					.text()
			).to.be.equal( '9' );
		} );
	} );
} );
