/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { renderHook } from '@testing-library/react-hooks';
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import RedeemPartnerCouponPreConnection from '../';
import analytics from '@automattic/jetpack-analytics';
import { useSelect } from '@wordpress/data';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { getRedirectUrl } from '@automattic/jetpack-components';

const { location } = window;
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
let storeSelect;
let stubGetConnectionStatus;

describe( 'RedeemPartnerCouponPreConnection', () => {
	before( () => {
		renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ) ) );

		locationAssignSpy = sinon.spy();
		recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );
		stubGetConnectionStatus = sinon.stub( storeSelect, 'getConnectionStatus' );
	} );

	beforeEach( () => {
		// Spy on location.assign, so we don't get breaking errors when
		// we trigger click events on buttons/links.
		delete window.location;
		window.location = { assign: locationAssignSpy };

		stubGetConnectionStatus.returns( {} );
	} );

	afterEach( () => {
		window.location = location;
		locationAssignSpy.resetHistory();

		recordEventStub.reset();
		stubGetConnectionStatus.reset();
	} );

	after( () => {
		recordEventStub.restore();
		stubGetConnectionStatus.restore();
	} );

	it( 'shows partner', () => {
		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		expect( screen.getAllByText( 'Welcome to Jetpack Company name traveler!' ) ).to.exist;
	} );

	it( 'redeem description includes the product name', () => {
		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		expect(
			screen.getAllByText(
				'Redeem your coupon and get started with Awesome Product for free the first year!'
			)
		).to.exist;
	} );

	it( 'shows product features', () => {
		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		// eslint-disable-next-line no-unused-vars
		for ( const [ key, feature ] of Object.entries( partnerCoupon.product.features ) ) {
			expect( screen.getAllByText( feature ) ).to.exist;
		}
	} );

	it( 'shows the set up and redeem button for unconnected sites', () => {
		stubGetConnectionStatus.returns( { isRegistered: false, isUserConnected: false } );

		const props = {
			...requiredProps,
			connectionStatus: {
				hasConnectedOwner: false,
			},
		};

		const { container } = render( <RedeemPartnerCouponPreConnection { ...props } /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Set up & redeem Awesome Product',
			} )
		).to.exist;

		// We use querySelector because using typical screen.* selectors will give an
		// error if the component doesn't exist; and we specifically want to ensure
		// it doesn't exist while displaying the "Set up button".
		expect( container.querySelector( 'button[aria-label="Redeem Awesome Product"]' ) ).to.not.exist;
	} );

	it( 'shows the set up and redeem button for registered sites', () => {
		stubGetConnectionStatus.returns( { isRegistered: true, isUserConnected: false } );

		const { container } = render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Set up & redeem Awesome Product',
			} )
		).to.exist;

		// We use querySelector because using typical screen.* selectors will give an
		// error if the component doesn't exist; and we specifically want to ensure
		// it doesn't exist while displaying the "Set up button".
		expect( container.querySelector( 'button[aria-label="Redeem Awesome Product"]' ) ).to.not.exist;
	} );

	it( 'shows redeem button for user connected sites', () => {
		stubGetConnectionStatus.returns( { isRegistered: true, isUserConnected: true } );

		const props = {
			...requiredProps,
			connectionStatus: {
				hasConnectedOwner: true,
			},
		};

		const { container } = render( <RedeemPartnerCouponPreConnection { ...props } /> );

		expect(
			screen.getByRole( 'button', {
				name: 'Redeem Awesome Product',
			} )
		).to.exist;

		// We use querySelector because using typical screen.* selectors will give an
		// error if the component doesn't exist; and we specifically want to ensure
		// it doesn't exist while displaying the "Redeem button".
		expect( container.querySelector( 'button[aria-label="Set up & redeem Awesome Product"]' ) ).to
			.not.exist;
	} );

	it( 'redeem button redirects with all expected parameters', () => {
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
	} );

	it( 'redeem button redirects after tracking event', () => {
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
		expect( redeemButton ).to.exist;
		fireEvent.click( redeemButton );
		expect( locationAssignSpy.calledOnce );

		// Make sure we trigger tracking event before redirecting.
		expect( locationAssignSpy.calledAfter( recordEventStub ) );
	} );

	it( 'is triggering jetpack_partner_coupon_redeem_view tracking event', () => {
		expect( recordEventStub.callCount ).to.be.equal( 0 );

		render( <RedeemPartnerCouponPreConnection { ...requiredProps } /> );

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
