import { CURRENCIES, getCurrencyDefaults } from '@automattic/format-currency';
import { STORE_NAME as MEMBERSHIPS_PRODUCTS_STORE } from '../store/membership-products/constants';
import { useSelect } from '@wordpress/data';

// Removes all dots (`.`) from the end of a string.
function removeTrailingDots( string ) {
	return String( string || '' ).replace( /\.+$/, '' );
}

/**
 * Currencies we support and Stripe's minimum amount for a transaction in that currency.
 *
 * @link https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts
 *
 * This is pulled from `Memberships_Product::SUPPORTED_CURRENCIES` in the WP.com memberships library.
 */
export const stripeMinimumCurrency = useSelect( select =>
	select( MEMBERSHIPS_PRODUCTS_STORE ).getConnectedAccountMinimumCurrency()
);

/**
 * Compute a list of currency value and display labels.
 *
 * - `value` is the currency's three character code
 * - `label` is the user facing representation.
 *
 * @typedef {{value: string, label: string}} CurrencyDetails
 *
 * @type { CurrencyDetails }
 */
export const CURRENCY_OPTIONS = Object.keys( stripeMinimumCurrency ).map( value => {
	const { symbol } = getCurrencyDefaults( value );
	const label = symbol === value ? value : `${ value } ${ removeTrailingDots( symbol ) }`;
	return { value, label };
} );

/**
 * Returns the minimum transaction amount for the given currency. If currency is not one of the
 * known types it returns ...
 *
 * @param {string} currency_code - three character currency code to get minimum charge for
 * @returns {number} Minimum charge amount for the given currency_code
 */
export function minimumTransactionAmountForCurrency( currency_code ) {
	return stripeMinimumCurrency( currency_code );
}

/**
 * Returns the default amounts for the given currency.
 *
 * @param {string} currency_code - three character currency code to get default amounts for
 * @returns {number[]} Default amounts for the given currency_code
 */
export function getDefaultDonationAmountsForCurrency( currency_code ) {
	const minAmount = minimumTransactionAmountForCurrency( currency_code );
	return [
		minAmount * 10, // 1st tier (USD 5)
		minAmount * 30, // 2nd tier (USD 15)
		minAmount * 200, // 3rd tier (USD 100)
	];
}

/**
 * True if the price is a number and at least the minimum allowed amount.
 *
 * @param {string} currency - Currency for the given price.
 * @param {number} price - Price to check.
 * @returns {boolean} true if valid price
 */
export function isPriceValid( currency, price ) {
	return ! isNaN( price ) && price >= minimumTransactionAmountForCurrency( currency );
}

export function parseAmount( amount, currency ) {
	if ( ! amount ) {
		return null;
	}

	if ( typeof amount === 'number' ) {
		return amount;
	}

	amount = parseFloat(
		amount
			// Remove any thousand grouping separator.
			.replace( new RegExp( '\\' + CURRENCIES[ currency ].grouping, 'g' ), '' )
			// Replace the localized decimal separator with a dot (the standard decimal separator in float numbers).
			.replace( new RegExp( '\\' + CURRENCIES[ currency ].decimal, 'g' ), '.' )
	);

	if ( isNaN( amount ) ) {
		return null;
	}

	return amount;
}
