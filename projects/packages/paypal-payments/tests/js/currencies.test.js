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
	formatPrice,
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

describe( 'formatPrice', () => {
	it( 'puts the symbol before the price', () => {
		expect( formatPrice( '29.99', 'USD' ) ).toBe( '$29.99' );
	} );

	it( 'formats a price of 0', () => {
		expect( formatPrice( '0', 'USD' ) ).toBe( '$0' );
		expect( formatPrice( 0, 'USD' ) ).toBe( '$0' );
	} );

	it( 'puts the currency code before the price for an unknown currency', () => {
		expect( formatPrice( '5', 'XYZ' ) ).toBe( 'XYZ5' );
	} );

	it.each( [ '', '  ', undefined, null ] )(
		'returns an empty string for a blank price (%p)',
		price => {
			expect( formatPrice( price, 'USD' ) ).toBe( '' );
		}
	);
} );
