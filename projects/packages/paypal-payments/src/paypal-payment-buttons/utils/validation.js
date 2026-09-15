/**
 * PayPal Payment Buttons — Validation Utilities.
 *
 * Extracted from edit.js for testability. These functions validate
 * form inputs client-side before API submission and map API errors
 * to user-friendly messages.
 *
 * @package
 * @since 0.8.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { VALID_CURRENCY_CODES } from './currencies';
import { ZERO_DECIMAL_CURRENCIES } from './currency-symbols';

/**
 * Validation constants - PayPal's own limits, mirrored in `PayPal_Attribute_Mapper`.
 * Change both together. A character over either is a 400 `INVALID_STRING_LENGTH`.
 */
export const MAX_NAME_LENGTH = 127;
export const MAX_DESCRIPTION_LENGTH = 2048;
// PayPal rejects a third custom checkout field with a 400.
export const MAX_CUSTOMER_NOTES = 2;

/**
 * Check the decimals a price carries against what PayPal accepts for the currency.
 *
 * PayPal rejects any decimal for JPY, HUF and TWD; every other currency takes up to two.
 *
 * @param {string} value        - The price value.
 * @param {string} currencyCode - The ISO currency code the price is in.
 * @return {string|null} Error message or null if valid.
 */
export function getPriceFormatError( value, currencyCode = 'USD' ) {
	const trimmed = `${ value ?? '' }`.trim();

	if ( ZERO_DECIMAL_CURRENCIES.has( currencyCode ) ) {
		return /^\d+$/.test( trimmed )
			? null
			: sprintf(
					/* translators: %s: currency code, e.g. JPY */
					__( 'Prices in %s are whole numbers (e.g., "1500").', 'jetpack-paypal-payments' ),
					currencyCode
			  );
	}

	return /^\d+(\.\d{1,2})?$/.test( trimmed )
		? null
		: __( 'Price can have at most 2 decimal places (e.g., "29.99").', 'jetpack-paypal-payments' );
}

/**
 * Validate a price string.
 *
 * @param {string} value        - The price value.
 * @param {string} currencyCode - The ISO currency code the price is in.
 * @return {string|null} Error message or null if valid.
 */
export function validatePrice( value, currencyCode = 'USD' ) {
	if ( ! value || value.trim() === '' ) {
		return __( 'Price is required.', 'jetpack-paypal-payments' );
	}

	const num = parseFloat( value );
	if ( isNaN( num ) || num <= 0 ) {
		return __( 'Price must be a positive number.', 'jetpack-paypal-payments' );
	}

	return getPriceFormatError( value, currencyCode );
}

/**
 * Validate a product name.
 *
 * @param {string} value - The product name.
 * @return {string|null} Error message or null if valid.
 */
export function validateProductName( value ) {
	if ( ! value || value.trim() === '' ) {
		return __( 'Product name is required.', 'jetpack-paypal-payments' );
	}

	if ( value.length > MAX_NAME_LENGTH ) {
		return sprintf(
			/* translators: %d: maximum number of characters allowed for the product name */
			__( 'Product name must be %d characters or fewer.', 'jetpack-paypal-payments' ),
			MAX_NAME_LENGTH
		);
	}

	return null;
}

/**
 * Validate a description (optional field).
 *
 * @param {string} value - The description.
 * @return {string|null} Error message or null if valid.
 */
export function validateDescription( value ) {
	if ( value && value.length > MAX_DESCRIPTION_LENGTH ) {
		return sprintf(
			/* translators: %d: maximum number of characters allowed for the description */
			__( 'Description must be %d characters or fewer.', 'jetpack-paypal-payments' ),
			MAX_DESCRIPTION_LENGTH
		);
	}

	return null;
}

/**
 * Validate a percentage tax rate.
 *
 * Required and above zero. The upper bound is the control's own max attribute -
 * PayPal's real limit has never been measured.
 *
 * @param {string} value - The tax rate.
 * @return {string|null} Error message or null if valid.
 */
export function validateTaxRate( value ) {
	const num = parseFloat( value );

	if ( isNaN( num ) || num <= 0 ) {
		return __(
			'To continue, add the requested info or turn off this feature.',
			'jetpack-paypal-payments'
		);
	}

	return null;
}

