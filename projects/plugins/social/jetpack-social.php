<?php
/**
 *
 * Plugin Name: Jetpack Social
 * Plugin URI: https://wordpress.org/plugins/jetpack-social
 * Description: Share your site’s posts on several social media networks automatically when you publish a new post.
 * Version: 4.5.2-alpha
 * Author: Automattic - Jetpack Social team
 * Author URI: https://jetpack.com/social/
 * License: GPLv2 or later
 * Text Domain: jetpack-social
 *
 * @package automattic/jetpack-social
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

define( 'JETPACK_SOCIAL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_SOCIAL_PLUGIN_ROOT_FILE', __FILE__ );
define( 'JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_SOCIAL_PLUGIN_SLUG', 'jetpack-social' );
define( 'JETPACK_SOCIAL_PLUGIN_NAME', 'Jetpack Social' );
define( 'JETPACK_SOCIAL_PLUGIN_URI', 'https://jetpack.com/jetpack-social' );
define( 'JETPACK_SOCIAL_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_SOCIAL_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_SOCIAL_PLUGIN_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Social plugin', 'jetpack-social' )
		);
	}

	// Add a red bubble notification to My Jetpack if the installation is bad.
	add_filter(
		'my_jetpack_red_bubble_notification_slugs',
		function ( $slugs ) {
			$slugs['jetpack-social-plugin-bad-installation'] = array(
				'data' => array(
					'plugin' => 'Jetpack Social',
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

			$message = sprintf(
				wp_kses(
					/* translators: Placeholder is a link to a support document. */
					__( 'Your installation of Jetpack Social is incomplete. If you installed Jetpack Social from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Social must have Composer dependencies installed and built via the build command.', 'jetpack-social' ),
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

register_activation_hook( JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH, array( 'Jetpack_Social', 'plugin_activation' ) );

// Main plugin class.
new Jetpack_Social();
