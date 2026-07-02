<?php
/**
 * Minimal WC() stub so Configuration::is_woocommerce_active() returns true in tests.
 *
 * @package automattic/jetpack-premium-analytics
 */

if ( ! function_exists( 'WC' ) ) {
	/**
	 * No-op WooCommerce accessor stub.
	 */
	function WC() {} // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
}
