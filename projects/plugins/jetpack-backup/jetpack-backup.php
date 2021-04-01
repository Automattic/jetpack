<?php
/**
 *
 * Plugin Name: Jetpack Backup
 * Plugin URI: https://jetpack.com/jetpack-backup
 * Description: Easily restore or download a backup of your site from a specific moment in time.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-backup
 *
 * @package automattic/jetpack-backup
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Constant definitions.
define( 'JETPACK_BACKUP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_BACKUP_PLUGIN_ROOT_FILE', __FILE__ );

// Main plugin class.
require_once JETPACK_BACKUP_PLUGIN_DIR . 'src/php/class-jetpack-backup.php';
new Jetpack_Backup();
