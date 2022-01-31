export const SIMPLE_PAYMENTS_PRODUCT_POST_TYPE = 'jp_pay_product';

export const DEFAULT_CURRENCY = 'USD';

/**
 * Currencies should be supported by PayPal:
 * https://developer.paypal.com/docs/api/reference/currency-codes/
 *
 * List has to be in sync with list at the widget's backend side and API's backend side:
 * https://github.com/Automattic/jetpack/blob/31efa189ad223c0eb7ad085ac0650a23facf9ef5/modules/widgets/simple-payments.php#L19-L44
 * https://github.com/Automattic/jetpack/blob/31efa189ad223c0eb7ad085ac0650a23facf9ef5/modules/simple-payments/simple-payments.php#L386-L415
 *
 * Indian Rupee not supported because at the time of the creation of this file
 * because it's limited to in-country PayPal India accounts only.
 * Discussion: https://github.com/Automattic/wp-calypso/pull/28236
 */
export const SUPPORTED_CURRENCY_LIST = [
	DEFAULT_CURRENCY,
	'EUR',
	'AUD',
	'BRL',
	'CAD',
	'CZK',
	'DKK',
	'HKD',
	'HUF',
	'ILS',
	'JPY',
	'MYR',
	'MXN',
	'TWD',
	'NZD',
	'NOK',
	'PHP',
	'PLN',
	'GBP',
	'RUB',
	'SGD',
	'SEK',
	'CHF',
	'THB',
];
