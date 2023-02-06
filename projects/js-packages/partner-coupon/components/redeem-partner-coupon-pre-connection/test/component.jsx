import analytics from '@automattic/jetpack-analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import * as React from 'react';
import RedeemPartnerCouponPreConnection from '../';

const partnerCoupon = {
	coupon_code: 'TEST_TST_1234',
	preset: 'TST',
	partner: {
		name: 'Company name',
		prefix: 'TEST',
	},
	product: {
		title: 'Awesome Product',
		slug: 'awesome-product',
		features: [ 'Feature 1', 'Feature 2', 'Feature 3' ],
	},
};
const requiredProps = {
	apiNonce: 'NONCE',
	apiRoot: 'ROOT',
	connectionStatus: { isRegistered: true },
	partnerCoupon: partnerCoupon,
	assetBaseUrl: 'PATH',
	registrationNonce: 'NONCE',
	siteRawUrl: 'example.com',
	tracksUserData: true,
	analytics: analytics,
};

let locationAssignSpy;
let recordEventStub;
let stubGetConnectionStatus;

describe( 'RedeemPartnerCouponPreConnection', () => {
	const setupSpies = () => {
		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );

		locationAssignSpy = jest.spyOn( window.location, 'assign' ).mockReset();
		recordEventStub = jest.spyOn( analytics.tracks, 'recordEvent' ).mockReset();
		stubGetConnectionStatus = jest
			.spyOn( storeSelect, 'getConnectionStatus' )
			.mockReset()
			.mockReturnValue( {} );
	};

	it( 'shows partner', () => {
		setupSpies();
		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		expect( screen.getByText( 'Welcome to Jetpack Company name traveler!' ) ).toBeInTheDocument();
	} );

	it( 'redeem description includes the product name', () => {
		setupSpies();
		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		expect(
			screen.getByText(
				'Redeem your coupon and get started with Awesome Product for free the first year!'
			)
		).toBeInTheDocument();
	} );

	it( 'shows product features', () => {
		setupSpies();
		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		// eslint-disable-next-line no-unused-vars
		for ( const [ key, feature ] of Object.entries( partnerCoupon.product.features ) ) {
			expect( screen.getByText( feature ) ).toBeInTheDocument();
		}
	} );

	it( 'shows the set up and redeem button for unconnected sites', () => {
		setupSpies();
		stubGetConnectionStatus.mockReturnValue( { isRegistered: false, isUserConnected: false } );

		const props = {
			...requiredProps,
			connectionStatus: {
				hasConnectedOwner: false,
			},
		};

		render( <RedeemPartnerCouponPreConnection { ...props } /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Set up & redeem Awesome Product',
			} )
		).toBeInTheDocument();

		expect(
			screen.queryByRole( 'button', { name: 'Redeem Awesome Product' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the set up and redeem button for registered sites', () => {
		setupSpies();
		stubGetConnectionStatus.mockReturnValue( { isRegistered: true, isUserConnected: false } );

		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Set up & redeem Awesome Product',
			} )
		).toBeInTheDocument();

		expect(
			screen.queryByRole( 'button', { name: 'Redeem Awesome Product' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows redeem button for user connected sites', () => {
		setupSpies();
		stubGetConnectionStatus.mockReturnValue( { isRegistered: true, isUserConnected: true } );

		const props = {
			...requiredProps,
			connectionStatus: {
				hasConnectedOwner: true,
			},
		};

		render( <RedeemPartnerCouponPreConnection { ...props } /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Redeem Awesome Product',
			} )
		).toBeInTheDocument();

		expect(
			screen.queryByRole( 'button', { name: 'Set up & redeem Awesome Product' } )
		).not.toBeInTheDocument();
	} );

	it( 'redeem button redirects with all expected parameters', async () => {
		setupSpies();
		const user = userEvent.setup();
		const props = {
			...requiredProps,
			connectionStatus: {
				isRegistered: true,
				hasConnectedOwner: true,
			},
		};

		render( <RedeemPartnerCouponPreConnection { ...props } /> );

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
	} );

	it( 'redeem button redirects after tracking event', async () => {
		setupSpies();
		const user = userEvent.setup();
		const props = {
			...requiredProps,
			connectionStatus: {
				isRegistered: true,
				hasConnectedOwner: true,
			},
		};

		render( <RedeemPartnerCouponPreConnection { ...props } /> );

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
		setupSpies();
		expect( recordEventStub ).not.toHaveBeenCalled();

		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		expect( recordEventStub ).toHaveBeenCalledTimes( 1 );
		expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_partner_coupon_redeem_view', {
			coupon: 'TEST_TST_1234',
			partner: 'TEST',
			preset: 'TST',
			connected: 'yes',
		} );
	} );

	it( 'is triggering jetpack_partner_coupon_redeem_click tracking event', async () => {
		setupSpies();
		const user = userEvent.setup();
		expect( recordEventStub ).not.toHaveBeenCalled();

		const props = {
			...requiredProps,
			connectionStatus: {
				isRegistered: true,
				hasConnectedOwner: true,
			},
		};

		render( <RedeemPartnerCouponPreConnection { ...props } /> );

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
