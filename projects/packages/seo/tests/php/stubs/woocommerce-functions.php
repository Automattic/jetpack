<?php
/**
 * Minimal WooCommerce function stubs for schema tests.
 *
 * @package automattic/jetpack-seo
 */

if ( ! function_exists( 'WC' ) ) {
	/**
	 * Return the WooCommerce test singleton.
	 *
	 * @return WooCommerce
	 */
	function WC() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
		return WooCommerce::instance();
	}
}

if ( ! function_exists( 'is_woocommerce' ) ) {
	/**
	 * Whether the current test request uses a WooCommerce template.
	 *
	 * @return bool
	 */
	function is_woocommerce() {
		return WooCommerce::$is_template;
	}
}
