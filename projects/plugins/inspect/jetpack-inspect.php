<?php
/**
 * Jetpack Inspect plugin
 *
 * @link              https://automattic.com
 * @since             0.1.0
 *
 * @wordpress-plugin
 * Plugin Name: Jetpack Inspect
 * Version: 0.1.0-alpha
 * Plugin URI: https://automattic.com
 * Description: Inspect HTTP incoming and outgoing requests and responses.
 * Author: pyronaur
 * Author URI: https://automattic.com
 * Requires at least: 6.0
 * Text Domain: jetpack-inspect
 *
 * @package automattic/jetpack-inspect
 */

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack_Inspect\Admin_Page;
use Automattic\Jetpack_Inspect\Log;
use Automattic\Jetpack_Inspect\Monitors;
use Automattic\Jetpack_Inspect\REST_API\Endpoints\Clear;
use Automattic\Jetpack_Inspect\REST_API\Endpoints\Latest;
use Automattic\Jetpack_Inspect\REST_API\Endpoints\Send_Request;
use Automattic\Jetpack_Inspect\REST_API\Endpoints\Test_Request;
use Automattic\Jetpack_Inspect\REST_API\REST_API;

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
	\Automattic\Jetpack\Assets::alias_textdomains_from_file( plugin_dir_path( __FILE__ ) . 'jetpack_vendor/i18n-map.php' );
}

require __DIR__ . '/functions.php';
require __DIR__ . '/options.php';

/**
 * Enables Jetpack Connection support.
 */
function jetpack_inspect_connection() {

	// Here we enable the Jetpack packages.
	$config = new Config();
	$config->ensure(
		'connection',
		array(
			'slug' => 'jetpack-inspect',
			'name' => 'Jetpack Inspect',
		)
	);
}

/**
 * Attempts Jetpack Connection.
 */
function jetpack_inspect_attempt_connection() {
	$manager = new Manager( 'jetpack-inspect' );
	if ( ! $manager->is_connected() ) {
		$manager->try_registration();
	}
}

/**
 * Enables Jetpack Inspect custom post type and a special REST API endpoint.
 */
function jetpack_inspect_initialize() {
	Log::register_post_type();
	REST_API::register(
		array(
			Latest::class,
			Clear::class,
			Send_Request::class,
		)
	);

	if ( defined( 'JETPACK_INSPECT_DEBUG' ) && JETPACK_INSPECT_DEBUG ) {
		REST_API::register( Test_Request::class );
	}
}

add_action( 'init', 'jetpack_inspect_initialize' );
add_action( 'admin_menu', array( new Admin_Page(), 'register' ) );
add_action( 'plugins_loaded', array( Monitors::class, 'initialize' ) );

// Jetpack Connection.
add_action( 'plugins_loaded', 'jetpack_inspect_connection', 1 );
add_action( 'admin_init', 'jetpack_inspect_attempt_connection' );
