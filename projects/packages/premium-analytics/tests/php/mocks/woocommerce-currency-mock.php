<?php
/**
 * Stubs WooCommerce's currency functions with a euro store.
 *
 * Require it from inside a process-isolated test only, so the functions never leak
 * into tests that assert the no-WooCommerce path.
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable WordPress.Files.FileName

if ( ! function_exists( 'get_woocommerce_currency' ) ) {
	/**
	 * Stub of get_woocommerce_currency().
	 *
	 * @return string
	 */
	function get_woocommerce_currency() {
		return 'EUR';
	}
}

if ( ! function_exists( 'get_woocommerce_currency_symbol' ) ) {
	/**
	 * Stub of get_woocommerce_currency_symbol(), which returns an HTML entity like the real one.
	 *
	 * @param string $currency Currency code.
	 * @return string
	 */
	function get_woocommerce_currency_symbol( $currency = '' ) {
		return 'EUR' === $currency ? '&euro;' : '';
	}
}
