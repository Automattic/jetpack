<?php
/**
 *
 * Plugin Name: Classic Theme Helper plugin
 * Plugin URI: TBD
 * Description: Features for classic themes.
 * Version: 0.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack
 *
 * @package automattic/classic-theme-plugin
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

define( 'CLASSIC_THEME_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CLASSIC_THEME_PLUGIN_ROOT_FILE', __FILE__ );
define( 'CLASSIC_THEME_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'CLASSIC_THEME_PLUGIN_SLUG', 'classic-theme-helper-plugin' );
define( 'CLASSIC_THEME_PLUGIN_NAME', 'Classic Theme Helper' );
define( 'CLASSIC_THEME_PLUGIN_URI', 'https://jetpack.com' );
define( 'CLASSIC_THEME_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = CLASSIC_THEME_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( CLASSIC_THEME_PLUGIN_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Classic Theme Helper plugin', 'classic-theme-helper-plugin' )
		);
	}
	return;
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . CLASSIC_THEME_PLUGIN_FOLDER . '/classic-theme-helper-plugin.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=classic-theme-helper-plugin' ) ) . '">' . __( 'Settings', 'classic-theme-helper-plugin' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_deactivation_hook( __FILE__, array( 'Classic_Theme_Helper_Plugin', 'plugin_deactivation' ) );

// Main plugin class.
new Classic_Theme_Helper_Plugin();
