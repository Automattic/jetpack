<?php
/**
 * The client-example plugin bootstrap file.
 *
 * @link              https://automattic.com
 * @package           Client_Example
 *
 * @wordpress-plugin
 * Plugin Name:       Jetpack Client Example
 * Plugin URI:        https://jetpack.com
 * Description:       This is a short description of what the plugin does. It's displayed in the WordPress admin area.
 * Version:           2.0.0
 * Author:            Automattic
 * Author URI:        https://automattic.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       client-example
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

/**
 * The code that runs during plugin activation.
 */
function activate_client_example() {
}

/**
 * The code that runs during plugin deactivation.
 */
function deactivate_client_example() {
}

register_activation_hook( __FILE__, 'activate_client_example' );
register_deactivation_hook( __FILE__, 'deactivate_client_example' );

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    2.0.0
 */
function start_client_example() {

	// Here we enable the Jetpack packages.
	$config = new Config();
	$config->ensure(
		'connection',
		array(
			'slug'     => 'client-example',
			'name'     => 'Jetpack Client Example plugin',
			'url_info' => 'https://github.com/Automattic/jetpack'
		)
	);
}

add_action( 'plugins_loaded', 'start_client_example' );
