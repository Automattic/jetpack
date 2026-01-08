<?php
/**
 * WooCommerce function mocks for testing.
 *
 * @package automattic/woocommerce-analytics
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

/**
 * Global variable to store mock order for testing.
 *
 * @var mixed
 */
global $wc_get_order_mock_return;
$wc_get_order_mock_return = false;

/**
 * Global variable to track wc_get_order calls.
 *
 * @var array
 */
global $wc_get_order_calls;
$wc_get_order_calls = array();

/**
 * Global variable to store mock WC instance for testing.
 *
 * @var object|null
 */
global $wc_mock_instance;
$wc_mock_instance = null;

if ( ! function_exists( 'wc_get_order' ) ) {
	/**
	 * Mock wc_get_order function.
	 *
	 * @param mixed $the_order Post object or post ID of the order.
	 * @return mixed The mocked return value.
	 */
	function wc_get_order( $the_order = false ) {
		global $wc_get_order_mock_return, $wc_get_order_calls;
		$wc_get_order_calls[] = $the_order;
		return $wc_get_order_mock_return;
	}
}

if ( ! function_exists( 'WC' ) ) {
	/**
	 * Mock WC function.
	 *
	 * @return object Mock WooCommerce object.
	 */
	function WC() {
		global $wc_mock_instance;
		if ( $wc_mock_instance !== null ) {
			return $wc_mock_instance;
		}
		return new class() {
			/**
			 * Session property.
			 *
			 * @var object|null
			 */
			public $session = null;
		};
	}
}

/**
 * Helper function to set the mock WC instance for testing.
 *
 * @param object|null $instance The mock WC instance.
 */
function set_wc_mock_instance( $instance ) {
	global $wc_mock_instance;
	$wc_mock_instance = $instance;
}

/**
 * Helper function to reset the mock WC instance.
 */
function reset_wc_mock_instance() {
	global $wc_mock_instance;
	$wc_mock_instance = null;
}
