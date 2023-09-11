import { render, screen } from '@testing-library/react';
import * as React from 'react';
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
		render( <PartnerCouponRedeem { ...requiredProps } /> );
		expect(
			screen.getByRole( 'button', { name: 'Set up & redeem Awesome Product' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Redeem Awesome Product' } )
		).not.toBeInTheDocument();
	} );

	it( 'uses post connection component for user connected site', () => {
		const props = {
			...requiredProps,
			connectionStatus: { hasConnectedOwner: true },
		};

		render( <PartnerCouponRedeem { ...props } /> );
		expect(
			screen.queryByRole( 'button', { name: 'Set up & redeem Awesome Product' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Redeem Awesome Product' } ) ).toBeInTheDocument();
	} );
} );
