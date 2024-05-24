<?php
/**
 * Jetpack_Currencies: Utils for displaying and managing currencies.
 *
 * @package    Jetpack
 * @since      9.1.0
 */

/**
 * General currencies specific functionality
 */
class Jetpack_Currencies {
	/**
	 * Currencies definition
	 */
	const CURRENCIES = array(
		'USD' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => '$',
			'decimal' => 2,
		),
		'GBP' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => '&#163;',
			'decimal' => 2,
		),
		'JPY' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => '&#165;',
			'decimal' => 0,
		),
		'BRL' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => 'R$',
			'decimal' => 2,
		),
		'EUR' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => '&#8364;',
			'decimal' => 2,
		),
		'NZD' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => 'NZ$',
			'decimal' => 2,
		),
		'AUD' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => 'A$',
			'decimal' => 2,
		),
		'CAD' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => 'C$',
			'decimal' => 2,
		),
		'ILS' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => '₪',
			'decimal' => 2,
		),
		'RUB' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => '₽',
			'decimal' => 2,
		),
		'MXN' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => 'MX$',
			'decimal' => 2,
		),
		'MYR' => array(
			'format'  => '%2$s%1$s', // 1: Symbol 2: currency value
			'symbol'  => 'RM',
			'decimal' => 2,
		),
		'SEK' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'Skr',
			'decimal' => 2,
		),
		'HUF' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'Ft',
			'decimal' => 0, // Decimals are supported by Stripe but not by PayPal.
		),
		'CHF' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'CHF',
			'decimal' => 2,
		),
		'CZK' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'Kč',
			'decimal' => 2,
		),
		'DKK' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'Dkr',
			'decimal' => 2,
		),
		'HKD' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'HK$',
			'decimal' => 2,
		),
		'NOK' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'Kr',
			'decimal' => 2,
		),
		'PHP' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => '₱',
			'decimal' => 2,
		),
		'PLN' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => 'PLN',
			'decimal' => 2,
		),
		'SGD' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => 'S$',
			'decimal' => 2,
		),
		'TWD' => array(
			'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
			'symbol'  => 'NT$',
			'decimal' => 0, // Decimals are supported by Stripe but not by PayPal.
		),
		'THB' => array(
			'format'  => '%2$s%1$s', // 1: Symbol 2: currency value
			'symbol'  => '฿',
			'decimal' => 2,
		),
		'INR' => array(
			'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
			'symbol'  => '₹',
			'decimal' => 0,
		),
	);

	/**
	 * Format a price with currency.
	 *
	 * Uses currency-aware formatting to output a formatted price with a simple fallback.
	 *
	 * Largely inspired by WordPress.com's Store_Price::display_currency
	 *
	 * @param  string $price    Price.
	 * @param  string $currency Currency.
	 * @param  bool   $symbol   Whether to display the currency symbol.
	 * @return string           Formatted price.
	 */
	public static function format_price( $price, $currency, $symbol = true ) {
		// Add some basic formatting for the price.
		$formatted_number = new NumberFormatter( get_locale(), NumberFormatter::DECIMAL );
		$price            = (float) $formatted_number->parse( $price );

		// Fall back to unspecified currency symbol like `¤1,234.05`.
		// @link https://en.wikipedia.org/wiki/Currency_sign_(typography).
		if ( ! array_key_exists( $currency, self::CURRENCIES ) ) {
			return '¤' . number_format_i18n( $price, 2 );
		}

		$currency_details = self::CURRENCIES[ $currency ];

		// Ensure USD displays as 1234.56 even in non-US locales.
		$amount = 'USD' === $currency
			? number_format( $price, $currency_details['decimal'], '.', ',' )
			: number_format_i18n( $price, $currency_details['decimal'] );

		return sprintf(
			$currency_details['format'],
			$symbol ? $currency_details['symbol'] : '',
			$amount
		);
	}
}
