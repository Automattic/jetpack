<?php
/**
 *
 * Plugin Name: Jetpack Premium Analytics
 * Plugin URI: https://jetpack.com/
 * Description: Premium Analytics dashboard for Jetpack sites.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-premium-analytics
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'JETPACK_PREMIUM_ANALYTICS_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_PREMIUM_ANALYTICS_ROOT_FILE', __FILE__ );
define( 'JETPACK_PREMIUM_ANALYTICS_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_PREMIUM_ANALYTICS_SLUG', 'jetpack-premium-analytics' );
define( 'JETPACK_PREMIUM_ANALYTICS_NAME', 'Jetpack Premium Analytics' );
define( 'JETPACK_PREMIUM_ANALYTICS_URI', 'https://jetpack.com/' );
define( 'JETPACK_PREMIUM_ANALYTICS_FOLDER', dirname( plugin_basename( __FILE__ ) ) );
define( 'JETPACK_PREMIUM_ANALYTICS__VERSION', '0.1.0-alpha' );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_PREMIUM_ANALYTICS_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( 'Error loading autoloader file for Jetpack Premium Analytics plugin' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}

			wp_admin_notice(
				'Your installation of Jetpack Premium Analytics is incomplete. Please refer to <a href="https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.',
				array(
					'type'        => 'error',
					'dismissible' => true,
				)
			);
		}
	);

	return;
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . JETPACK_PREMIUM_ANALYTICS_FOLDER . '/jetpack-premium-analytics.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-premium-analytics' ) ) . '">Settings</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

// Main plugin class.
new Jetpack_Premium_Analytics();
