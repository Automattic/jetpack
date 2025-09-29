<?php
/**
 * Plugin Name: Media Editor
 * Plugin URI: https://jetpack.com
 * Description: Advanced media editing capabilities with AI-powered features.
 * Version: 0.1.0
 * Author: Automattic
 * Author URI: https://jetpack.com
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: media-editor
 * Domain Path: /languages
 * Requires at least: 6.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: true
 *
 * @package automattic/media-editor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MEDIA_EDITOR_VERSION', '0.1.0' );
define( 'MEDIA_EDITOR_PLUGIN_FILE', __FILE__ );
define( 'MEDIA_EDITOR_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MEDIA_EDITOR_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Jetpack autoloader.
$jetpack_autoloader = MEDIA_EDITOR_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
}

// Plugin initialization.
if ( ! file_exists( MEDIA_EDITOR_PLUGIN_DIR . 'src/php/class-media-editor.php' ) ) {
	error_log( 'Media Editor Error: Class file not found at ' . MEDIA_EDITOR_PLUGIN_DIR . 'src/php/class-media-editor.php' );
	return;
}
require_once MEDIA_EDITOR_PLUGIN_DIR . 'src/php/class-media-editor.php';

// Initialize the plugin.
add_action( 'plugins_loaded', array( 'Media_Editor', 'init' ) );