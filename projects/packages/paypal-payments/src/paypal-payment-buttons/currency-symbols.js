/**
 * Currency symbol map for common currencies.
 *
 * Shared across paypal-button-preview.js and save.js to avoid duplication.
 * Must match class-paypal-payment-buttons.php for consistent WYSIWYG rendering.
 *
 * @package
 * @since 0.9.0
 */

export const CURRENCY_SYMBOLS = {
	USD: '$',
	EUR: '\u20AC',
	GBP: '\u00A3',
	JPY: '\u00A5',
	CAD: 'CA$',
	AUD: 'A$',
	CHF: 'CHF',
	CNY: '\u00A5',
	INR: '\u20B9',
	BRL: 'R$',
	MXN: 'MX$',
	HKD: 'HK$',
	NZD: 'NZ$',
	SGD: 'S$',
	SEK: 'kr',
	NOK: 'kr',
	DKK: 'kr',
	PLN: 'z\u0142',
	CZK: 'K\u010D',
	HUF: 'Ft',
	ILS: '\u20AA',
	MYR: 'RM',
	PHP: '\u20B1',
	TWD: 'NT$',
	THB: '\u0E3F',
};

/**
 * Currencies PayPal only accepts as whole numbers. A decimal amount is
 * rejected outright, not rounded. Matches the `decimal` column of the PHP
 * currency table.
 */
export const ZERO_DECIMAL_CURRENCIES = new Set( [ 'HUF', 'JPY', 'TWD' ] );

/**
 * The smallest step a price input should offer for a currency.
 *
 * @param {string} currencyCode - The ISO currency code.
 * @return {string} '1' for a zero-decimal currency, '0.01' otherwise.
 */
export function getPriceStep( currencyCode ) {
	return ZERO_DECIMAL_CURRENCIES.has( currencyCode ) ? '1' : '0.01';
}
