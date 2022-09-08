<?php
/**
 *
 * Plugin Name: Jetpack Backup
 * Plugin URI: https://jetpack.com/jetpack-backup
 * Description: Easily restore or download a backup of your site from a specific moment in time.
 * Version: 1.4.1
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-backup
 *
 * @package automattic/jetpack-backup-plugin
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

// Constant definitions.
define( 'JETPACK_BACKUP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_BACKUP_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_BACKUP_REQUIRED_JETPACK_VERSION', '10.0' );
define( 'JETPACK_BACKUP_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

/**
 * Checks if Jetpack is installed and if yes, require version 10+
 * Can be extended to check for various system requiremens, such as WP or PHP version.
 *
 * @return bool|WP_Error True if system requirements are met, WP_Error if not.
 */
function jetpack_backup_requirements_check() {
	require_once ABSPATH . '/wp-admin/includes/plugin.php'; // to get is_plugin_active() early.

	if ( ! is_plugin_active( 'jetpack/jetpack.php' ) ) {
		return true;
	}

	$jetpack_plugin_data = get_plugin_data( WP_PLUGIN_DIR . '/jetpack/jetpack.php', false, false );

	if ( version_compare( $jetpack_plugin_data['Version'], JETPACK_BACKUP_REQUIRED_JETPACK_VERSION, '<' ) ) {
		return new WP_Error(
			'incompatible_jetpack_version',
			__( 'The Jetpack Backup plugin requires version 10 or higher of the Jetpack plugin. Please update your Jetpack plugin to continue.', 'jetpack-backup' )
		);
	}
	return true;
}

$jetpack_backup_meets_requirements = jetpack_backup_requirements_check();
if ( is_wp_error( $jetpack_backup_meets_requirements ) ) {
	add_action(
		'admin_notices',
		function () use ( $jetpack_backup_meets_requirements ) {
			?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				echo esc_html( $jetpack_backup_meets_requirements->get_error_message() );
				?>
			</p>
		</div>
			<?php
		}
	);

	return;
}

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_BACKUP_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_BACKUP_PLUGIN_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Backup plugin', 'jetpack-backup' )
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
						__( 'Your installation of Jetpack Backup is incomplete. If you installed Jetpack Backup from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Backup must have Composer dependencies installed and built via the build command.', 'jetpack-backup' ),
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
add_action( 'activated_plugin', 'jetpack_backup_plugin_activation' );

/**
 * Redirects to plugin page when the plugin is activated
 *
 * @access public
 * @static
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 */
function jetpack_backup_plugin_activation( $plugin ) {
	if (
		JETPACK_BACKUP_PLUGIN_ROOT_FILE_RELATIVE_PATH === $plugin &&
		\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( JETPACK_BACKUP_PLUGIN_ROOT_FILE_RELATIVE_PATH )
	) {
		wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-backup' ) ) );
		exit;
	}
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . JETPACK_BACKUP_PLUGIN_FOLDER . '/jetpack-backup.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-backup' ) ) . '">' . __( 'Settings', 'jetpack-backup' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_deactivation_hook( __FILE__, array( 'Jetpack_Backup', 'plugin_deactivation' ) );

// Main plugin class.
Jetpack_Backup::initialize();
