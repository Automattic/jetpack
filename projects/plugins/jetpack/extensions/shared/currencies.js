// Removes all dots (`.`) from the end of a string.
function removeTrailingDots( string ) {
	return String( string || '' ).replace( /\.+$/, '' );
}

/**
 * Currency data for formatting currencies.
 * This is an internalized version of the CURRENCIES object previously imported from format-currency.
 */
export const LEGACY_CURRENCIES = {
	USD: {
		symbol: '$',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	AUD: {
		symbol: 'A$',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	BRL: {
		symbol: 'R$',
		decimal: ',',
		grouping: '.',
		precision: 2,
	},
	CAD: {
		symbol: 'C$',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	CHF: {
		symbol: 'CHF',
		decimal: '.',
		grouping: "'",
		precision: 2,
	},
	DKK: {
		symbol: 'kr.',
		decimal: ',',
		grouping: '.',
		precision: 2,
	},
	EUR: {
		symbol: '€',
		decimal: ',',
		grouping: '.',
		precision: 2,
	},
	GBP: {
		symbol: '£',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	HKD: {
		symbol: 'HK$',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	INR: {
		symbol: '₹',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	JPY: {
		symbol: '¥',
		decimal: '.',
		grouping: ',',
		precision: 0,
	},
	MXN: {
		symbol: 'MX$',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	NOK: {
		symbol: 'kr',
		decimal: ',',
		grouping: ' ',
		precision: 2,
	},
	NZD: {
		symbol: 'NZ$',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
	PLN: {
		symbol: 'zł',
		decimal: ',',
		grouping: ' ',
		precision: 2,
	},
	SEK: {
		symbol: 'kr',
		decimal: ',',
		grouping: ' ',
		precision: 2,
	},
	SGD: {
		symbol: 'S$',
		decimal: '.',
		grouping: ',',
		precision: 2,
	},
};

// For backward compatibility, also export as CURRENCIES
export const CURRENCIES = LEGACY_CURRENCIES;

/**
 * Get the currency settings for a certain currency.
 * This is an internalized version of the function previously provided by format-currency.
 *
 * @param {string} code - The currency code.
 * @return {object} - Object containing currency settings.
 */
export function getCurrencyDefaults( code ) {
	return (
		LEGACY_CURRENCIES[ code ] || {
			symbol: '$',
			decimal: '.',
			grouping: ',',
			precision: 2,
		}
	);
}

/**
 * Currencies we support and Stripe's minimum amount for a transaction in that currency.
 *
 * @see https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts
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
 * @return {number} Minimum charge amount for the given currency_code
 */
export function minimumTransactionAmountForCurrency( currency_code ) {
	return SUPPORTED_CURRENCIES[ currency_code ];
}

/**
 * Returns the default amounts for the given currency.
 *
 * @param {string} currency_code - three character currency code to get default amounts for
 * @return {number[]} Default amounts for the given currency_code
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
 * @param {number} price    - Price to check.
 * @return {boolean} true if valid price
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
	if ( LEGACY_CURRENCIES[ currency ].grouping ) {
		// Remove any thousand grouping separator.
		ungrouped_amount = amount.replace(
			new RegExp( '\\' + LEGACY_CURRENCIES[ currency ].grouping, 'g' ),
			''
		);
	}

	amount = parseFloat(
		ungrouped_amount
			// Replace the localized decimal separator with a dot (the standard decimal separator in float numbers).
			.replace( new RegExp( '\\' + LEGACY_CURRENCIES[ currency ].decimal, 'g' ), '.' )
	);

	if ( isNaN( amount ) ) {
		return null;
	}

	return amount;
}
