<?php
/**
 *
 * Plugin Name: Jetpack Migration
 * Plugin URI: https://wordpress.org/plugins/jetpack-migration
 * Description: A Jetpack plugin that helps users to migrate their sites to WordPress.com.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-migration
 *
 * @package automattic/jetpack-migration
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

define( 'JETPACK_MIGRATION_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_MIGRATION_ROOT_FILE', __FILE__ );
define( 'JETPACK_MIGRATION_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_MIGRATION_SLUG', 'jetpack-migration' );
define( 'JETPACK_MIGRATION_NAME', 'Jetpack Migration' );
define( 'JETPACK_MIGRATION_URI', 'https://jetpack.com/jetpack-migration' );
define( 'JETPACK_MIGRATION_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_MIGRATION_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_MIGRATION_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Migration plugin', 'jetpack-migration' )
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
						__( 'Your installation of Jetpack Migration is incomplete. If you installed Jetpack Migration from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Migration must have Composer dependencies installed and built via the build command.', 'jetpack-migration' ),
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
add_action( 'activated_plugin', 'jetpack_migration_activation' );

/**
 * Redirects to plugin page when the plugin is activated
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 */
function jetpack_migration_activation( $plugin ) {
	if (
		JETPACK_MIGRATION_ROOT_FILE_RELATIVE_PATH === $plugin &&
		\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( JETPACK_MIGRATION_ROOT_FILE_RELATIVE_PATH )
	) {
		wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-migration' ) ) );
		exit;
	}
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . JETPACK_MIGRATION_FOLDER . '/jetpack-migration.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-migration' ) ) . '">' . __( 'Settings', 'jetpack-migration' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_deactivation_hook( __FILE__, array( \Automattic\Jetpack\Migration\Jetpack_Migration::class, 'plugin_deactivation' ) );

// Main plugin class.
new \Automattic\Jetpack\Migration\Jetpack_Migration();
