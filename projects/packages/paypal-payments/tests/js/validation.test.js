/**
 * Tests for PayPal Payment Buttons validation utilities.
 *
 * Tests for the client-side form validators.
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
	validateMoney,
	validatePercentage,
	validateDiscountPercentage,
	validateDiscountAmount,
	validateReturnUrl,
	sanitizePayPalUrl,
	getUserFriendlyError,
	MAX_NAME_LENGTH,
	MAX_DESCRIPTION_LENGTH,
	REQUIRED_FIELD_ERROR,
} from '../../src/paypal-payment-buttons/utils/validation';
import parity from '../fixtures/url-parity.json';

// The only test that spells out the wording. The rest read the const.
describe( 'REQUIRED_FIELD_ERROR', () => {
	it( 'is the message shown under an empty required field', () => {
		expect( REQUIRED_FIELD_ERROR ).toBe(
			'To continue, add the requested info or turn off this feature.'
		);
	} );
} );

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
	it( 'accepts a description padded with blank lines', () => {
		expect( validateDescription( `\n\n${ 'D'.repeat( MAX_DESCRIPTION_LENGTH ) }\n\n` ) ).toBeNull();
	} );
} );

describe( 'validateMoney', () => {
	const twoPlaces = 'Price can have at most 2 decimal places (e.g., "29.99").';

	it.each( [ null, undefined, '', '   ' ] )( 'asks for the value when given %p', value => {
		expect( validateMoney( value ) ).toBe( REQUIRED_FIELD_ERROR );
	} );

	// PayPal stores a 0 fee. The toggle is how a merchant skips one.
	it( 'takes a zero amount', () => {
		expect( validateMoney( '0' ) ).toBeNull();
	} );

	it( 'takes an amount above zero', () => {
		expect( validateMoney( '8.25' ) ).toBeNull();
	} );

	it( 'takes the smallest amount above zero', () => {
		expect( validateMoney( '0.01' ) ).toBeNull();
	} );

	it( 'takes an amount above the percentage ceiling', () => {
		expect( validateMoney( '150' ) ).toBeNull();
	} );

	it( 'refuses a third decimal place', () => {
		expect( validateMoney( '8.255', 'USD' ) ).toBe( twoPlaces );
	} );

	// Measured on JPY: 422 INVALID_DECIMAL_PRECISION, on every flat field.
	it.each( [ 'JPY', 'HUF', 'TWD' ] )( 'refuses a decimal amount in %s', code => {
		expect( validateMoney( '1500.50', code ) ).toBe(
			`Prices in ${ code } are whole numbers (e.g., "1500").`
		);
	} );

	it( 'takes a whole amount in a zero-decimal currency', () => {
		expect( validateMoney( '1500', 'JPY' ) ).toBeNull();
	} );

	it( 'takes zero in a zero-decimal currency', () => {
		expect( validateMoney( '0', 'JPY' ) ).toBeNull();
	} );

	it( 'takes a padded amount', () => {
		expect( validateMoney( ' 1500 ', 'JPY' ) ).toBeNull();
	} );

	// The missing-value check runs first, so a negative reports as missing.
	it.each( [ '-5', 'abc', '-0', '-0.00' ] )( 'asks for the value when given %p', value => {
		expect( validateMoney( value, 'JPY' ) ).toBe( REQUIRED_FIELD_ERROR );
	} );
} );

describe( 'validatePercentage', () => {
	const ceiling = 'Rate must be less than 100%.';

	it.each( [ null, undefined, '', '   ', '-5', 'abc', '-0', '-0.00' ] )(
		'asks for the value when given %p',
		value => {
			expect( validatePercentage( value ) ).toBe( REQUIRED_FIELD_ERROR );
		}
	);

	it( 'takes a zero rate', () => {
		expect( validatePercentage( '0' ) ).toBeNull();
	} );

	it( 'takes two decimal places', () => {
		expect( validatePercentage( '7.55' ) ).toBeNull();
	} );

	it( 'refuses a third decimal place', () => {
		expect( validatePercentage( '7.555' ) ).toBe( 'Rate can have at most 2 decimal places.' );
	} );

	it( 'takes 99.99, just under the ceiling', () => {
		expect( validatePercentage( '99.99' ) ).toBeNull();
	} );

	it.each( [ '100', '150' ] )( 'refuses %p for reaching 100%', value => {
		expect( validatePercentage( value ) ).toBe( ceiling );
	} );
} );

describe( 'validateDiscountPercentage', () => {
	const whole = 'Discount percentage must be a whole number.';
	const range = 'Discount must be between 1% and 99%.';

	// Measured: "you cannot discount by 0%". Zero points back at the toggle.
	it.each( [ null, undefined, '', '   ', 'abc', '-5', '0' ] )( 'asks for a value for %p', value => {
		expect( validateDiscountPercentage( value ) ).toBe( REQUIRED_FIELD_ERROR );
	} );

	// PayPal rejects "1.0" too, so the check reads the string. The padded value
	// covers the trim.
	it.each( [ '0.5', '1.0', '15.5', '99.99', ' 15.5 ' ] )( 'rejects %p for its decimals', value => {
		expect( validateDiscountPercentage( value ) ).toBe( whole );
	} );

	it.each( [ '100', '101', '150' ] )( 'rejects %p as over the ceiling', value => {
		expect( validateDiscountPercentage( value ) ).toBe( range );
	} );

	it.each( [ '1', '15', '99', ' 15 ' ] )( 'accepts %p', value => {
		expect( validateDiscountPercentage( value ) ).toBeNull();
	} );
} );

describe( 'validateDiscountAmount', () => {
	const tooBig = 'Discount must be less than the product price.';

	// Measured: PayPal rejects a zero discount, where a zero tax rate stores.
	it.each( [ null, undefined, '', '   ', 'abc', '-1', '0', '0.00' ] )(
		'asks for a value for %p',
		value => {
			expect( validateDiscountAmount( value, '10.00' ) ).toBe( REQUIRED_FIELD_ERROR );
		}
	);

	// PayPal returns 422 DISCOUNT_EXCEEDS_ITEM_PRICE when the two are equal.
	it( 'rejects a discount that equals the price', () => {
		expect( validateDiscountAmount( '10.00', '10.00' ) ).toBe( tooBig );
	} );

	it( 'rejects a discount above the price', () => {
		expect( validateDiscountAmount( '15.00', '10.00' ) ).toBe( tooBig );
	} );

	it( 'accepts a discount under the price', () => {
		expect( validateDiscountAmount( '2.00', '10.00' ) ).toBeNull();
	} );

	// The smallest discount PayPal takes, measured.
	it( 'accepts one cent', () => {
		expect( validateDiscountAmount( '0.01', '10.00' ) ).toBeNull();
	} );

	// With no price to compare against, only the format is checked.
	it.each( [ '', null, undefined ] )( 'skips the comparison when the price is %p', price => {
		expect( validateDiscountAmount( '999.00', price ) ).toBeNull();
	} );

	it( 'rejects a decimal in a zero-decimal currency', () => {
		expect( validateDiscountAmount( '1.50', '1000', 'JPY' ) ).toBe(
			'Prices in JPY are whole numbers (e.g., "1500").'
		);
	} );

	it( 'rejects a third decimal place', () => {
		expect( validateDiscountAmount( '2.001', '10.00', 'USD' ) ).toBe(
			'Price can have at most 2 decimal places (e.g., "29.99").'
		);
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

	// PayPal's limit; an editor URL with its query string can run past it.
	it( 'accepts a URL of exactly 127 characters, and rejects one more', () => {
		const atLimit = 'https://example.com/'.padEnd( 127, 'a' );
		expect( atLimit ).toHaveLength( 127 );
		expect( validateReturnUrl( atLimit ) ).toBeNull();
		expect( validateReturnUrl( `${ atLimit }a` ) ).toBe(
			'Return URL must be 127 characters or fewer.'
		);
	} );

	it( 'reports the scheme before the length', () => {
		expect( validateReturnUrl( 'http://example.com/'.padEnd( 200, 'a' ) ) ).toBe( httpsOnly );
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

// The other half of this table runs in tests/php against sanitize_paypal_script_url().
// The two are meant to be mirrors, so a rebuild that lands on one side only fails
// there as well as here. The host list they share is pinned there too, by
// test_paypal_host_allow_lists_are_in_sync().
describe( 'sanitizePayPalUrl', () => {
	it.each( parity.accepted.map( c => [ c.name, c ] ) )( 'accepts %s', ( _name, testCase ) => {
		expect( sanitizePayPalUrl( testCase.url ) ).toBe( testCase.sanitized );
	} );

	it.each( parity.rejected.map( c => [ c.name, c ] ) )( 'refuses %s', ( _name, testCase ) => {
		expect( sanitizePayPalUrl( testCase.url ) ).toBe( '' );
	} );

	// Where the two sides part company. Each case pins this side's answer as well as
	// the PHP's, so closing a gap fails just as loudly as opening one.
	it.each( [ ...parity.strictEditor, ...parity.parserSplit ].map( c => [ c.name, c ] ) )(
		'differs from the published page on %s',
		( _name, testCase ) => {
			expect( sanitizePayPalUrl( testCase.url ) ).toBe( testCase.js );
		}
	);

	// JSON cannot carry `undefined`, so the no-argument call stays out of the fixture.
	it( 'refuses a missing argument', () => {
		expect( sanitizePayPalUrl() ).toBe( '' );
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