/**
 * Validate a return URL (optional field).
 *
 * HTTPS only - a rule this block has always enforced on its own. Empty means the
 * buyer is not redirected anywhere.
 *
 * @param {string} value - The return URL.
 * @return {string|null} Error message or null if valid.
 */
export function validateReturnUrl( value ) {
	if ( ! value || /^https:\/\/.+/.test( value ) ) {
		return null;
	}

	return __(
		'Return URL must use HTTPS (e.g., https://example.com/thank-you).',
		'jetpack-paypal-payments'
	);
}

/**
 * Validate a currency code.
 *
 * The picker only offers codes PayPal takes, so a bad one arrived from a paste or
 * an older block rather than from the merchant.
 *
 * @param {string} value - The ISO currency code.
 * @return {string|null} Error message or null if valid.
 */
export function validateCurrency( value ) {
	if ( ! value || VALID_CURRENCY_CODES.has( value ) ) {
		return null;
	}

	return __( 'Unsupported currency.', 'jetpack-paypal-payments' );
}

/**
 * Error keys that warn the merchant without blocking the save.
 *
 * A bad return URL has always saved - PayPal takes the button either way, and the
 * merchant is told what is wrong. Everything else getValidationErrors() reports
 * blocks the save.
 */
export const ADVISORY_ERROR_KEYS = [ 'returnUrl' ];

/**
 * Validate every form field at once.
 *
 * Two things consume each key: hasBlockingError() below, which disables the save
 * button, and a control's `help`, which tells the merchant what is wrong. A key
 * that reaches only the first leaves a dead button and nothing on screen saying
 * why. Adding a key here means adding the `help` that renders it.
 *
 * Return every key on every call, `null` where it does not apply - building the
 * object conditionally would shrink the key set the tests enumerate, and the
 * fence would go quiet with nothing failing.
 *
 * @param {object}  fields                    - The form's current values.
 * @param {string}  fields.productName        - Product name.
 * @param {string}  fields.price              - Product price.
 * @param {string}  fields.productDescription - Product description.
 * @param {string}  fields.returnUrl          - Post-payment redirect.
 * @param {string}  fields.currencyCode       - ISO currency code.
 * @param {boolean} fields.variantPricingOn   - Whether options carry their own prices.
 * @param {boolean} fields.taxEnabled         - Whether tax collection is on.
 * @param {boolean} fields.taxIsPercentage    - Whether the tax type carries a rate.
 * @param {string}  fields.taxValue           - Tax rate.
 * @return {object} An error message or null, keyed by field.
 */
export function getValidationErrors( {
	productName,
	price,
	productDescription,
	returnUrl,
	currencyCode,
	variantPricingOn,
	taxEnabled,
	taxIsPercentage,
	taxValue,
} ) {
	return {
		productName: validateProductName( productName ),
		// The price field is hidden once per-variant pricing is on, so don't validate
		// it - an error on an invisible field would disable Save with nothing to fix.
		price: variantPricingOn ? null : validatePrice( price, currencyCode || 'USD' ),
		productDescription: validateDescription( productDescription ),
		returnUrl: validateReturnUrl( returnUrl ),
		taxValue: taxEnabled && taxIsPercentage ? validateTaxRate( taxValue ) : null,
		currencyCode: validateCurrency( currencyCode ),
	};
}

/**
 * Whether any error is one that blocks the save.
 *
 * Derived rather than a hand-written list of fields, so a new key cannot be
 * forgotten on the gate side.
 *
 * @param {object} errors - Errors from getValidationErrors().
 * @return {boolean} True when a blocking field is in error.
 */
export function hasBlockingError( errors ) {
	return Object.entries( errors ).some(
		( [ field, message ] ) => message && ! ADVISORY_ERROR_KEYS.includes( field )
	);
}

/**
 * Map an API error response to a user-friendly message.
 *
 * The server-side already returns user-friendly messages, but this
 * provides client-side fallbacks for network errors and edge cases.
 *
 * @param {object} err - The error object from apiFetch.
 * @return {string} User-friendly error message.
 */
export function getUserFriendlyError( err ) {
	// Server already provides friendly messages — use them.
	if ( err.message ) {
		return err.message;
	}

	// Network-level errors (no response from server).
	if ( err.code === 'fetch_error' ) {
		return __(
			'Could not reach the server. Please check your internet connection and try again.',
			'jetpack-paypal-payments'
		);
	}

	return __( 'An unexpected error occurred. Please try again.', 'jetpack-paypal-payments' );
}
