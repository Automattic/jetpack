<?php
/**
 *
 * Plugin Name: Backups
 * Plugin URI: https://jetpack.com/backups
 * Description: Easily restore or download a backup of your site from a specific moment in time.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: backups
 *
 * @package automattic/backups
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Constant definitions.
define( 'BACKUPS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'BACKUPS_PLUGIN_ROOT_FILE', __FILE__ );

// Jetpack Autoloader.
$jetpack_autoloader = BACKUPS_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Backups plugin', 'backups' )
		);
	}
	exit;
}

// Main plugin class.
new Backups();
