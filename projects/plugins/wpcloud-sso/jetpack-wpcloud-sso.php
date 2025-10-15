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
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
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

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_WPCLOUD_SSO_DIR . 'vendor/autoload_packages.php';

if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_WPCLOUD_SSO_DIR . 'jetpack_vendor/i18n-map.php' );
	}
}

register_deactivation_hook( __FILE__, array( 'Jetpack_WPCloud_SSO', 'plugin_deactivation' ) );

// Main plugin class.
new Jetpack_WPCloud_SSO();
