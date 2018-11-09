<?php

/*
 * Loader for WP REST API endpoints that are synced with WP.com.
 *
 * On WP.com see:
 *  - wp-content/mu-plugins/rest-api.php
 *  - wp-content/rest-api-plugins/jetpack-endpoints/
 */

function wpcom_rest_api_v2_load_plugin_files( $file_pattern ) {
	$plugins = glob( dirname( __FILE__ ) . '/' . $file_pattern );

	if ( ! is_array( $plugins ) ) {
		return;
	}

	foreach ( array_filter( $plugins, 'is_file' ) as $plugin ) {
		require_once $plugin;
	}
}

// API v2 plugins: define a class, then call this function.
function wpcom_rest_api_v2_load_plugin( $class_name ) {
	global $wpcom_rest_api_v2_plugins;

	if ( ! isset( $wpcom_rest_api_v2_plugins ) ) {
		$_GLOBALS['wpcom_rest_api_v2_plugins'] = $wpcom_rest_api_v2_plugins = array();
	}

	if ( ! isset( $wpcom_rest_api_v2_plugins[ $class_name ] ) ) {
		$wpcom_rest_api_v2_plugins[ $class_name ] = new $class_name;
	}
}

function wpcom_rest_api_v2_register_routes() {
	global $wpcom_rest_api_v2_plugins;

	foreach ( $wpcom_rest_api_v2_plugins as $maybe_controller ) {
		if ( is_subclass_of( $maybe_controller, 'WP_REST_Controller' ) ) {
			$maybe_controller->register_routes();
		}

		if ( is_subclass_of( $maybe_controller, 'WPCOM_REST_API_V2_Field_Controller' ) ) {
			$maybe_controller->register_fields();
		}
	}
}

require dirname( __FILE__ ) . '/class-wpcom-rest-field-controller.php';

// Now load the endpoint files.
wpcom_rest_api_v2_load_plugin_files( 'wpcom-endpoints/*.php' );
wpcom_rest_api_v2_load_plugin_files( 'wpcom-fields/*.php' );

add_action( 'rest_api_init', 'wpcom_rest_api_v2_register_routes' );
