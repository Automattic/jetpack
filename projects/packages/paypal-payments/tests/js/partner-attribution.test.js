/**
 * Tests for the PayPal partner attribution helper.
 *
 * @package
 */

import { withPartnerAttribution } from '../../src/paypal-payment-buttons/utils/partner-attribution';

const BN_CODE = 'WooNCPS_Ecom_Wordpress';

describe( 'withPartnerAttribution', () => {
	it( 'appends the attribution code to a bare payment link', () => {
		expect( withPartnerAttribution( 'https://www.paypal.com/ncp/payment/ABC123', BN_CODE ) ).toBe(
			`https://www.paypal.com/ncp/payment/ABC123?at_code=${ BN_CODE }`
		);
	} );

	it( 'preserves existing query parameters', () => {
		const result = withPartnerAttribution(
			'https://www.paypal.com/ncp/payment/ABC123?foo=bar',
			BN_CODE
		);

		expect( result ).toContain( 'foo=bar' );
		expect( result ).toContain( `at_code=${ BN_CODE }` );
	} );

	it( 'replaces an existing attribution code rather than duplicating it', () => {
		const result = withPartnerAttribution(
			'https://www.paypal.com/ncp/payment/ABC123?at_code=Stale',
			BN_CODE
		);

		expect( result ).toBe( `https://www.paypal.com/ncp/payment/ABC123?at_code=${ BN_CODE }` );
		expect( result ).not.toContain( 'Stale' );
	} );

	it( 'returns the input unchanged when the code is missing', () => {
		expect( withPartnerAttribution( 'https://www.paypal.com/ncp/payment/ABC123', '' ) ).toBe(
			'https://www.paypal.com/ncp/payment/ABC123'
		);
	} );

	it( 'returns the input unchanged when there is no link', () => {
		expect( withPartnerAttribution( '', BN_CODE ) ).toBe( '' );
		expect( withPartnerAttribution( undefined, BN_CODE ) ).toBeUndefined();
	} );

	it( 'returns the input unchanged when it is not a parseable URL', () => {
		expect( withPartnerAttribution( 'not a url', BN_CODE ) ).toBe( 'not a url' );
	} );
} );
