<?php

/**
 * Class with utility functions to format money amounts. Used primarly by the Simple Payments widget/shortcode
 */
class Jetpack_Money_Format {

	/*
	 * Copied from wp-calypso/client/lib/format-currency/currencies.js
	 * Only includes the currencies supported by Paypal, see
	 * wp-calypso/client/components/tinymce/plugins/simple-payments/dialog/form.jsx#SUPPORTED_CURRENCY_LIST
	 */
	private static $currencies = array(
		'USD' => array(
			'symbol' => '$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'EUR' => array(
			'symbol' => '€',
			'grouping' => '.',
			'decimal' => ',',
			'precision' => 2,
		),
		'AUD' => array(
			'symbol' => 'A$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'BRL' => array(
			'symbol' => 'R$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'CAD' => array(
			'symbol' => 'C$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'CZK' => array(
			'symbol' => 'Kč',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'DKK' => array(
			'symbol' => 'kr.',
			'grouping' => '',
			'decimal' => ',',
			'precision' => 2,
		),
		'HKD' => array(
			'symbol' => 'HK$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'HUF' => array(
			'symbol' => 'Ft',
			'grouping' => '.',
			'decimal' => ',',
			'precision' => 0,
		),
		'ILS' => array(
			'symbol' => '₪',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'JPY' => array(
			'symbol' => '¥',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 0,
		),
		'MYR' => array(
			'symbol' => 'RM',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'MXN' => array(
			'symbol' => 'MX$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'TWD' => array(
			'symbol' => 'NT$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'NZD' => array(
			'symbol' => 'NZ$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'NOK' => array(
			'symbol' => 'kr',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'PHP' => array(
			'symbol' => '₱',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'PLN' => array(
			'symbol' => 'zł',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'GBP' => array(
			'symbol' => '£',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'RUB' => array(
			'symbol' => '₽',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'SGD' => array(
			'symbol' => '$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'SEK' => array(
			'symbol' => 'kr',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'CHF' => array(
			'symbol' => 'CHF',
			'grouping' => '\'',
			'decimal' => '.',
			'precision' => 2,
		),
		'THB' => array(
			'symbol' => '฿',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
	);

	/**
	 * Validates and sanitizes a price amount in the form of a string
	 * @param $currency_code string Currency code that this amount is in
	 * @param $price string Amount, as entered by the user
	 * @return false|float FALSE if the input is invalid, a float representing the money amount otherwise
	 */
	public static function sanitize_price( $currency_code, $price ) {
		// Forbid negative amounts
		if ( '-' === substr( $price, 0, 1 ) ) {
			return false;
		}
		// Forbid unsupported amounts
		$currency = self::$currencies[ $currency_code ];
		if ( ! isset( $currency ) ) {
			return false;
		}
		$decimal = $currency['decimal'];
		$precision = $currency['precision'];
		// Get all the characters in the string that aren't digits
		$chars = count_chars( $price, 1 );
		for( $i = 0; $i <= 9; $i++ ) {
			unset( $chars[ ord( (string) $i ) ] );
		}
		// The only non-digit char expected is the decimal separator, so if there's more than 1 it's invalid
		if ( count( $chars ) > 1 || reset( $chars ) > 1 ) {
			return false;
		}

		// Allow the decimal separator to be the currency decimal separator or "." (as a fallback)
		if ( ! empty( $chars ) ) {
			$decimal_char = chr( key( $chars ) );
			if ( $decimal_char !== $decimal && $decimal_char !== '.' ) {
				return false;
			}
			$price = str_replace( $decimal_char, '.', $price );
		}

		return round( (float) $price, $precision );
	}


	/**
	 * Formats a price to display it to the user, including the currency symbol
	 * @param $currency_code string Currency code
	 * @param $price float Monetary amount
	 * @return string The price and currency, formatted
	 */
	public static function format_price( $currency_code, $price ) {
		$currency = self::$currencies[ $currency_code ];
		if ( ! $currency ) {
			// Fallback to a "best effort" formatting, but this should never happen (merchant shouldn't be able to use an unknown currency)
			return $price . ' ' . $currency_code;
		}
		$amount = number_format( (double) $price, $currency['precision'], $currency['decimal'], $currency['grouping'] );
		$symbol = $currency['symbol'];
		if ( $currency_code === 'USD' ) { // TODO: Move this information to the $currencies map
			return $symbol . $amount;
		}
		return $amount . ' ' . $symbol;
	}

	/**
	 * Formats a price to display it to the user
	 * @param $currency_code string Currency code
	 * @param $price float Monetary amount
	 * @return string The price, formatted
	 */
	public static function format_price_amount( $currency_code, $price ) {
		$currency = self::$currencies[ $currency_code ];
		if ( ! $currency ) {
			// Fallback to a "best effort" formatting, but this should never happen (merchant shouldn't be able to use an unknown currency)
			return number_format( $price, 2, '.', '' );
		}
		return number_format( (double) $price, $currency['precision'], $currency['decimal'], '' );
	}

	/**
	 * @param $currency_code string Currency code
	 * @return bool Whether the given currency code is valid
	 */
	public static function is_valid_currency( $currency_code ) {
		return isset( self::$currencies[ $currency_code ] );
	}

	/**
	 * @return array The keys are the currency codes, and the values are human-readable representations of those currencies
	 */
	public static function get_currencies_map() {
		$map = array();
		foreach( self::$currencies as $code => $currency ) {
			$map[ $code ] = $currency['symbol'] === $code ? $code : ( $code . ' ' . rtrim( $currency['symbol'], '.' ) );
		}
		return $map;
	}
}
