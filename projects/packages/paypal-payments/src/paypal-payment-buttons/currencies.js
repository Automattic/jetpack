/**
 * PayPal Payment Buttons — Supported currencies.
 *
 * @package
 * @since 0.9.0
 */

/**
 * Supported currencies for the currency selector.
 * Matches PayPal_Attribute_Mapper::SUPPORTED_CURRENCIES on the server.
 */
export const SUPPORTED_CURRENCIES = [
	{ label: 'USD — US Dollar', value: 'USD' },
	{ label: 'EUR — Euro', value: 'EUR' },
	{ label: 'GBP — British Pound', value: 'GBP' },
	{ label: 'CAD — Canadian Dollar', value: 'CAD' },
	{ label: 'AUD — Australian Dollar', value: 'AUD' },
	{ label: 'JPY — Japanese Yen', value: 'JPY' },
	{ label: 'CHF — Swiss Franc', value: 'CHF' },
	{ label: 'SEK — Swedish Krona', value: 'SEK' },
	{ label: 'NOK — Norwegian Krone', value: 'NOK' },
	{ label: 'DKK — Danish Krone', value: 'DKK' },
	{ label: 'NZD — New Zealand Dollar', value: 'NZD' },
	{ label: 'SGD — Singapore Dollar', value: 'SGD' },
	{ label: 'HKD — Hong Kong Dollar', value: 'HKD' },
	{ label: 'MXN — Mexican Peso', value: 'MXN' },
	{ label: 'BRL — Brazilian Real', value: 'BRL' },
	{ label: 'PLN — Polish Zloty', value: 'PLN' },
	{ label: 'CZK — Czech Koruna', value: 'CZK' },
	{ label: 'HUF — Hungarian Forint', value: 'HUF' },
	{ label: 'ILS — Israeli Shekel', value: 'ILS' },
	{ label: 'MYR — Malaysian Ringgit', value: 'MYR' },
	{ label: 'PHP — Philippine Peso', value: 'PHP' },
	{ label: 'TWD — Taiwan Dollar', value: 'TWD' },
	{ label: 'THB — Thai Baht', value: 'THB' },
	{ label: 'CNY — Chinese Yuan', value: 'CNY' },
];

/**
 * Currency code set for fast lookup.
 */
export const VALID_CURRENCY_CODES = new Set( SUPPORTED_CURRENCIES.map( c => c.value ) );
