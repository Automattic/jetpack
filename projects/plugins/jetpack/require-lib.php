<?php
/**
 * File with a single function for loading library files.
 *
 * @package automattic/jetpack
 */

/**
 * Function for loading library files.
 *
 * @deprecated since 11.3 Load libraries directly (from `JETPACK__PLUGIN_DIR . '_inc/lib/'`) instead.
 *
 * @param string $slug Library slug.
 * @return void
 */
function jetpack_require_lib( $slug ) {
	static $loaded = array();

	if ( defined( 'ABSPATH' ) && ! defined( 'WP_CONTENT_DIR' ) ) {
		define( 'WP_CONTENT_DIR', ABSPATH . 'wp-content' ); // no trailing slash, full paths only - WP_CONTENT_URL is defined further down
	}

	$lib_dir = WP_CONTENT_DIR . '/lib';

	/**
	 * Filter the location of the library directory.
	 *
	 * @since 2.5.0
	 * @deprecated since 11.3
	 *
	 * @param string $lib_dir Path to the library directory.
	 */
	$lib_dir = apply_filters( 'jetpack_require_lib_dir', $lib_dir );

	$loaded_key = "{$lib_dir}{$slug}";
	if ( ! empty( $loaded[ $loaded_key ] ) ) {
		return;
	}

	$loaded[ $loaded_key ] = true;

	$file_name = "$lib_dir/$slug.php";
	if ( is_readable( $file_name ) ) {
		require_once $file_name;

		return;
	}

	$file_name = "$lib_dir/$slug/0-load.php";
	if ( is_readable( $file_name ) ) {
		require_once $file_name;

		return;
	}

	$basename  = basename( $slug );
	$file_name = "$lib_dir/$slug/$basename.php";
	require_once $file_name;
}
