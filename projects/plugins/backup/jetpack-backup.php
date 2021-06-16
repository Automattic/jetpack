<?php
/**
 *
 * Plugin Name: Jetpack Backup
 * Plugin URI: https://jetpack.com/jetpack-backup
 * Description: Easily restore or download a backup of your site from a specific moment in time.
 * Version: 0.1.1-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-backup
 *
 * @package automattic/jetpack-backup
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
define( 'JETPACK_BACKUP_PLUGIN_ROOT_FILE', __FILE__ );
define( 'JETPACK_BACKUP_PLUGIN_SLUG', 'jetpack-backup' );
define( 'JETPACK_BACKUP_PLUGIN_NAME', 'Jetpack Backup' );
define( 'JETPACK_BACKUP_PLUGIN_URI', 'https://jetpack.com/jetpack-backup' );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_BACKUP_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Backup plugin', 'jetpack-backup' )
		);
	}
	exit;
}

// Main plugin class.
new Jetpack_Backup();
