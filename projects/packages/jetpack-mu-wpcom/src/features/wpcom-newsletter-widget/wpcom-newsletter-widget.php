<?php
/**
 * Load the Newsletter Widget feature on WordPress.com Simple Site.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Load the newsletter stats widget in the Dashboard.
 */
if ( defined( 'JETPACK_PLUGIN_LOADER_PATH' ) ) {
	// TODO: Add the newsletter dashboard widget feature checks.
	require_once JETPACK_PLUGIN_LOADER_PATH . '/class-jetpack-newsletter-widget.php';
	add_action( 'wp_dashboard_setup', array( new Jetpack_Newsletter_Dashboard_Widget(), 'init' ) );
}
