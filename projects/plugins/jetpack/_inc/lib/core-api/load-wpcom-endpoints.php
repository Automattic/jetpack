<?php
/**
 * Loader for WP REST API endpoints that are synced with WP.com.
 *
 * On WP.com see:
 *  - wp-content/mu-plugins/rest-api.php
 *  - wp-content/rest-api-plugins/jetpack-endpoints/
 *
 * @package automattic/jetpack
 */

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Loop through endpoint files and load them.
 *
 * @param string $file_pattern Path pattern to the endpoints (pattern must be supported by glob()).
 */
function wpcom_rest_api_v2_load_plugin_files( $file_pattern ) {
	$plugins = glob( __DIR__ . '/' . $file_pattern );

	if ( ! is_array( $plugins ) ) {
		return;
	}

	foreach ( array_filter( $plugins, 'is_file' ) as $plugin ) {
		require_once $plugin;
	}
}

/**
 * API v2 plugins: define a class, then call this function.
 *
 * @param string $class_name The name of the class to load.
 */
function wpcom_rest_api_v2_load_plugin( $class_name ) {
	global $wpcom_rest_api_v2_plugins;

	if ( ! isset( $wpcom_rest_api_v2_plugins ) ) {
		$wpcom_rest_api_v2_plugins = array();
	}

	if ( ! isset( $wpcom_rest_api_v2_plugins[ $class_name ] ) ) {
		$wpcom_rest_api_v2_plugins[ $class_name ] = new $class_name();
	}
}

require __DIR__ . '/class-wpcom-rest-field-controller.php';

/**
 * Load the REST API v2 plugin files.
 *
 * Hooked to `rest_api_init` (priority 5) so the ~37 endpoint class files only
 * load on REST requests, not on every front-end page. Priority 5 ensures the
 * loader runs before constructors register their own `register_routes` callbacks
 * at the default priority 10 within the same `rest_api_init` action.
 */
function load_wpcom_rest_api_v2_plugin_files() {
	wpcom_rest_api_v2_load_plugin_files( 'wpcom-endpoints/*.php' );
	wpcom_rest_api_v2_load_plugin_files( 'wpcom-fields/*.php' );
}
add_action( 'rest_api_init', 'load_wpcom_rest_api_v2_plugin_files', 5 );

// In the PHPUnit test suite, fire the loader during `plugins_loaded` so all 37 endpoint
// classes are defined before PHPUnit performs test discovery. Test files use
// `#[CoversClass( WPCOM_REST_API_V2_Endpoint_*::class )]` attributes that PHPUnit eagerly
// reflects, requiring the classes to be loadable at that moment.
if ( defined( 'PHPUNIT_JETPACK_TESTSUITE' ) && PHPUNIT_JETPACK_TESTSUITE ) {
	add_action( 'plugins_loaded', 'load_wpcom_rest_api_v2_plugin_files' );
}
