<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );
define( 'JETPACK_ENABLE_MY_JETPACK', true );

\WorDBless\Load::load();

// set up mock plugin.
$plugin_dir = WP_PLUGIN_DIR . '/boost';
if ( ! file_exists( $plugin_dir ) ) {
	mkdir( $plugin_dir, 0777, true );
}
copy( __DIR__ . '/assets/boost-mock-plugin.txt', $plugin_dir . '/jetpack-boost.php' );
