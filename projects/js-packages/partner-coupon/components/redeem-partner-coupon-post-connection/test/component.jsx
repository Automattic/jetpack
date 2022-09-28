import analytics from '@automattic/jetpack-analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import RedeemPartnerCouponPostConnection from '../';

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
	beforeEach( () => {
		locationAssignSpy = jest.spyOn( window.location, 'assign' ).mockReset();
		recordEventStub = jest.spyOn( analytics.tracks, 'recordEvent' ).mockReset();
	} );

	it( 'shows partner logo', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const logo = screen.getByAltText(
			'Logo of Company name who are offering a coupon in partnership with Jetpack'
		);
		expect( logo ).toBeInTheDocument();
		expect( logo.width ).toBe( 150 );
		expect( logo.height ).toBe( 100 );
	} );

	it( 'does not try to show partner logo if we do not have any', () => {
		const partnerCouponCopyWithoutLogo = partnerCoupon;
		delete partnerCouponCopyWithoutLogo.partner.logo;

		const props = {
			...requiredProps,
			partnerCoupon: partnerCouponCopyWithoutLogo,
		};

		render( <RedeemPartnerCouponPostConnection { ...props } /> );

		expect(
			screen.queryByAltText(
				'Logo of Company name who are offering a coupon in partnership with Jetpack'
			)
		).not.toBeInTheDocument();
	} );

	it( 'shows description and product name', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		expect(
			screen.getByText(
				'Redeem your coupon and get started with Awesome Product for free the first year! Never worry about losing your data, ever.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows product features', () => {
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		// eslint-disable-next-line no-unused-vars
		for ( const [ key, feature ] of Object.entries( partnerCoupon.product.features ) ) {
			expect( screen.getByText( feature ) ).toBeInTheDocument();
		}
	} );

	it( 'redeem button redirects with all expected parameters', async () => {
		const user = userEvent.setup();
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const redeemButton = screen.getByRole( 'button', {
			name: 'Redeem Awesome Product',
		} );
		expect( redeemButton ).toBeInTheDocument();
		await user.click( redeemButton );

		// Make sure we only redirect once, and it's with the same value as getRedirectUrl.
		expect( locationAssignSpy ).toHaveBeenCalledTimes( 1 );
		expect( locationAssignSpy ).toHaveBeenCalledWith(
			getRedirectUrl( 'jetpack-plugin-partner-coupon-checkout', {
				path: 'awesome-product',
				site: 'example.com',
				query: 'coupon=TEST_TST_1234',
			} )
		);

		// Make sure we call track before calling location.assign.
		expect( locationAssignSpy ).toHaveBeenCalledAfter( recordEventStub );
	} );

	it( 'redeem button redirects after tracking event', async () => {
		const user = userEvent.setup();
		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const redeemButton = screen.getByRole( 'button', {
			name: 'Redeem Awesome Product',
		} );
		expect( redeemButton ).toBeInTheDocument();
		await user.click( redeemButton );
		expect( locationAssignSpy ).toHaveBeenCalledTimes( 1 );

		// Make sure we trigger tracking event before redirecting.
		expect( locationAssignSpy ).toHaveBeenCalledAfter( recordEventStub );
	} );

	it( 'is triggering jetpack_partner_coupon_redeem_view tracking event', () => {
		expect( recordEventStub ).not.toHaveBeenCalled();

		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		expect( recordEventStub ).toHaveBeenCalledTimes( 1 );
		expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_partner_coupon_redeem_view', {
			coupon: 'TEST_TST_1234',
			partner: 'TEST',
			preset: 'TST',
			connected: 'yes',
		} );
	} );

	it( 'is triggering jetpack_partner_coupon_redeem_click tracking event', async () => {
		const user = userEvent.setup();
		expect( recordEventStub ).not.toHaveBeenCalled();

		render( <RedeemPartnerCouponPostConnection { ...requiredProps } /> );

		const redeemButton = screen.getByRole( 'button', {
			name: 'Redeem Awesome Product',
		} );
		expect( redeemButton ).toBeInTheDocument();
		await user.click( redeemButton );

		expect( recordEventStub ).toHaveBeenCalledTimes( 2 );
		expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_partner_coupon_redeem_click', {
			coupon: 'TEST_TST_1234',
			partner: 'TEST',
			preset: 'TST',
			connected: 'yes',
		} );
	} );
} );
