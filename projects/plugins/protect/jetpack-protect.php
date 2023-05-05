<?php
/**
 * Plugin Name: Jetpack Protect
 * Plugin URI: https://wordpress.org/plugins/jetpack-protect
 * Description: Security tools that keep your site safe and sound, from posts to plugins.
 * Version: 1.4.0
 * Author: Automattic - Jetpack Security team
 * Author URI: https://jetpack.com/protect/
 * License: GPLv2 or later
 * Text Domain: jetpack-protect
 *
 * @package automattic/jetpack-protect
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

define( 'JETPACK_PROTECT_VERSION', '1.4.0' );
define( 'JETPACK_PROTECT_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_PROTECT_ROOT_FILE', __FILE__ );
define( 'JETPACK_PROTECT_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_PROTECT_SLUG', 'jetpack-protect' );
define( 'JETPACK_PROTECT_NAME', 'Jetpack Protect' );
define( 'JETPACK_PROTECT_URI', 'https://jetpack.com/jetpack-protect' );
define( 'JETPACK_PROTECT_FOLDER', dirname( plugin_basename( __FILE__ ) ) );
define( 'JETPACK_PROTECT_BASE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_PROTECT_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_PROTECT_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Protect plugin', 'jetpack-protect' )
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
						__( 'Your installation of Jetpack Protect is incomplete. If you installed Jetpack Protect from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Protect must have Composer dependencies installed and built via the build command.', 'jetpack-protect' ),
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
add_action( 'activated_plugin', 'jetpack_protect_plugin_activation' );

/**
 * Redirects to plugin page when the plugin is activated
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 */
function jetpack_protect_plugin_activation( $plugin ) {
	if (
		JETPACK_PROTECT_ROOT_FILE_RELATIVE_PATH === $plugin &&
		\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( JETPACK_PROTECT_ROOT_FILE_RELATIVE_PATH )
	) {
		wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-protect' ) ) );
		exit;
	}
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . JETPACK_PROTECT_FOLDER . '/jetpack-protect.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-protect' ) ) . '">' . __( 'Dashboard', 'jetpack-protect' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_activation_hook( __FILE__, array( 'Jetpack_Protect', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack_Protect', 'plugin_deactivation' ) );

// Main plugin class.
new Jetpack_Protect();
