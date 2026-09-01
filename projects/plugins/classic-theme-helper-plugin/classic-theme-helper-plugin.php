<?php
/**
 *
 * Plugin Name: Classic Theme Helper Plugin
 * Plugin URI: https://jetpack.com/
 * Description: Features for classic themes.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: classic-theme-helper-plugin
 *
 * @package automattic/classic-theme-helper-plugin
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

define( 'CLASSIC_THEME_HELPER_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CLASSIC_THEME_HELPER_PLUGIN_ROOT_FILE', __FILE__ );
define( 'CLASSIC_THEME_HELPER_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'CLASSIC_THEME_HELPER_PLUGIN_SLUG', 'classic-theme-helper-plugin' );
define( 'CLASSIC_THEME_HELPER_PLUGIN_NAME', 'Classic Theme Helper Plugin' );
define( 'CLASSIC_THEME_HELPER_PLUGIN_URI', 'https://jetpack.com' );
define( 'CLASSIC_THEME_HELPER_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

/*
 * Autoloader check: This ensures the plugin doesn't fatal if activated before
 * `composer install` has been run. This is a common oversight during development
 * setup. The admin notice helps developers quickly identify the issue.
 */
$jetpack_autoloader = CLASSIC_THEME_HELPER_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( CLASSIC_THEME_HELPER_PLUGIN_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Classic Theme Helper Plugin', 'classic-theme-helper-plugin' )
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
					__( 'Your installation of Classic Theme Helper Plugin is incomplete. If you installed Classic Theme Helper Plugin from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Classic Theme Helper Plugin must have Composer dependencies installed and built via the build command.', 'classic-theme-helper-plugin' ),
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
	'plugin_action_links_' . CLASSIC_THEME_HELPER_PLUGIN_FOLDER . '/classic-theme-helper-plugin.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=classic-theme-helper-plugin' ) ) . '">' . __( 'Settings', 'classic-theme-helper-plugin' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

	// Init Jetpack packages that are hooked into plugins_loaded.
	add_action( 'plugins_loaded', 'init_packages_plugins_loaded', 1 );

	/**
	 * Configure what Jetpack packages should get automatically initialized, using the plugins_loaded hook.
	 *
	 * @return void
	 */
function init_packages_plugins_loaded() {
	if ( class_exists( 'Automattic\Jetpack\Classic_Theme_Helper\Main' ) ) {
		Automattic\Jetpack\Classic_Theme_Helper\Main::init();
	}
	if ( class_exists( 'Automattic\Jetpack\Classic_Theme_Helper\Featured_Content' ) ) {
		Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::setup();
	}
}

	// Init Jetpack packages that are hooked into init.
	add_action( 'init', 'init_packages_init', 30 );

	/**
	 * Configure what Jetpack packages should get automatically initialized, using the init hook.
	 *
	 * @return void
	 */
function init_packages_init() {
	if ( class_exists( 'Automattic\Jetpack\Classic_Theme_Helper\Social_Links' ) ) {
		new Automattic\Jetpack\Classic_Theme_Helper\Social_Links();
	}
}
