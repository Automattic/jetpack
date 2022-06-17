import analytics from '@automattic/jetpack-analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import * as React from 'react';
import sinon from 'sinon';
import RedeemPartnerCouponPostConnection from '../';

const { location } = window;
const partnerCoupon = {
	coupon_code: 'TEST_TST_1234',
	preset: 'TST',
	partner: {
		name: 'Company name',
		prefix: 'TEST',
		logo: {
			src: 'IMAGE_SRC',
			width: 150,
			height: 100,
		},
	},
	product: {
		title: 'Awesome Product',
		slug: 'awesome-product',
		features: [ 'Feature 1', 'Feature 2', 'Feature 3' ],
	},
};
const requiredProps = {
	connectionStatus: { isRegistered: true },
	partnerCoupon: partnerCoupon,
	assetBaseUrl: 'PATH',
	siteRawUrl: 'example.com',
	tracksUserData: true,
	analytics: analytics,
};

let locationAssignSpy;
let recordEventStub;

describe( 'RedeemPartnerCouponPostConnection', () => {
	before( () => {
		locationAssignSpy = sinon.spy();
		recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );
	} );

	beforeEach( () => {
		// Spy on location.assign, so we don't get breaking errors when
		// we trigger click events on buttons/links.
		delete window.location;
		window.location = { assign: locationAssignSpy };
	} );

	afterEach( () => {
		window.location = location;
		locationAssignSpy.resetHistory();

		recordEventStub.reset();
	} );

	after( () => {
		recordEventStub.restore();
	} );

	it( 'shows partner logo', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const logo = screen.getByAltText(
			'Logo of Company name who are offering a coupon in partnership with Jetpack'
		);
		expect( logo );
		expect( logo.width ).equals( 150 );
		expect( logo.height ).equals( 100 );
	} );

	it( 'does not try to show partner logo if we do not have any', () => {
		const partnerCouponCopyWithoutLogo = partnerCoupon;
		delete partnerCouponCopyWithoutLogo.partner.logo;

		const props = {
			...requiredProps,
			partnerCoupon: partnerCouponCopyWithoutLogo,
		};

		const { container } = render( <RedeemPartnerCouponPostConnection { ...props } /> );

		// We use querySelector because using typical screen.* selectors will give an
		// error if the component doesn't exist; and we specifically want to ensure
		// it doesn't exist while displaying the "Set up button".
		expect(
			container.querySelector(
				'img[alt="Logo of Company name who are offering a coupon in partnership with Jetpack"]'
			)
		).to.not.exist;
	} );

	it( 'shows description and product name', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		expect(
			screen.getAllByText(
				'Redeem your coupon and get started with Awesome Product for free the first year! Never worry about losing your data, ever.'
			)
		).to.exist;
	} );

	it( 'shows product features', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		// eslint-disable-next-line no-unused-vars
		for ( const [ key, feature ] of Object.entries( partnerCoupon.product.features ) ) {
			expect( screen.getAllByText( feature ) ).to.exist;
		}
	} );

	it( 'redeem button redirects with all expected parameters', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const redeemButton = screen.getByRole( 'button', {
			name: 'Redeem Awesome Product',
		} );
		expect( redeemButton ).to.exist;
		fireEvent.click( redeemButton );

		// Make sure we only redirect once, and it's with the same value as getRedirectUrl.
		expect( locationAssignSpy.calledOnce );
		expect(
			locationAssignSpy.withArgs(
				sinon.match.same(
					getRedirectUrl( 'jetpack-plugin-partner-coupon-checkout', {
						path: 'awesome-product',
						site: 'example.com',
						query: 'coupon=TEST_TST_1234',
					} )
				)
			).calledOnce
		);

		// Make sure we call track before calling location.assign.
		expect( locationAssignSpy.calledAfter( recordEventStub ) );
	} );

	it( 'redeem button redirects after tracking event', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const redeemButton = screen.getByRole( 'button', {
			name: 'Redeem Awesome Product',
		} );
		expect( redeemButton ).to.exist;
		fireEvent.click( redeemButton );
		expect( locationAssignSpy.calledOnce );

		// Make sure we trigger tracking event before redirecting.
		expect( locationAssignSpy.calledAfter( recordEventStub ) );
	} );

	it( 'is triggering jetpack_partner_coupon_redeem_view tracking event', () => {
		expect( recordEventStub.callCount ).to.be.equal( 0 );

		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		expect(
			recordEventStub.withArgs( 'jetpack_partner_coupon_redeem_view', {
				coupon: 'TEST_TST_1234',
				partner: 'TEST',
				preset: 'TST',
				connected: 'yes',
			} ).callCount
		).to.be.equal( 1 );
	} );

	it( 'is triggering jetpack_partner_coupon_redeem_click tracking event', () => {
		expect( recordEventStub.callCount ).to.be.equal( 0 );

		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const redeemButton = screen.getByRole( 'button', {
			name: 'Redeem Awesome Product',
		} );
		expect( redeemButton ).to.exist;
		fireEvent.click( redeemButton );

		expect(
			recordEventStub.withArgs( 'jetpack_partner_coupon_redeem_click', {
				coupon: 'TEST_TST_1234',
				partner: 'TEST',
				preset: 'TST',
				connected: 'yes',
			} ).callCount
		).to.be.equal( 1 );
	} );
} );
