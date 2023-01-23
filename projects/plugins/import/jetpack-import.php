<?php
/**
 *
 * Plugin Name: Jetpack Import
 * Plugin URI: https://wordpress.org/plugins/jetpack-import
 * Description: Import content.
 * Version: 0.2.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-import
 *
 * @package automattic/jetpack-import
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

define( 'JETPACK_IMPORT_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_IMPORT_ROOT_FILE', __FILE__ );
define( 'JETPACK_IMPORT_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_IMPORT_SLUG', 'jetpack-import' );
define( 'JETPACK_IMPORT_NAME', 'Jetpack Import' );
define( 'JETPACK_IMPORT_URI', 'https://jetpack.com/jetpack-import' );
define( 'JETPACK_IMPORT_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

if ( ! defined( 'JETPACK_IMPORT_REST_NAMESPACE' ) ) {
	define( 'JETPACK_IMPORT_REST_NAMESPACE', 'jetpack-import/v1' );
}

// For use in situations where you want additional namespacing.
if ( ! defined( 'JETPACK_IMPORT_REST_PREFIX' ) ) {
	define( 'JETPACK_IMPORT_REST_PREFIX', '' );
}

if ( ! defined( 'JETPACK_IMPORTE_ID_META_NAME' ) ) {
	define( 'JETPACK_IMPORT_ID_META_NAME', 'unified_importer_id' );
}

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_IMPORT_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_IMPORT_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Import plugin', 'jetpack-import' )
		);
	}

	add_action(
		'admin_notices',
		function () {
			?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack Import is incomplete. If you installed Jetpack Import from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Import must have Composer dependencies installed and built via the build command.', 'jetpack-import' ),
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
				?>
			</p>
		</div>
			<?php
		}
	);

	return;
}

// Redirect to plugin page when the plugin is activated.
add_action( 'activated_plugin', 'jetpack_import_activation' );

/**
 * Redirects to plugin page when the plugin is activated
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 */
function jetpack_import_activation( $plugin ) {
	if (
		JETPACK_IMPORT_ROOT_FILE_RELATIVE_PATH === $plugin &&
		\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( JETPACK_IMPORT_ROOT_FILE_RELATIVE_PATH )
	) {
		wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-import' ) ) );
		exit;
	}
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . JETPACK_IMPORT_FOLDER . '/jetpack-import.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-import' ) ) . '">' . __( 'Settings', 'jetpack-import' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_deactivation_hook( __FILE__, array( 'Jetpack_Import', 'plugin_deactivation' ) );

// Main plugin class.
new Jetpack_Import();
