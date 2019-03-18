<?php


/**
 * Creates an array with all the *.php files under fusion sync. Scans synced directories recursively.
 */
function get_fusion_synced_files() {
	$jetpack_files = array();
	$result        = array();
	$jetpack_root  = '';
	$wpcom_root    = '';
	require ABSPATH . '/bin/jetpack/build-plugin-files.php';

	foreach ( array_values( $jetpack_files ) as $file_path ) {
		if ( is_dir( $file_path ) ) {
			$out = array();
			exec( 'find '. ABSPATH . $file_path .' -name "*.php"', $out );
			if ( ! empty( $out ) ) {
				$out = array_map( function( $path ) { return $path; }, $out );
				array_merge( $result, $out );
			}
		} else if ( strpos( $file_path, '.php' ) !== false ) {
			array_push( $result, $file_path );
		}
	}
	return $result;
}

/**
 * Requires all the files in array.
 */
function require_files( $files ) {
	foreach ( $files as $file ) {
		require_once ABSPATH . $file;
	}
}

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

	print_r( "!!!!!!!!!!\n" );
	print_r( $path );
	print_r( "!!!!!!!!!!\n" );

	return new WP_REST_Request( $method, $path );
}
