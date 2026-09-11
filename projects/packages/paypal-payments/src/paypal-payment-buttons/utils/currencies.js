/**
 * PayPal Payment Buttons — Supported currencies.
 *
 * @package
 */

import { CURRENCY_SYMBOLS } from './currency-symbols';

/**
 * Supported currency codes.
 * Matches PayPal_Attribute_Mapper::SUPPORTED_CURRENCIES on the server.
 */
const SUPPORTED_CURRENCY_CODES = [
	'USD',
	'EUR',
	'GBP',
	'CAD',
	'AUD',
	'JPY',
	'CHF',
	'SEK',
	'NOK',
	'DKK',
	'NZD',
	'SGD',
	'HKD',
	'MXN',
	'BRL',
	'PLN',
	'CZK',
	'HUF',
	'ILS',
	'MYR',
	'PHP',
	'TWD',
	'THB',
	'CNY',
];

/**
 * Options for the currency selector — the code and its symbol, the way Simple
 * Payments and the Donations block label theirs.
 */
export const SUPPORTED_CURRENCIES = SUPPORTED_CURRENCY_CODES.map( value => {
	const symbol = CURRENCY_SYMBOLS[ value ] || value;
	// Don't print CHF twice when the symbol is the code.
	return { label: symbol === value ? value : `${ value } ${ symbol }`, value };
} );

/**
 * Currency code set for fast lookup.
 */
export const VALID_CURRENCY_CODES = new Set( SUPPORTED_CURRENCY_CODES );
