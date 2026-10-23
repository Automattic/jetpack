<?php
/**
 * Loads the WordPress.com GD image editor.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Returns the exiftool path, or '' when the host has none.
 *
 * @return string
 */
function jetpack_wpcom_exiftool_path() {
	$path = '';
	foreach ( array( '/usr/local/bin/exiftool', '/usr/bin/exiftool' ) as $candidate ) {
		if ( is_executable( $candidate ) ) {
			$path = $candidate;
			break;
		}
	}

	/**
	 * Filters the exiftool path. Return '' to skip the AI marker.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $path The exiftool path, or '' when the host has none.
	 */
	return apply_filters( 'jetpack_wpcom_exiftool_path', $path );
}

/**
 * Returns the c2patool path, or '' when the host has none.
 *
 * @return string
 */
function jetpack_wpcom_c2patool_path() {
	$path = defined( 'C2PATOOL' ) ? C2PATOOL : '/usr/local/bin/c2patool';
	if ( ! is_executable( $path ) ) {
		$path = '';
	}

	/**
	 * Filters the c2patool path. Return '' to skip the C2PA read.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $path The c2patool path, or '' when the host has none.
	 */
	return apply_filters( 'jetpack_wpcom_c2patool_path', $path );
}

/**
 * Swaps core's GD editor for the WordPress.com one.
 *
 * @param string[] $editors Image editor class names.
 * @return string[]
 */
function jetpack_wpcom_ai_marker_image_editors( $editors ) {
	$index = array_search( 'WP_Image_Editor_GD', $editors, true );
	if ( false === $index ) {
		return $editors;
	}

	// Other callers may apply this filter before core loads its editor classes.
	require_once ABSPATH . WPINC . '/class-wp-image-editor.php';
	require_once ABSPATH . WPINC . '/class-wp-image-editor-gd.php';
	require_once __DIR__ . '/class-jetpack-wpcom-image-editor-gd.php';
	$editors[ $index ] = 'Jetpack_WPCOM_Image_Editor_GD';

	return $editors;
}
add_filter( 'wp_image_editors', 'jetpack_wpcom_ai_marker_image_editors' );
