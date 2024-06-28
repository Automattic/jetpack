<?php
/**
 * WP-Admin Posts list bootstrap file.
 *
 * @deprecated $$next-version$$
 *
 * @package automattic\jetpack
 */

_deprecated_file( __FILE__, 'jetpack-$$next-version$$' );

use Automattic\Jetpack\Masterbar;

/**
 * Load the Posts_List_Notification.
 *
 * @deprecated $$next-version$$
 */
function masterbar_init_wp_posts_list() {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\masterbar_init_wp_posts_list' );
	Masterbar\masterbar_init_wp_posts_list();
}

add_action( 'init', 'masterbar_init_wp_posts_list', 1 );
