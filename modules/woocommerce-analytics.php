<?php
/**
 * Deprecated since 8.8.0
 *
 * Originally we created the WooCommerce Analytics feature
 * to bring more information to Store Stats available
 * in the WordPress.com Stats dashboard:
 * https://wordpress.com/store/stats/orders/day/
 *
 * We're not currently working on this Store Stats screen
 * and may now be able to use the WooCommerce plugin directly
 * to access that information.
 *
 * @deprecated
 * @package Jetpack
 */

/**
 * Deactivate module if it is still active.
 *
 * @since 8.8.0
 */
if ( Jetpack::is_module_active( 'woocommerce-analytics' ) ) {
	Jetpack::deactivate_module( 'woocommerce-analytics' );
}
