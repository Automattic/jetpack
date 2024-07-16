<?php
/**
 *
 * Plugin Name: Automattic for Agencies Client
 * Plugin URI: https://wordpress.org/plugins/automattic-for-agencies-client
 * Description: Securely connect your clients’ sites to the Automattic for Agencies Sites Dashboard. Manage your sites from one place and see what needs attention.
 * Version: 0.2.2-alpha
 * Author: Automattic
 * Author URI: https://automattic.com/for-agencies/
 * License: GPLv2 or later
 * Text Domain: automattic-for-agencies-client
 *
 * @package automattic/automattic-for-agencies-client
 */

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_DIR', plugin_dir_path( __FILE__ ) );
define( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_ROOT_FILE', __FILE__ );
define( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG', 'automattic-for-agencies-client' );
define( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_NAME', 'Automattic for Agencies Client' );
define( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_URI', 'https://jetpack.com/automattic-for-agencies-client' );
define( 'AUTOMATTIC_FOR_AGENCIES_CLIENT_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = AUTOMATTIC_FOR_AGENCIES_CLIENT_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( AUTOMATTIC_FOR_AGENCIES_CLIENT_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Automattic For Agencies Client plugin', 'automattic-for-agencies-client' )
		);
	}

	add_action(
		'admin_notices',
		function () {
			$message = sprintf(
				wp_kses(
					/* translators: Placeholder is a link to a support document. */
					__( 'Your installation of Automattic For Agencies Client is incomplete. If you installed Automattic For Agencies Client from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Automattic For Agencies Client must have Composer dependencies installed and built via the build command.', 'automattic-for-agencies-client' ),
					array(
						'a' => array(
							'href'   => array(),
							'target' => array(),
							'rel'    => array(),
						),
					)
				),
				'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project'
			);
			wp_admin_notice(
				$message,
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
	'plugin_action_links_' . AUTOMATTIC_FOR_AGENCIES_CLIENT_FOLDER . '/automattic-for-agencies-client.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'options-general.php?page=' . AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG ) ) . '">' . __( 'Settings', 'automattic-for-agencies-client' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

// Redirect to plugin page when the plugin is activated.
add_action( 'activated_plugin', 'jetpack_starter_plugin_activation' );

/**
 * Redirects to plugin page when the plugin is activated
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 */
function jetpack_starter_plugin_activation( $plugin ) {
	if (
		AUTOMATTIC_FOR_AGENCIES_CLIENT_ROOT_FILE_RELATIVE_PATH === $plugin &&
		( new \Automattic\Jetpack\Paths() )->is_current_request_activating_plugin_from_plugins_screen( AUTOMATTIC_FOR_AGENCIES_CLIENT_ROOT_FILE_RELATIVE_PATH )
	) {
		wp_safe_redirect( esc_url( admin_url( 'options-general.php?page=' . AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG ) ) );
		exit;
	}
}

register_deactivation_hook( __FILE__, array( 'Automattic_For_Agencies_Client', 'plugin_deactivation' ) );

// Initialize the plugin's main class.
Automattic_For_Agencies_Client::init();
