<?php
/**
 * Keeps the AI marker on images that WordPress.com sites edit.
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

/**
 * Whether client-side media processing is on: only then can the browser edit images.
 *
 * Gutenberg's check comes first: it decides whether Gutenberg's controller handles the edit, and its default differs from core's.
 *
 * @return bool
 */
function jetpack_wpcom_ai_marker_client_side_processing_enabled() {
	if ( function_exists( 'gutenberg_is_client_side_media_processing_enabled' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction -- From the Gutenberg plugin; guarded above.
		return gutenberg_is_client_side_media_processing_enabled();
	}

	// @phan-suppress-current-line UnusedPluginSuppression @phan-suppress-next-line PhanUndeclaredFunction -- Added in WordPress 7.1; guarded on the same line.
	return function_exists( 'wp_is_client_side_media_processing_enabled' ) && wp_is_client_side_media_processing_enabled();
}

/**
 * Watches a request that uploads an image edited in the browser, which the media endpoint creates with a parent_image.
 *
 * Server edits save through the GD editor, which already keeps the marker.
 *
 * @param WP_REST_Response|WP_HTTP_Response|WP_Error|mixed $response The response so far.
 * @param array                                            $handler  The route's handler.
 * @param WP_REST_Request                                  $request  The request.
 * @return WP_REST_Response|WP_HTTP_Response|WP_Error|mixed
 */
function jetpack_wpcom_ai_marker_watch_browser_edit( $response, $handler, $request ) {
	$callback = $handler['callback'] ?? null;
	if (
		is_wp_error( $response )
		|| empty( $request['parent_image'] )
		|| ! is_array( $callback )
		|| ! $callback[0] instanceof WP_REST_Attachments_Controller
		|| 'create_item' !== $callback[1]
		|| ! jetpack_wpcom_ai_marker_client_side_processing_enabled()
	) {
		return $response;
	}

	$mark   = null;
	$stop   = null;
	$unhook = static function () use ( &$mark, &$stop ) {
		remove_filter( 'wp_handle_upload', $mark, 9 );
		remove_filter( 'rest_request_after_callbacks', $stop );
	};

	// The request uploads 1 file, so unhook after it: a callback that throws skips rest_request_after_callbacks.
	$mark = static function ( $upload ) use ( $request, $unhook ) {
		$unhook();
		return jetpack_wpcom_ai_marker_mark_upload( $upload, (int) $request['parent_image'] );
	};
	// Before WordPress.com's log_upload(), which copies the file to file storage.
	add_filter( 'wp_handle_upload', $mark, 9 );

	// Another plugin may run a REST request of its own during the upload, so only this request stops the watch.
	$stop = static function ( $response, $handler, $done ) use ( $request, $unhook ) {
		if ( $done === $request ) {
			$unhook();
		}

		return $response;
	};
	add_filter( 'rest_request_after_callbacks', $stop, 10, 3 );

	return $response;
}
add_filter( 'rest_request_before_callbacks', 'jetpack_wpcom_ai_marker_watch_browser_edit', 10, 3 );

/**
 * Writes the AI type of the image it was edited from into an uploaded image, unless the upload already has an AI type.
 *
 * The browser drops C2PA, so a C2PA-only source would lose the marker.
 *
 * @param array $upload    The upload's file, url and type, or error.
 * @param int   $parent_id ID of the image the upload was edited from.
 * @return array
 */
function jetpack_wpcom_ai_marker_mark_upload( $upload, $parent_id ) {
	if ( ! empty( $upload['error'] ) || ! str_starts_with( $upload['type'] ?? '', 'image/' ) ) {
		return $upload;
	}

	// The marker is optional, so no error may stop the upload.
	try {
		// The media endpoint may not check parent_image.
		if ( ! current_user_can( 'edit_post', $parent_id ) ) {
			return $upload;
		}

		$source = wp_get_original_image_path( $parent_id );
		if ( ! $source ) {
			return $upload;
		}
		// Fall back to the URL when the file isn't on this host.
		if ( ! is_file( $source ) ) {
			/** This filter is documented in wp-admin/includes/image.php */
			$source = apply_filters( 'load_image_to_edit_attachmenturl', wp_get_original_image_url( $parent_id ), $parent_id, 'full' );
		}

		require_once __DIR__ . '/class-jetpack-wpcom-ai-marker.php';
		( new Jetpack_WPCOM_AI_Marker( 'image_editor_ai_marker' ) )->copy( $source, $upload['file'] );
	} catch ( Throwable $e ) {
		unset( $e );
	}

	return $upload;
}
