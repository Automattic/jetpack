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
// Caps the Product ID input. The server answers a longer one with product_id_too_long.
export const MAX_PRODUCT_ID_LENGTH = 50;
// PayPal rejects a third custom checkout field with a 400.
export const MAX_CUSTOMER_NOTES = 2;

// Shipping modes that ask the merchant for an amount. The form draws the fee field
// from this list and the validator checks it from the same one.
export const SHIPPING_MODES_WITH_FEE = [ 'FLAT', 'QUANTITY' ];

// Shown under a field a merchant turned on and left empty. validateCustomerNotes()
// reuses it.
export const REQUIRED_FIELD_ERROR = __(
	'To continue, add the requested info or turn off this feature.',
	'jetpack-paypal-payments'
);

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
	// The server trims before it measures, so trim here to match.
	if ( value && value.trim().length > MAX_DESCRIPTION_LENGTH ) {
		return sprintf(
			/* translators: %d: maximum number of characters allowed for the description */
			__( 'Description must be %d characters or fewer.', 'jetpack-paypal-payments' ),
			MAX_DESCRIPTION_LENGTH
		);
	}

	return null;
}

/**
 * Whether a value the merchant had to fill in is missing.
 *
 * The sign comes off the string as well: `parseFloat( '-0' )` is `-0`, and `-0 < 0`
 * is false.
 *
 * @param {string} value - The rate, amount or fee.
 * @return {boolean} True when there is nothing usable in the field.
 */
function isMissingAmount( value ) {
	const num = parseFloat( value );

	return isNaN( num ) || num < 0 || `${ value ?? '' }`.trim().startsWith( '-' );
}

/**
 * Validate an amount of money a toggle asked the merchant for.
 *
 * Zero or more, with the decimals the currency allows. PayPal stores a zero fee, and
 * the toggle is how a merchant skips one.
 *
 * @param {string} value        - The amount.
 * @param {string} currencyCode - The ISO currency code the amount is in.
 * @return {string|null} Error message or null if valid.
 */
export function validateMoney( value, currencyCode = 'USD' ) {
	if ( isMissingAmount( value ) ) {
		return REQUIRED_FIELD_ERROR;
	}

	return getPriceFormatError( value, currencyCode );
}

/**
 * Validate a percentage a toggle asked the merchant for.
 *
 * Under 100 with at most two decimals. PayPal returns a 422 either way, and the
 * decimal limit is the same in every currency, so the value alone is enough to check.
 *
 * @param {string} value - The rate.
 * @return {string|null} Error message or null if valid.
 */
export function validatePercentage( value ) {
	if ( isMissingAmount( value ) ) {
		return REQUIRED_FIELD_ERROR;
	}

	if ( parseFloat( value ) >= 100 ) {
		return __( 'Rate must be less than 100%.', 'jetpack-paypal-payments' );
	}

	if ( ! /^\d+(\.\d{1,2})?$/.test( `${ value ?? '' }`.trim() ) ) {
		return __( 'Rate can have at most 2 decimal places.', 'jetpack-paypal-payments' );
	}

	return null;
}

/**
 * Validate a tax against the rule its own type carries.
 *
 * PERCENTAGE alone is a rate. Every other type draws a currency suffix in the editor
 * and validates as money, matching `taxIsPercentage` there.
 *
 * @param {string} type         - Tax type: PERCENTAGE or FLAT.
 * @param {string} value        - The rate or amount.
 * @param {string} currencyCode - The ISO currency code a flat amount is in.
 * @return {string|null} Error message or null if valid.
 */
function validateTax( type, value, currencyCode ) {
	return 'PERCENTAGE' === ( type || 'PERCENTAGE' )
		? validatePercentage( value )
		: validateMoney( value, currencyCode );
}

/**
 * Validate a percentage discount.
 *
 * Whole numbers 1 to 99. The check is on the string: PayPal rejects "1.0", which
 * parseFloat reads as a valid 1.
 *
 * @param {string} value - The percentage off.
 * @return {string|null} Error message or null if valid.
 */
export function validateDiscountPercentage( value ) {
	const num = parseFloat( value );

	if ( isNaN( num ) || num <= 0 ) {
		return REQUIRED_FIELD_ERROR;
	}

	if ( ! /^\d+$/.test( `${ value ?? '' }`.trim() ) ) {
		return __( 'Discount percentage must be a whole number.', 'jetpack-paypal-payments' );
	}

	if ( num > 99 ) {
		return __( 'Discount must be between 1% and 99%.', 'jetpack-paypal-payments' );
	}

	return null;
}

/**
 * Validate a flat discount against the price it comes off.
 *
 * Where there is a price to compare against, the amount has to come in under it -
 * PayPal returns a 422 at or above.
 *
 * @param {string} value           - The amount off.
 * @param {string} comparisonPrice - The price it comes off, or '' when there is none.
 * @param {string} currencyCode    - The ISO currency code the amount is in.
 * @return {string|null} Error message or null if valid.
 */
export function validateDiscountAmount( value, comparisonPrice, currencyCode = 'USD' ) {
	const num = parseFloat( value );

	// PayPal rejects a zero discount, "0" and "0.00" alike, so zero points at the toggle.
	if ( isNaN( num ) || num <= 0 ) {
		return REQUIRED_FIELD_ERROR;
	}

	const against = parseFloat( comparisonPrice );
	if ( ! isNaN( against ) && num >= against ) {
		return __( 'Discount must be less than the product price.', 'jetpack-paypal-payments' );
	}

	return getPriceFormatError( value, currencyCode );
}

