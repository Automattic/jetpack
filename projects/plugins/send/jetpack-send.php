<?php
/**
 *
 * Plugin Name: Jetpack Send
 * Plugin URI: https://jetpack.com/
 * Description: Reliable delivery for the emails your site sends, powered by MailChannels.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-send
 *
 * @package automattic/jetpack-send-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'JETPACK_SEND_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_SEND_ROOT_FILE', __FILE__ );
define( 'JETPACK_SEND_FOLDER', dirname( plugin_basename( __FILE__ ) ) );
define( 'JETPACK_SEND__VERSION', '0.1.0-alpha' );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_SEND_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	$jetpack_i18n_map = JETPACK_SEND_DIR . 'jetpack_vendor/i18n-map.php';
	if ( is_readable( $jetpack_i18n_map ) && method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( $jetpack_i18n_map );
	}
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( 'Error loading autoloader file for Jetpack Send plugin' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}

			wp_admin_notice(
				'Your installation of Jetpack Send is incomplete. Please refer to <a href="https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.',
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
	'plugin_action_links_' . JETPACK_SEND_FOLDER . '/jetpack-send.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( \Automattic\Jetpack\Send\Admin_Page::dashboard_url() ) . '">Settings</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_uninstall_hook( __FILE__, array( 'Jetpack_Send', 'uninstall' ) );

// Main plugin class.
new Jetpack_Send();
