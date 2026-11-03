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

	// The code comes from the connection REST call, so it is '' until that resolves,
	// and after it fails.
	it( 'returns the link when the code is missing', () => {
		expect( withPartnerAttribution( 'https://www.paypal.com/ncp/payment/ABC123', '' ) ).toBe(
			'https://www.paypal.com/ncp/payment/ABC123'
		);
	} );

	it( 'returns an empty string for an empty or missing link', () => {
		expect( withPartnerAttribution( '', BN_CODE ) ).toBe( '' );
		expect( withPartnerAttribution( undefined, BN_CODE ) ).toBe( '' );
	} );

	// Post content supplies these, so the editor only hands the merchant a link on a
	// PayPal host to copy, share or scan.
	it.each( [
		[ 'an unparseable link', 'not a url' ],
		[ 'a link on another host', 'https://evil.test/ncp/payment/ABC123' ],
		[ 'a javascript: URL wearing a PayPal host', 'javascript://www.paypal.com/%0aalert(1)' ],
		// The host is matched in full, so a PayPal prefix misses the list.
		[ 'a lookalike host', 'https://www.paypal.com.evil.test/ncp/payment/ABC123' ],
		[ 'a host hidden behind userinfo', 'https://www.paypal.com@evil.test/ncp/payment/ABC123' ],
	] )( 'returns an empty string for %s', ( _label, url ) => {
		expect( withPartnerAttribution( url, BN_CODE ) ).toBe( '' );
		expect( withPartnerAttribution( url, '' ) ).toBe( '' );
	} );
} );
