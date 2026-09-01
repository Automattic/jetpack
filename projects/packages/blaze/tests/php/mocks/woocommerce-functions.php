<?php
/**
 * WooCommerce function mocks for testing.
 *
 * These mocks are loaded by bootstrap.php before the test environment
 * to allow testing of add_prices_in_posts functionality.
 *
 * @package automattic/jetpack-blaze
 */

/**
 * Global variable to store mock products for testing.
 *
 * Keys are product IDs, values are price strings.
 *
 * @var array
 */
global $wc_mock_products;
$wc_mock_products = array(
	100 => '19.99',
	200 => '29.99',
);

if ( ! function_exists( 'wc_get_product' ) ) {
	/**
	 * Mock wc_get_product function.
	 *
	 * Returns mock product objects for specific IDs used in tests.
	 *
	 * @param int $product_id Product ID.
	 * @return WC_Product|false Mock product object or false if not found.
	 */
	function wc_get_product( $product_id ) {
		global $wc_mock_products;

		if ( isset( $wc_mock_products[ $product_id ] ) ) {
			return new WC_Product( $wc_mock_products[ $product_id ] );
		}

		return false;
	}
}

if ( ! function_exists( 'wc_get_price_decimal_separator' ) ) {
	/**
	 * Mock decimal separator function.
	 *
	 * @return string The decimal separator.
	 */
	function wc_get_price_decimal_separator() {
		return '.';
	}
}

if ( ! function_exists( 'wc_get_price_thousand_separator' ) ) {
	/**
	 * Mock thousand separator function.
	 *
	 * @return string The thousand separator.
	 */
	function wc_get_price_thousand_separator() {
		return ',';
	}
}

if ( ! function_exists( 'wc_get_price_decimals' ) ) {
	/**
	 * Mock decimals count function.
	 *
	 * @return int The number of decimals.
	 */
	function wc_get_price_decimals() {
		return 2;
	}
}

if ( ! function_exists( 'get_woocommerce_price_format' ) ) {
	/**
	 * Mock price format function.
	 *
	 * @return string The price format string (symbol followed by price).
	 */
	function get_woocommerce_price_format() {
		return '%1$s%2$s';
	}
}

if ( ! function_exists( 'get_woocommerce_currency_symbol' ) ) {
	/**
	 * Mock currency symbol function.
	 *
	 * @return string The currency symbol.
	 */
	function get_woocommerce_currency_symbol() {
		return '$';
	}
}
