/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PartnerCouponRedeem from '../';

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
		features: [],
	},
};
const requiredProps = {
	apiNonce: 'NONCE',
	apiRoot: 'ROOT',
	connectionStatus: { hasConnectedOwner: false },
	partnerCoupon: partnerCoupon,
	assetBaseUrl: 'PATH',
	registrationNonce: 'NONCE',
	siteRawUrl: 'example.com',
	tracksUserData: false,
	analytics: {},
};

describe( 'PartnerCouponRedeem', () => {
	it( 'uses pre connection component for registered sites', () => {
		const { container } = render( <PartnerCouponRedeem { ...requiredProps } /> );
		expect( container.querySelector( '.jetpack-redeem-partner-coupon-pre-connection' ) );
		expect( container.querySelector( '.jetpack-redeem-partner-coupon-post-connection' ) ).to.be
			.null;
	} );

	it( 'uses post connection component for user connected site', () => {
		const props = {
			...requiredProps,
			connectionStatus: { hasConnectedOwner: true },
		};

		const { container } = render( <PartnerCouponRedeem { ...props } /> );
		expect( container.querySelector( '.jetpack-redeem-partner-coupon-pre-connection' ) ).to.be.null;
		expect( container.querySelector( '.jetpack-redeem-partner-coupon-post-connection' ) );
	} );
} );
