import { CURRENCIES, getCurrencyDefaults } from '@automattic/format-currency';
import { trimEnd } from 'lodash';

/**
 * Currencies we support and Stripe's minimum amount for a transaction in that currency.
 *
 * @link https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts
 *
 * List has to be in with `Jetpack_Memberships::SUPPORTED_CURRENCIES` in modules/memberships/class-jetpack-memberships.php and
 * `Memberships_Product::SUPPORTED_CURRENCIES` in the WP.com memberships library.
 */
export const SUPPORTED_CURRENCIES = {
	USD: 0.5,
	AUD: 0.5,
	BRL: 0.5,
	CAD: 0.5,
	CHF: 0.5,
	DKK: 2.5,
	EUR: 0.5,
	GBP: 0.3,
	HKD: 4.0,
	INR: 0.5,
	JPY: 50,
	MXN: 10,
	NOK: 3.0,
	NZD: 0.5,
	PLN: 2.0,
	SEK: 3.0,
	SGD: 0.5,
};

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
export const CURRENCY_OPTIONS = Object.keys( SUPPORTED_CURRENCIES ).map( value => {
	const { symbol } = getCurrencyDefaults( value );
	const label = symbol === value ? value : `${ value } ${ trimEnd( symbol, '.' ) }`;
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
	return SUPPORTED_CURRENCIES[ currency_code ];
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
