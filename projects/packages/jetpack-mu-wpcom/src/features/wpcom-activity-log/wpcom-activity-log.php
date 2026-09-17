<?php
/**
 * Activity Log on WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Registers the WordPress.com view of the Activity Log product.
 *
 * @return void
 */
function wpcom_activity_log_init() {
	add_filter( 'my_jetpack_products_classes', 'wpcom_activity_log_product_class' );
}

/**
 * Points My Jetpack's Activity Log card at the WordPress.com product class.
 *
 * Named as a string rather than with `::class` so nothing loads the subclass before My
 * Jetpack, which owns its parent, has resolved this filter.
 *
 * @param array $classes Product classes, keyed by product slug.
 * @return array
 */
function wpcom_activity_log_product_class( $classes ) {
	$classes['activity-log'] = 'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\Wpcom_Activity_Log';

	return $classes;
}
