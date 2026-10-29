<?php
/**
 * Keeps the AI marker on images that WordPress.com sites edit.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Returns the path of exiftool or c2patool, or '' when the host has none.
 *
 * @param string $tool 'exiftool' or 'c2patool'.
 * @return string
 */
function jetpack_wpcom_ai_marker_tool_path( $tool ) {
	$candidates = 'c2patool' === $tool
		? array( defined( 'C2PATOOL' ) ? C2PATOOL : '/usr/local/bin/c2patool' )
		: array( '/usr/local/bin/exiftool', '/usr/bin/exiftool' );

	$path = '';
	foreach ( $candidates as $candidate ) {
		if ( is_executable( $candidate ) ) {
			$path = $candidate;
			break;
		}
	}

	/**
	 * Filters the path of exiftool or c2patool. Return '' to skip that tool.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $path The tool's path, or '' when the host has none.
	 * @param string $tool 'exiftool' or 'c2patool'.
	 */
	return apply_filters( 'jetpack_wpcom_ai_marker_tool_path', $path, $tool );
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

	require_once __DIR__ . '/class-jetpack-wpcom-image-editor-gd.php';
	$editors[ $index ] = 'Jetpack_WPCOM_Image_Editor_GD';

	return $editors;
}
add_filter( 'wp_image_editors', 'jetpack_wpcom_ai_marker_image_editors' );

/**
 * Writes the source's AI marker into an edited image that has none.
 *
 * Browser edits drop C2PA, so a C2PA-only source would lose the marker.
 *
 * @param array $metadata      Metadata of the edited image.
 * @param int   $attachment_id ID of the edited image.
 * @param int   $parent_id     ID of the image it was edited from.
 * @return array
 */
function jetpack_wpcom_ai_marker_edited_image_metadata( $metadata, $attachment_id, $parent_id ) {
	$edited = get_attached_file( $attachment_id );
	$source = wp_get_original_image_path( $parent_id );
	if ( ! $source || ! is_file( $edited ) ) {
		return $metadata;
	}
	// Fall back to the URL when the file isn't on this host.
	if ( ! is_file( $source ) ) {
		/** This filter is documented in wp-admin/includes/image.php */
		$source = apply_filters( 'load_image_to_edit_attachmenturl', wp_get_original_image_url( $parent_id ), $parent_id, 'full' );
	}

	require_once __DIR__ . '/class-jetpack-wpcom-image-editor-gd.php';
	if ( Jetpack_WPCOM_Image_Editor_GD::copy_digital_source_type( $source, $edited ) ) {
		$metadata['filesize'] = wp_filesize( $edited );

		// Simple sites copy uploads to file storage, so copy the changed file. It already counts toward disk usage.
		if ( function_exists( 'log_upload' ) ) {
			log_upload(
				array(
					'file' => $edited,
					'type' => get_post_mime_type( $attachment_id ),
				),
				false
			);
		}
	}

	return $metadata;
}
add_filter( 'wp_edited_image_metadata', 'jetpack_wpcom_ai_marker_edited_image_metadata', 10, 3 );
