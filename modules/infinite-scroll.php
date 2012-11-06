<?php
/**
 * Module Name: Infinite Scroll
 * Module Description: Automatically pull the next set of posts into view when the reader approaches the bottom of the page.
 * Sort Order: 14
 * First Introduced: 2.0
 */

/**
 * Enable "Configure" button on module card
 *
 * @uses Jetpack::enable_module_configurable, Jetpack::module_configuration_load
 * @action jetpack_modules_loaded
 * @return null
 */
function infinite_scroll_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'infinite_scroll_configuration_load' );
}
add_action( 'jetpack_modules_loaded', 'infinite_scroll_loaded' );

/**
 * Redirect configure button to Settings > Reading
 *
 * @uses wp_safe_redirect, admin_url
 * @return null
 */
function infinite_scroll_configuration_load() {
	wp_safe_redirect( admin_url( 'options-reading.php#infinite-scroll-options' ) );
	exit;
}

/**
 * Provide WP Stats info for tracking Infinite Scroll loads
 *
 * @uses Jetpack::get_active_modules, is_user_logged_in, stats_get_options, Jetpack::get_option, get_option, JETPACK__API_VERSION, JETPACK__VERSION
 * @filter infinite_scroll_js_settings
 * @return array
 */
function infinite_scroll_wp_stats( $settings ) {
	// Abort if Stats module isn't active
	if ( in_array( 'stats', Jetpack::get_active_modules() ) ) {
		// Abort if user is logged in but logged-in users shouldn't be tracked.
		if ( is_user_logged_in() ) {
			$stats_options = stats_get_options();
			$track_loggedin_users = isset( $stats_options['reg_users'] ) ? (bool) $stats_options['reg_users'] : false;

			if ( ! $track_loggedin_users )
				return $settings;
		}

		// We made it this far, so gather the data needed to track IS views
		$settings['stats'] = 'blog=' . Jetpack::get_option( 'id' ) . '&host=' . parse_url( get_option( 'home' ), PHP_URL_HOST ) . '&v=ext&j=' . JETPACK__API_VERSION . ':' . JETPACK__VERSION;
	}

	return $settings;
}
add_filter( 'infinite_scroll_js_settings', 'infinite_scroll_wp_stats' );

/**
 * Load main IS file
 */
require_once( dirname( __FILE__ ) . "/infinite-scroll/infinity.php" );