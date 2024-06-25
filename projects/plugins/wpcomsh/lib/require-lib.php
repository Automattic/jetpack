<?php
/**
 * Implementation of wpcom's `require_lib()` function.
 *
 * @package wpcomsh
 */

/**
 * Require library helper function
 *
 * @param mixed $slug Slug of library.
 * @return void
 */
function require_lib( $slug ) {
	if ( ! preg_match( '|^[a-z0-9/_.-]+$|i', $slug ) ) {
		return;
	}

	$basename = basename( $slug );

	$lib_dir = __DIR__;

	/**
	 * Filter the location of the library directory.
	 *
	 * @since 2.5.0
	 *
	 * @param string $lib_dir Path to the library directory.
	 */
	$lib_dir = apply_filters( 'require_lib_dir', $lib_dir );

	$choices = array(
		"$lib_dir/$slug.php",
		"$lib_dir/$slug/0-load.php",
		"$lib_dir/$slug/$basename.php",
	);
	foreach ( $choices as $file_name ) {
		if ( is_readable( $file_name ) ) {
			require_once $file_name;
			return;
		}
	}
}