/**
 * Validate a discount against the rule its own type carries.
 *
 * A percentage checks a range and an amount checks against the price, so the type
 * picks between the two here.
 *
 * @param {string} type            - Discount type: FLAT or PERCENTAGE.
 * @param {string} value           - The amount or percentage off.
 * @param {string} comparisonPrice - The price a flat discount comes off.
 * @param {string} currencyCode    - The ISO currency code the amount is in.
 * @return {string|null} Error message or null if valid.
 */
function validateDiscount( type, value, comparisonPrice, currencyCode ) {
	return 'PERCENTAGE' === type
		? validateDiscountPercentage( value )
		: validateDiscountAmount( value, comparisonPrice, currencyCode );
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
 * Error keys whose control sits outside the Checkout Options panel.
 *
 * The panel opens itself on an error from one of its own fields. Listing the
 * outsiders covers a new checkout field the moment its key exists.
 */
export const NON_CHECKOUT_ERROR_KEYS = [
	'productName',
	'price',
	'productDescription',
	'currencyCode',
	'returnUrl',
];

/**
 * The first error message, skipping the fields the caller excludes.
 *
 * @param {object}   errors  - Errors from getValidationErrors().
 * @param {string[]} exclude - Keys to skip.
 * @return {string|null} The message, or null when there is nothing to report.
 */
export function firstBlockingError( errors, exclude = ADVISORY_ERROR_KEYS ) {
	const found = Object.entries( errors ).find(
		( [ field, message ] ) => message && ! exclude.includes( field )
	);

	return found ? found[ 1 ] : null;
}

/**
 * Whether an error belongs to a field inside the Checkout Options panel.
 *
 * @param {object} errors - Errors from getValidationErrors().
 * @return {boolean} True when the panel should open itself.
 */
export function hasCheckoutOptionError( errors ) {
	return null !== firstBlockingError( errors, NON_CHECKOUT_ERROR_KEYS );
}

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
 * @param {object}  fields                         - The form's current values.
 * @param {string}  fields.productName             - Product name.
 * @param {string}  fields.price                   - Product price.
 * @param {string}  fields.productDescription      - Product description.
 * @param {string}  fields.returnUrl               - Post-payment redirect.
 * @param {string}  fields.currencyCode            - ISO currency code.
 * @param {boolean} fields.variantPricingOn        - Whether options carry their own prices.
 * @param {boolean} fields.taxEnabled              - Whether tax collection is on.
 * @param {string}  fields.taxType                 - Tax type: PERCENTAGE, FLAT or PREFERENCE.
 * @param {string}  fields.taxValue                - Tax rate or flat amount.
 * @param {boolean} fields.handlingEnabled         - Whether a handling fee is on.
 * @param {string}  fields.handlingValue           - Handling fee amount.
 * @param {boolean} fields.discountEnabled         - Whether a discount is on.
 * @param {string}  fields.discountType            - Discount type: FLAT or PERCENTAGE.
 * @param {string}  fields.discountValue           - Discount amount or percentage.
 * @param {string}  fields.comparisonPrice         - The price a flat discount comes off,
 *                                                 from getComparisonPrice().
 * @param {boolean} fields.shippingEnabled         - Whether shipping is on.
 * @param {string}  fields.shippingMode            - PROFILE, QUANTITY, FLAT or FREE.
 * @param {string}  fields.shippingValue           - Shipping fee, or the first-item fee.
 * @param {string}  fields.shippingAdditionalValue
 *                                                 - The per-extra-item fee. Optional.
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
	taxType,
	taxValue,
	handlingEnabled,
	handlingValue,
	discountEnabled,
	discountType,
	discountValue,
	comparisonPrice,
	shippingEnabled,
	shippingMode,
	shippingValue,
	shippingAdditionalValue,
} ) {
	const currency = currencyCode || 'USD';

	return {
		productName: validateProductName( productName ),
		// The price field is hidden once per-variant pricing is on, so don't validate
		// it - an error on an invisible field would disable Save with nothing to fix.
		price: variantPricingOn ? null : validatePrice( price, currency ),
		productDescription: validateDescription( productDescription ),
		returnUrl: validateReturnUrl( returnUrl ),
		// PREFERENCE takes its rate from the merchant's PayPal profile.
		taxValue:
			taxEnabled && 'PREFERENCE' !== taxType ? validateTax( taxType, taxValue, currency ) : null,
		handlingValue: handlingEnabled ? validateMoney( handlingValue, currency ) : null,
		discountValue: discountEnabled
			? validateDiscount( discountType, discountValue, comparisonPrice, currency )
			: null,
		// PROFILE and FREE send their own value, so only the fee modes have a field to fill.
		shippingValue:
			shippingEnabled && SHIPPING_MODES_WITH_FEE.includes( shippingMode || 'FLAT' )
				? validateMoney( shippingValue, currency )
				: null,
		// PayPal requires only the first fee, so this is checked when it is filled in.
		shippingAdditionalValue:
			shippingEnabled && 'QUANTITY' === shippingMode && '' !== ( shippingAdditionalValue ?? '' )
				? validateMoney( shippingAdditionalValue, currency )
				: null,
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
	return null !== firstBlockingError( errors );
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
