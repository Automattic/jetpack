import { CURRENCIES, getCurrencyDefaults } from '@automattic/format-currency';

// Removes all dots (`.`) from the end of a string.
function removeTrailingDots( string ) {
	return String( string || '' ).replace( /\.+$/, '' );
}

/**
 * Currencies we support and Stripe's minimum amount for a transaction in that currency.
 *
 * @link https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts
 *
 * List has to be in with `Jetpack_Memberships::SUPPORTED_CURRENCIES` in modules/memberships/class-jetpack-memberships.php.
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
	return SUPPORTED_CURRENCIES[ currency_code ];
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

	let ungrouped_amount = amount;
	if ( CURRENCIES[ currency ].grouping ) {
		// Remove any thousand grouping separator.
		ungrouped_amount = amount.replace(
			new RegExp( '\\' + CURRENCIES[ currency ].grouping, 'g' ),
			''
		);
	}

	amount = parseFloat(
		ungrouped_amount
			// Replace the localized decimal separator with a dot (the standard decimal separator in float numbers).
			.replace( new RegExp( '\\' + CURRENCIES[ currency ].decimal, 'g' ), '.' )
	);

	if ( isNaN( amount ) ) {
		return null;
	}

	return amount;
}
