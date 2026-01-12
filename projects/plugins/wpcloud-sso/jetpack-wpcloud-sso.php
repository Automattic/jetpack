<?php
/**
 *
 * Plugin Name: Jetpack_WPCloud_SSO
 * Description: Hack-n-slash plugin.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-wpcloud-sso
 *
 * @package automattic/jetpack-wpcloud-sso
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
along with this program; if not, see <https://www.gnu.org/licenses/>.
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'JETPACK_WPCLOUD_SSO_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_WPCLOUD_SSO_ROOT_FILE', __FILE__ );
define( 'JETPACK_WPCLOUD_SSO_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_WPCLOUD_SSO_SLUG', 'jetpack-wpcloud-sso' );
define( 'JETPACK_WPCLOUD_SSO_NAME', 'Jetpack_WPCloud_SSO' );
define( 'JETPACK_WPCLOUD_SSO_URI', 'https://jetpack.com/' );
define( 'JETPACK_WPCLOUD_SSO_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

/*
 * Autoloader check: This ensures the plugin doesn't fatal if activated before
 * `composer install` has been run. This is a common oversight during development
 * setup. The admin notice helps developers quickly identify the issue.
 */
$jetpack_autoloader = JETPACK_WPCLOUD_SSO_DIR . 'vendor/autoload_packages.php';

if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_WPCLOUD_SSO_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack WPCloud SSO plugin', 'jetpack-wpcloud-sso' )
		);
	}

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}

			$message = sprintf(
				wp_kses(
					/* translators: Placeholder is a link to a support document. */
					__( 'Your installation of Jetpack WPCloud SSO is incomplete. If you installed Jetpack WPCloud SSO from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack WPCloud SSO must have Composer dependencies installed and built via the build command.', 'jetpack-wpcloud-sso' ),
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

register_deactivation_hook( __FILE__, array( 'Jetpack_WPCloud_SSO', 'plugin_deactivation' ) );

// Main plugin class.
new Jetpack_WPCloud_SSO();
