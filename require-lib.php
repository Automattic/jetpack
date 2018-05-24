<?php

function require_lib_from_dir( $slug, $lib_dir ) {
	if ( !preg_match( '|^[a-z0-9/_.-]+$|i', $slug ) ) {
		trigger_error( "Cannot load a library with invalid slug $slug.", E_USER_ERROR );
		return;
	}
	$basename = basename( $slug );

	/**
	 * Filter the location of the library directory.
	 *
	 * @since 2.5.0
	 *
	 * @param string $lib_dir Path to the library directory.
	 */
	$lib_dir = apply_filters( 'jetpack_require_lib_dir', $lib_dir );
	$choices = array(
		"$lib_dir/$slug.php",
		"$lib_dir/$slug/0-load.php",
		"$lib_dir/$slug/$basename.php",
	);
	foreach( $choices as $file_name ) {
		if ( is_readable( $file_name ) ) {
			require_once $file_name;
			return;
		}
	}
	trigger_error( "Cannot find a library with slug $slug.", E_USER_ERROR );
}

function require_lib( $slug ) {
   if ( defined( 'ABSPATH' ) && ! defined( 'WP_CONTENT_DIR' ) ) {
       define( 'WP_CONTENT_DIR', ABSPATH . 'wp-content' ); // no trailing slash, full paths only - WP_CONTENT_URL is defined further down
   }

   require_lib_from_dir( $slug, WP_CONTENT_DIR . '/lib' );
}

function jetpack_require_lib( $slug ) {
   require_lib_from_dir( $slug, JETPACK__PLUGIN_DIR . '/_inc/lib' );
}
