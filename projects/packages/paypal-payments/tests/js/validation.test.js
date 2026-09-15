/**
 * Tests for PayPal Payment Buttons validation utilities.
 *
 * Covers client-side validation functions extracted from edit.js:
 * validatePrice, validateProductName, validateDescription,
 * validateTaxRate, validateReturnUrl, getUserFriendlyError.
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
	validateTaxRate,
	validateReturnUrl,
	getUserFriendlyError,
	MAX_NAME_LENGTH,
	MAX_DESCRIPTION_LENGTH,
} from '../../src/paypal-payment-buttons/utils/validation';

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

	it.each( [ 'JPY', 'HUF', 'TWD' ] )(
		'rejects a decimal price in %s, which PayPal prices whole',
		code => {
			expect( validatePrice( '1500.50', code ) ).toBe(
				`Prices in ${ code } are whole numbers (e.g., "1500").`
			);
		}
	);

	it.each( [ 'JPY', 'HUF', 'TWD' ] )( 'accepts a whole-number price in %s', code => {
		expect( validatePrice( '1500', code ) ).toBeNull();
	} );

	it( 'still accepts two decimals in a currency PayPal prices with them', () => {
		expect( validatePrice( '12.34', 'EUR' ) ).toBeNull();
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
		const longDesc = 'a'.repeat( 2049 );
		expect( validateDescription( longDesc ) ).toBe(
			`Description must be ${ MAX_DESCRIPTION_LENGTH } characters or fewer.`
		);
	} );

	it( 'returns null for a description at exactly MAX_DESCRIPTION_LENGTH', () => {
		const maxDesc = 'a'.repeat( 2048 );
		expect( validateDescription( maxDesc ) ).toBeNull();
	} );
} );

describe( 'validateTaxRate', () => {
	const required = 'To continue, add the requested info or turn off this feature.';

	it.each( [ null, undefined, '', '   ' ] )( 'returns an error for %p', value => {
		expect( validateTaxRate( value ) ).toBe( required );
	} );

	it( 'returns an error when the rate is zero', () => {
		expect( validateTaxRate( '0' ) ).toBe( required );
	} );

	it( 'returns an error when the rate is negative', () => {
		expect( validateTaxRate( '-5' ) ).toBe( required );
	} );

	it( 'returns an error when the rate is not a number', () => {
		expect( validateTaxRate( 'abc' ) ).toBe( required );
	} );

	it( 'returns null for a rate above zero', () => {
		expect( validateTaxRate( '8.25' ) ).toBeNull();
	} );

	it( 'returns null for the smallest rate the control allows', () => {
		expect( validateTaxRate( '0.01' ) ).toBeNull();
	} );

	// The control's max attribute is the only upper bound; PayPal's own is unmeasured.
	it( 'accepts a rate above the control’s maximum', () => {
		expect( validateTaxRate( '150' ) ).toBeNull();
	} );
} );

describe( 'validateReturnUrl', () => {
	const httpsOnly = 'Return URL must use HTTPS (e.g., https://example.com/thank-you).';

	// The field is optional, so no URL is a valid answer.
	it.each( [ null, undefined, '' ] )( 'returns null for %p', value => {
		expect( validateReturnUrl( value ) ).toBeNull();
	} );

	it( 'returns null for an HTTPS URL', () => {
		expect( validateReturnUrl( 'https://example.com/thanks' ) ).toBeNull();
	} );

	it.each( [
		[ 'plain HTTP', 'http://example.com/thanks' ],
		[ 'a scheme-relative URL', '//example.com/thanks' ],
		[ 'a bare host', 'example.com' ],
		[ 'the scheme on its own', 'https://' ],
	] )( 'returns an error for %s', ( _label, value ) => {
		expect( validateReturnUrl( value ) ).toBe( httpsOnly );
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
