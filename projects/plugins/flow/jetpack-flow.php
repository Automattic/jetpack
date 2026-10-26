<?php
/**
 *
 * Plugin Name: Jetpack Flow
 * Plugin URI: https://jetpack.com/
 * Description: Connect Jetpack, MailPoet, CRM and WooCommerce with if-this-then-that flows.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-flow
 *
 * @package automattic/jetpack-flow-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'JETPACK_FLOW_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_FLOW_ROOT_FILE', __FILE__ );
define( 'JETPACK_FLOW_SLUG', 'jetpack-flow' );
define( 'JETPACK_FLOW__VERSION', '0.1.0-alpha' );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_FLOW_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	$jetpack_i18n_map = JETPACK_FLOW_DIR . 'jetpack_vendor/i18n-map.php';
	if ( is_readable( $jetpack_i18n_map ) && method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( $jetpack_i18n_map );
	}
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( 'Error loading autoloader file for Jetpack Flow plugin' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}

			wp_admin_notice(
				'Your installation of Jetpack Flow is incomplete. Please refer to <a href="https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.',
				array(
					'type'        => 'error',
					'dismissible' => true,
				)
			);
		}
	);

	return;
}

// Add a "Flow" link to the plugins page.
add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	function ( $actions ) {
		array_unshift( $actions, '<a href="' . esc_url( \Automattic\Jetpack\Flow\Flow::dashboard_url() ) . '">' . esc_html__( 'Open Flow', 'jetpack-flow' ) . '</a>' );
		return $actions;
	}
);

new Jetpack_Flow();
