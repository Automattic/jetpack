<?php
/**
 * Jetpack Boost Loader
 *
 * @package automattic/jetpack
 */

add_action( 'plugins_loaded', 'jetpack_boost_loader', 0 );

/**
 * Load Jetpack Boost if it's not installed as a separate plugin.
 */
function jetpack_boost_loader() {
	if ( ! defined( 'JETPACK_BOOST_VERSION' ) ) {
		// Load Jetpack Boost from the vendor directory.

		if ( ! defined( 'JETPACK_BOOST_DIR_PATH' ) ) {
			define( 'JETPACK_BOOST_DIR_PATH', plugin_dir_path( __FILE__ ) . 'vendor/automattic/jetpack-boost' );
		}

		if ( ! defined( 'JETPACK_BOOST_PATH' ) ) {
			define( 'JETPACK_BOOST_PATH', JETPACK_BOOST_DIR_PATH . '/jetpack-boost.php' );
		}

		if ( ! defined( 'JETPACK_BOOST_PLUGIN_BASE' ) ) {
			define( 'JETPACK_BOOST_PLUGIN_BASE', plugin_basename( JETPACK_BOOST_PATH ) );
		}

		if ( ! defined( 'JETPACK_BOOST_PLUGIN_FILENAME' ) ) {
			define( 'JETPACK_BOOST_PLUGIN_FILENAME', basename( JETPACK_BOOST_PATH ) );
		}

		if ( ! defined( 'JETPACK_BOOST_PLUGINS_DIR_URL' ) ) {
			define( 'JETPACK_BOOST_PLUGINS_DIR_URL', plugin_dir_url( JETPACK_BOOST_PATH ) );
		}

		require_once JETPACK_BOOST_DIR_PATH . '/jetpack-boost.php';
		define( 'BOOST_LOADED_FROM_JETPACK', true );
	}
}
