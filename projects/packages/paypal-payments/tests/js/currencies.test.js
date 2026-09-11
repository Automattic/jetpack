/**
 * Tests for the PayPal Payment Buttons currency lists.
 *
 * Covers the selector options and the code set the form validates against.
 *
 * @package
 */

import {
	SUPPORTED_CURRENCIES,
	VALID_CURRENCY_CODES,
} from '../../src/paypal-payment-buttons/utils/currencies';
import {
	CURRENCY_SYMBOLS,
	getPricePlaceholder,
} from '../../src/paypal-payment-buttons/utils/currency-symbols';

describe( 'VALID_CURRENCY_CODES', () => {
	it.each( [ 'USD', 'EUR', 'GBP', 'JPY' ] )( 'contains %s', code => {
		expect( VALID_CURRENCY_CODES.has( code ) ).toBe( true );
	} );

	it( 'does not contain an invalid currency code', () => {
		expect( VALID_CURRENCY_CODES.has( 'XYZ' ) ).toBe( false );
	} );
} );

describe( 'SUPPORTED_CURRENCIES', () => {
	it( 'labels every currency with its symbol', () => {
		expect( SUPPORTED_CURRENCIES.find( c => c.value === 'USD' ).label ).toBe( 'USD $' );
	} );

	it( 'does not repeat the code when the symbol is the code', () => {
		expect( SUPPORTED_CURRENCIES.find( c => c.value === 'CHF' ).label ).toBe( 'CHF' );
	} );

	it( 'has a symbol for every supported code', () => {
		const missing = SUPPORTED_CURRENCIES.map( c => c.value ).filter( v => ! CURRENCY_SYMBOLS[ v ] );
		expect( missing ).toEqual( [] );
	} );

	// PayPal_Attribute_Mapper_Test asserts the same count on the PHP list.
	it( 'carries all 24 currencies PayPal supports', () => {
		expect( SUPPORTED_CURRENCIES ).toHaveLength( 24 );
	} );
} );

describe( 'getPricePlaceholder', () => {
	it( 'shows a decimal amount for a currency PayPal prices in cents', () => {
		expect( getPricePlaceholder( 'USD' ) ).toBe( '29.99' );
	} );

	it( 'shows a whole amount for a currency PayPal prices whole', () => {
		expect( getPricePlaceholder( 'JPY' ) ).toBe( '1500' );
	} );
} );
