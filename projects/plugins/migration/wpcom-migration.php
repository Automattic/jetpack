<?php
/**
 *
 * Plugin Name: Move to WordPress.com
 * Plugin URI: https://wordpress.org/plugins/wpcom-migration
 * Description: A WordPress plugin that helps users to migrate their sites to WordPress.com.
 * Version: 2.1.0-alpha
 * Author: Automattic
 * Author URI: https://wordpress.com/
 * License: GPLv2 or later
 * Text Domain: wpcom-migration
 *
 * @package automattic/wpcom-migration
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

define( 'WPCOM_MIGRATION_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPCOM_MIGRATION_ROOT_FILE', __FILE__ );
define( 'WPCOM_MIGRATION_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'WPCOM_MIGRATION_SLUG', 'wpcom-migration' );
define( 'WPCOM_MIGRATION_NAME', 'Move to WordPress.com' );
define( 'WPCOM_MIGRATION_URI', 'https://wordpress.com/' );
define( 'WPCOM_MIGRATION_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = WPCOM_MIGRATION_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( WPCOM_MIGRATION_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Move to WordPress.com plugin', 'wpcom-migration' )
		);
	}

	// Add a red bubble notification to My Jetpack if the installation is bad.
	add_filter(
		'my_jetpack_red_bubble_notification_slugs',
		function ( $slugs ) {
			$slugs['move-to-wordpress-plugin-bad-installation'] = array(
				'data' => array(
					'plugin' => 'Move to WordPress.com',
				),
			);

			return $slugs;
		}
	);

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}
			?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Move to WordPress.com is incomplete. If you installed Move to WordPress.com from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Move to WordPress.com must have Composer dependencies installed and built via the build command.', 'wpcom-migration' ),
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
add_action( 'activated_plugin', 'wpcom_migration_activation' );

/**
 * Redirects to plugin page when the plugin is activated
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 */
function wpcom_migration_activation( $plugin ) {
	if (
		WPCOM_MIGRATION_ROOT_FILE_RELATIVE_PATH === $plugin &&
		\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( WPCOM_MIGRATION_ROOT_FILE_RELATIVE_PATH )
	) {
		wp_safe_redirect( esc_url( admin_url( 'admin.php?page=wpcom-migration' ) ) );
		exit;
	}
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . WPCOM_MIGRATION_FOLDER . '/wpcom-migration.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=wpcom-migration' ) ) . '">' . __( 'Settings', 'wpcom-migration' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_deactivation_hook( __FILE__, array( \Automattic\Jetpack\Migration\WPCOM_Migration::class, 'plugin_deactivation' ) );

// Main plugin class.
new \Automattic\Jetpack\Migration\WPCOM_Migration();
