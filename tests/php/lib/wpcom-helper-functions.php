<?php

/**
 * `require_once` a fusion-synced file. To be used in synced test files.
 */
function require_jetpack_file( $jetpack_file_path ) {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists('get_wpcom_path_of_jetpack_file') ) {
		require_once ABSPATH . get_wpcom_path_of_jetpack_file( $jetpack_file_path );
	} else {
		require_once JETPACK__PLUGIN_DIR . $jetpack_file_path;
	}
}

/**
 * Wrapper around `WP_REST_Request` constructor. Injects a `sites/$blog_id` into endpoint string for WPCOM environment
 */
function wp_rest_request( $method, $path ) {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$namespace = substr( $path, 0, 10 ); // e.g. `/wpcom/v2/`
		$endpoint = substr( $path, 9 ); // e.g. `/service-api-keys/mapbox`
		$path = $namespace . 'sites/'  . get_current_blog_id() . $endpoint;
	}

	return new WP_REST_Request( $method, $path );
}
