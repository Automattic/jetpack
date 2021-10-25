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
			expect( wrapper.find( '.pricing__card--title' ).render().text() ).to.be.equal(
				'Dummy Pricing Card'
			);
		} );

		it( 'renders the icon', () => {
			expect( wrapper.find( '.pricing__card--icon img' ).prop( 'src' ) ).to.be.equal(
				'dummy_icon'
			);
		} );

		it( 'renders the price before', () => {
			expect(
				wrapper.find( '.pricing__card--price-before .pricing__card--price' ).render().text()
			).to.be.equal( '9' );
		} );

		it( 'renders the integer portion of the price after', () => {
			expect(
				wrapper.find( '.pricing__card--price-after .pricing__card--price' ).render().text()
			).to.be.equal( '4' );
		} );

		it( 'renders the decimal portion of the price after', () => {
			expect(
				wrapper.find( '.pricing__card--price-after .pricing__card--price-decimal' ).render().text()
			).to.be.equal( '.50' );
		} );

		it( 'renders the CTA button', () => {
			expect( wrapper.find( '.pricing__card--button' ).render().text() ).to.be.equal(
				'Get Dummy Offer'
			);
		} );

		it( 'renders the info text', () => {
			expect( wrapper.find( '.pricing__card--info' ).render().text() ).to.be.equal(
				'Dummy Info Text'
			);
		} );
	} );
} );
