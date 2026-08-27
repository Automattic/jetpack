/**
 * Tests for PayPal Payment Buttons validation utilities.
 *
 * Covers client-side validation functions extracted from edit.js:
 * validatePrice, validateProductName, validateDescription,
 * getUserFriendlyError, and the VALID_CURRENCY_CODES constant.
 *
 * @package
 */

jest.mock( '@wordpress/i18n', () => ( {
	__: str => str,
	sprintf: ( format, ...args ) => {
		let i = 0;
		return format.replace( /%[ds]/g, () => String( args[ i++ ] ) );
	},
} ) );

import {
	validatePrice,
	validateProductName,
	validateDescription,
	getUserFriendlyError,
	VALID_CURRENCY_CODES,
	MAX_NAME_LENGTH,
	MAX_DESCRIPTION_LENGTH,
} from '../../src/paypal-payment-buttons/validation';

describe( 'validatePrice', () => {
	it( 'returns an error when value is null', () => {
		expect( validatePrice( null ) ).toBe( 'Price is required.' );
	} );

	it( 'returns an error when value is an empty string', () => {
		expect( validatePrice( '' ) ).toBe( 'Price is required.' );
	} );

	it( 'returns an error when value is "0"', () => {
		expect( validatePrice( '0' ) ).toBe( 'Price must be a positive number.' );
	} );

	it( 'returns an error when value is negative', () => {
		expect( validatePrice( '-5' ) ).toBe( 'Price must be a positive number.' );
	} );

	it( 'returns an error when value is non-numeric', () => {
		expect( validatePrice( 'abc' ) ).toBe( 'Price must be a positive number.' );
	} );

	it( 'returns an error when value has more than 2 decimal places', () => {
		expect( validatePrice( '1.999' ) ).toBe(
			'Price can have at most 2 decimal places (e.g., "29.99").'
		);
	} );

	it( 'returns null for a valid price with two decimals', () => {
		expect( validatePrice( '29.99' ) ).toBeNull();
	} );

	it( 'returns null for a valid whole-number price', () => {
		expect( validatePrice( '100' ) ).toBeNull();
	} );

	it( 'returns null for the minimum valid price', () => {
		expect( validatePrice( '0.01' ) ).toBeNull();
	} );
} );

describe( 'validateProductName', () => {
	it( 'returns an error when value is null', () => {
		expect( validateProductName( null ) ).toBe( 'Product name is required.' );
	} );

	it( 'returns an error when value is an empty string', () => {
		expect( validateProductName( '' ) ).toBe( 'Product name is required.' );
	} );

	it( 'returns an error when value is whitespace only', () => {
		expect( validateProductName( '   ' ) ).toBe( 'Product name is required.' );
	} );

	it( 'returns an error when value exceeds MAX_NAME_LENGTH', () => {
		const longName = 'a'.repeat( 128 );
		expect( validateProductName( longName ) ).toBe(
			`Product name must be ${ MAX_NAME_LENGTH } characters or fewer.`
		);
	} );

	it( 'returns null for a typical product name', () => {
		expect( validateProductName( 'Widget' ) ).toBeNull();
	} );

	it( 'returns null for a name at exactly MAX_NAME_LENGTH', () => {
		const maxName = 'a'.repeat( 127 );
		expect( validateProductName( maxName ) ).toBeNull();
	} );
} );

describe( 'validateDescription', () => {
	it( 'returns null when value is null (description is optional)', () => {
		expect( validateDescription( null ) ).toBeNull();
	} );

	it( 'returns null when value is an empty string', () => {
		expect( validateDescription( '' ) ).toBeNull();
	} );

	it( 'returns an error when value exceeds MAX_DESCRIPTION_LENGTH', () => {
		const longDesc = 'a'.repeat( 257 );
		expect( validateDescription( longDesc ) ).toBe(
			`Description must be ${ MAX_DESCRIPTION_LENGTH } characters or fewer.`
		);
	} );

	it( 'returns null for a description at exactly MAX_DESCRIPTION_LENGTH', () => {
		const maxDesc = 'a'.repeat( 256 );
		expect( validateDescription( maxDesc ) ).toBeNull();
	} );
} );

describe( 'getUserFriendlyError', () => {
	it( 'returns err.message when present', () => {
		const err = { message: 'Product name is too long.' };
		expect( getUserFriendlyError( err ) ).toBe( 'Product name is too long.' );
	} );

	it( 'returns a network error message for fetch_error code', () => {
		const err = { code: 'fetch_error' };
		expect( getUserFriendlyError( err ) ).toBe(
			'Could not reach the server. Please check your internet connection and try again.'
		);
	} );

	it( 'returns a generic fallback for unknown errors', () => {
		const err = {};
		expect( getUserFriendlyError( err ) ).toBe( 'An unexpected error occurred. Please try again.' );
	} );
} );

describe( 'VALID_CURRENCY_CODES', () => {
	it.each( [ 'USD', 'EUR', 'GBP', 'JPY' ] )( 'contains %s', code => {
		expect( VALID_CURRENCY_CODES.has( code ) ).toBe( true );
	} );

	it( 'does not contain an invalid currency code', () => {
		expect( VALID_CURRENCY_CODES.has( 'XYZ' ) ).toBe( false );
	} );
} );
