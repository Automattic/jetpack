<?php
/**
 * Loads the WordPress.com GD image editor.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

const JETPACK_WPCOM_AI_MARKER_FLAG = 'wpcom-ai-marker';

/**
 * Registers the feature flag.
 *
 * Runs as this file loads, so the flag is listed wherever flags are read or toggled.
 */
function jetpack_wpcom_ai_marker_register_flag() {
	Feature_Flags::register(
		JETPACK_WPCOM_AI_MARKER_FLAG,
		array(
			'default'     => true,
			'description' => 'Keep the AI marker in images WordPress.com edits or converts. Turn off to stop running exiftool and c2patool.',
			'owner'       => 'jetpack-mu-wpcom',
		)
	);
}
jetpack_wpcom_ai_marker_register_flag();

/**
 * Returns the path of exiftool or c2patool, or '' when the host has none.
 *
 * @param string $tool 'exiftool' or 'c2patool'.
 * @return string
 */
function jetpack_wpcom_ai_marker_tool_path( $tool ) {
	if ( ! Feature_Flags::is_enabled( JETPACK_WPCOM_AI_MARKER_FLAG ) ) {
		return '';
	}

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
 * Swaps core's GD editor for the WordPress.com one, when the host has exiftool.
 *
 * @param string[] $editors Image editor class names.
 * @return string[]
 */
function jetpack_wpcom_ai_marker_image_editors( $editors ) {
	$index = array_search( 'WP_Image_Editor_GD', $editors, true );
	if ( false === $index || '' === jetpack_wpcom_ai_marker_tool_path( 'exiftool' ) ) {
		return $editors;
	}

	require_once __DIR__ . '/class-jetpack-wpcom-image-editor-gd.php';
	$editors[ $index ] = 'Jetpack_WPCOM_Image_Editor_GD';

	return $editors;
}
add_filter( 'wp_image_editors', 'jetpack_wpcom_ai_marker_image_editors' );
