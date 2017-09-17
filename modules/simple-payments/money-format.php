<?php

class Jetpack_Money_Format {

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

	public static function sanitize_price( $currency_code, $price ) {
		if ( '-' === substr( $price, 0, 1 ) ) {
			return false;
		}
		$currency = self::$currencies[ $currency_code ];
		if ( ! isset( $currency ) ) {
			return false;
		}
		$decimal = $currency['decimal'];
		$precision = $currency['precision'];
		$chars = count_chars( $price, 1 );
		for( $i = 0; $i <= 9; $i++ ) {
			unset( $chars[ ord( (string) $i ) ] );
		}
		if ( count( $chars ) > 1 || reset( $chars ) > 1 ) {
			return false;
		}

		// Allow the decimal separator to be the currency decimal separator or "."
		if ( ! empty( $chars ) ) {
			$decimal_char = chr( key( $chars ) );
			if ( $decimal_char !== $decimal && $decimal_char !== '.' ) {
				return false;
			}
			$price = str_replace( $decimal_char, '.', $price );
		}

		return round( (float) $price, $precision );
	}

	public static function format_price( $currency_code, $price ) {
		$currency = self::$currencies[ $currency_code ];
		if ( ! $currency ) {
			return $price . ' ' . $currency_code;
		}
		$amount = number_format( (double) $price, $currency['precision'], $currency['decimal'], $currency['grouping'] );
		$symbol = $currency['symbol'];
		if ( $currency_code === 'USD' ) { // TODO: Move this information to the $currencies map
			return $symbol . $amount;
		}
		return $amount . ' ' . $symbol;
	}

	public static function format_price_amount( $currency_code, $price ) {
		$currency = self::$currencies[ $currency_code ];
		if ( ! $currency ) {
			return number_format( $price, 2, '.', '' );
		}
		return number_format( (double) $price, $currency['precision'], $currency['decimal'], '' );
	}

	public static function is_valid_currency( $currency_code ) {
		return isset( self::$currencies[ $currency_code ] );
	}

	public static function get_currencies_map() {
		$map = array();
		foreach( self::$currencies as $code => $currency ) {
			$map[ $code ] = $currency['symbol'] === $code ? $code : ( $code . ' ' . rtrim( $currency['symbol'], '.' ) );
		}
		return $map;
	}
}
