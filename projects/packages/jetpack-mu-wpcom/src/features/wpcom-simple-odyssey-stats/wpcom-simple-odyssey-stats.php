<?php
/**
 * Load the Odyssey stats feature on WordPress.com Simple Site.
 * See https://github.com/Automattic/jetpack/tree/trunk/projects/packages/stats-admin
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Stats_Admin\Dashboard as OdysseyStats;
OdysseyStats::init();

/**
 * Load the Odyssey stats widget in the Dashboard.
 */
if ( defined( 'JETPACK_PLUGIN_LOADER_PATH' ) ) {
	require_once JETPACK_PLUGIN_LOADER_PATH . '/class-jetpack-stats-dashboard-widget.php';
	add_action( 'wp_dashboard_setup', array( new Jetpack_Stats_Dashboard_Widget(), 'init' ) );
}
