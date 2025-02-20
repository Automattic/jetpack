<?php
/**
 * Load the Newsletter Widget feature on WordPress.com Simple Site.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Load the newsletter widget in the Dashboard.
 */
if ( defined( 'JETPACK_PLUGIN_LOADER_PATH' ) && defined( 'JETPACK_NEWSLETTER_WIDGET' ) && JETPACK_NEWSLETTER_WIDGET ) {
	require_once JETPACK_PLUGIN_LOADER_PATH . '/class-jetpack-newsletter-dashboard-widget.php';
	add_action( 'wp_dashboard_setup', array( new Jetpack_Newsletter_Dashboard_Widget(), 'init' ) );
}
