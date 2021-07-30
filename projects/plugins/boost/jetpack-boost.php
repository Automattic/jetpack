<?php
/**
 * Jetpack Boost Plugin
 *
 * @link              https://automattic.com
 * @since             0.1.0
 *
 * @wordpress-plugin
 * Plugin Name:       Jetpack Boost
 * Plugin URI:        https://jetpack.com/boost
 * Description:       Boost your WordPress site's performance, from the creators of Jetpack
 * Version: 1.1.1-alpha
 * Author:            Automattic
 * Author URI:        https://automattic.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       jetpack-boost
 * Domain Path:       /languages
 * Requires at least: 5.5
 * Requires PHP:      7.0
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost;

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'JETPACK_BOOST_VERSION', '1.1.1-alpha' );
define( 'JETPACK_BOOST_SLUG', 'jetpack-boost' );

if ( ! defined( 'JETPACK_BOOST_CLIENT_NAME' ) ) {
	define( 'JETPACK_BOOST_CLIENT_NAME', 'jetpack-boost-wp-plugin' );
}

define( 'JETPACK_BOOST_DIR_PATH', __DIR__ );
define( 'JETPACK_BOOST_PATH', __FILE__ );

if ( ! defined( 'JETPACK_BOOST_PLUGIN_BASE' ) ) {
	define( 'JETPACK_BOOST_PLUGIN_BASE', plugin_basename( __FILE__ ) );
}

if ( ! defined( 'JETPACK_BOOST_REST_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_REST_NAMESPACE', 'jetpack-boost/v1' );
}

// For use in situations where you want additional namespacing.
if ( ! defined( 'JETPACK_BOOST_REST_PREFIX' ) ) {
	define( 'JETPACK_BOOST_REST_PREFIX', '' );
}

if ( ! defined( 'JETPACK__WPCOM_JSON_API_BASE' ) ) {
	define( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
}

/**
 * Setup autoloading for Jetpack modules
 */
$packages_path = JETPACK_BOOST_DIR_PATH . '/vendor/autoload_packages.php';
if ( file_exists( $packages_path ) ) {
	require_once $packages_path;
}

/**
 * Setup Autoloading for Jetpack Boost
 */
require_once plugin_dir_path( __FILE__ ) . 'autoload-lib.php';

require plugin_dir_path( __FILE__ ) . 'app/class-jetpack-boost.php';

/**
 * Begins execution of the plugin.
 *
 * @since 0.1.0
 */
function run_jetpack_boost() {
	new Jetpack_Boost();
}

add_action( 'plugins_loaded', '\Automattic\Jetpack_Boost\run_jetpack_boost', 1 );

/**
 * Extra tweaks to make Jetpack Boost work better with others.
 */
function include_compatibility_files() {
	if ( class_exists( 'Jetpack' ) ) {
		require_once __DIR__ . '/compatibility/jetpack.php';
	}

	if ( class_exists( 'WooCommerce' ) ) {
		require_once __DIR__ . '/compatibility/woocommerce.php';
	}

	if ( class_exists( '\Google\Web_Stories\Plugin' ) ) {
		require_once __DIR__ . '/compatibility/web-stories.php';
	}
}

add_action( 'plugins_loaded', __NAMESPACE__ . '\include_compatibility_files' );

register_uninstall_hook( __FILE__, 'Automattic\Jetpack_Boost\jetpack_boost_uninstall' );
/**
 * Clean up when uninstalling Jetpack Boost
 */
function jetpack_boost_uninstall() {
	$boost = new Jetpack_Boost();
	$boost->uninstall();
}
