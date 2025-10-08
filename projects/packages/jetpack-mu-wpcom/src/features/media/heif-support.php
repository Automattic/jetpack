<?php
/**
 * HEIF/HEIF support for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-plugins
 */

/**
 * Convert HEIF/HEIC uploads to JPEG.
 *
 * @param string $filename Path to the file.
 * @return bool True if the file was converted, false otherwise.
 */
function jetpack_wpcom_maybe_convert_heif_to_jpg( $filename ) {
	if ( ! class_exists( 'Photon_OpenCV' ) ) {
		return false;
	}

	if ( empty( $filename ) ) {
		jetpack_wpcom_maybe_log_heif_to_jpg(
			array(
				'message'  => 'file path is empty',
				'severity' => 'error',
			)
		);
		return false;
	}

	if ( ! file_exists( $filename ) ) {
		jetpack_wpcom_maybe_log_heif_to_jpg(
			array(
				'message'  => sprintf( 'file does not exist: %s', $filename ),
				'severity' => 'error',
			)
		);
		return false;
	}

	$valid_magic_bytes = array(
		'ftypheic',
		'ftypheix',
		'ftyphevc',
		'ftypheim',
		'ftypheis',
		'ftyphevm',
		'ftyphevs',
		'ftypmif1',
		'ftypmsf1',
	);

	// Read the first 8 bytes of the file.
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$magic_bytes = file_get_contents( $filename, false, null, 4, 8 );
	if ( false === in_array( $magic_bytes, $valid_magic_bytes, true ) ) {
		return false;
	}

	// Log that we found a HEIF image.
	jetpack_wpcom_maybe_log_heif_to_jpg(
		array(
			'message'  => sprintf( 'Found HEIF image: %s with magic bytes: %s', $filename, $magic_bytes ),
			'severity' => 'info',
		)
	);

	$img = new Photon_OpenCV();
	try {
		$img->readimage( $filename );
	} catch ( Exception $e ) {
		// Bad detection or malformed image
		/** This action is documented in modules/widgets/social-media-icons.php */
		do_action( 'jetpack_bump_stats_extras', 'heif2jpg', 'failed-to-read' );
		jetpack_wpcom_maybe_log_heif_to_jpg(
			array(
				'message'    => sprintf( 'failed to read image: %s', $e->getMessage() ),
				'error_code' => $e->getCode(),
				'severity'   => 'error',
			)
		);
		return false;
	}

	$img->setimageformat( 'jpg' );
	// This should never fail
	$img->writeimage( $filename );

	return true;
}

/**
 * Log information about HEIF/HEIC conversions.
 *
 * @param array $params The parameters to log.
 *
 * @return void
 */
function jetpack_wpcom_maybe_log_heif_to_jpg( $params = array() ) {

	if ( ! file_exists( WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php' ) ) {
		return;
	}

	require_once WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';

	$default = array(
		'feature' => 'heif2jpg',
		'blog_id' => get_current_blog_id(),
	);

	log2logstash( wp_parse_args( $params, $default ) );
}

/**
 * Attempts to convert HEIF/HEIC uploads to JPEG.
 *
 * @param array $file The file array.
 * @return array The file array.
 */
function jetpack_wpcom_transparently_convert_heif_upload_to_jpg( $file ) {
	if ( ! class_exists( 'Photon_OpenCV' ) ) {
		return $file;
	}

	// $file only has `name` and `tmp_name` when sideloading
	$original_size = filesize( $file['tmp_name'] );

	if ( false === jetpack_wpcom_maybe_convert_heif_to_jpg( $file['tmp_name'] ) ) {
		return $file;
	}

	// tmp_name is reused, cache needs to be cleared
	clearstatcache();
	$new_file = array(
		'name'     => pathinfo( $file['name'], PATHINFO_FILENAME ) . '.jpg',
		'type'     => 'image/jpeg',
		'tmp_name' => $file['tmp_name'],
		'error'    => 0,
		'size'     => filesize( $file['tmp_name'] ),
	);

	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'heif2jpg', 'conversions' );
	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'heif2jpg', 'bytes-added', $new_file['size'] - $original_size );

	return $new_file;
}
add_filter( 'wp_handle_upload_prefilter', 'jetpack_wpcom_transparently_convert_heif_upload_to_jpg' );
add_filter( 'wp_handle_sideload_prefilter', 'jetpack_wpcom_transparently_convert_heif_upload_to_jpg' );

/**
 * Add HEIF/HEIC to the list of supported mime types for sideloading.
 *
 * @param array $mimes The list of supported mime types.
 * @return array The list of supported mime types.
 */
function jetpack_wpcom_add_heif_mimes_to_supported_sideload_types( $mimes ) {
	if ( ! class_exists( 'Photon_OpenCV' ) ) {
		return $mimes;
	}
	$mimes[] = 'image/heif';
	$mimes[] = 'image/heic';
	return $mimes;
}
add_filter( 'jetpack_supported_media_sideload_types', 'jetpack_wpcom_add_heif_mimes_to_supported_sideload_types' );

/**
 * Add HEIF/HEIC to the list of supported mime types for uploads.
 *
 * @param array $mimes The list of supported mime types.
 * @return array The list of supported mime types.
 */
function jetpack_wpcom_add_heif_mimes_to_supported_upload_types( $mimes ) {
	if ( ! class_exists( 'Photon_OpenCV' ) ) {
		return $mimes;
	}

	$mimes['heif'] = 'image/heif';

	// HEIC is supported by default, so maybe we don't need it anymore.
	// See https://github.com/WordPress/wordpress-develop/blob/80b7747ef165dd5ed0150003a8c2f957f097609e/src/wp-includes/functions.php#L3416.
	$mimes['heic'] = 'image/heic';
	return $mimes;
}
add_filter( 'upload_mimes', 'jetpack_wpcom_add_heif_mimes_to_supported_upload_types' );

/**
 * Prevent WordPress from blocking HEIF/HEIC uploads in REST API.
 *
 * This allows HEIF files to pass through the REST API validation
 * so they can be converted to JPEG by our conversion filter.
 *
 * @param bool        $prevent_unsupported Whether to prevent unsupported uploads.
 * @param string|null $mime_type          The mime type being uploaded.
 * @return bool
 */
function jetpack_wpcom_allow_heif_uploads_in_rest_api( $prevent_unsupported, $mime_type ) {
	// Allow HEIF/HEIC uploads to pass through validation
	if ( in_array( $mime_type, array( 'image/heif', 'image/heic' ), true ) ) {
		return false; // Don't prevent the upload
	}

	return $prevent_unsupported;
}
add_filter( 'wp_prevent_unsupported_mime_type_uploads', 'jetpack_wpcom_allow_heif_uploads_in_rest_api', 10, 2 );

/**
 * Make WordPress think it supports HEIF/HEIC for image editing.
 *
 * This prevents the "cannot generate responsive image sizes" error
 * by making wp_image_editor_supports() return true for HEIF files.
 *
 * @param bool   $supports Whether the image editor supports this mime type.
 * @param string $mime_type The mime type to check.
 * @return bool
 */
function jetpack_wpcom_support_heif_in_image_editor( $supports, $mime_type ) {
	if ( in_array( $mime_type, array( 'image/heif', 'image/heic' ), true ) ) {
		return true;
	}

	return $supports;
}
add_filter( 'wp_image_editor_supports', 'jetpack_wpcom_support_heif_in_image_editor', 10, 2 );

/**
 * Add HEIF/HEIC support for Gutenberg image block uploads via REST API.
 *
 * This ensures that .heic files uploaded through the Gutenberg image block
 * (which uses the core WordPress REST API /wp/v2/media endpoint) also get
 * converted to JPEG format.
 *
 * @param array $file The file array from REST API upload.
 * @return array The modified file array.
 */
function jetpack_wpcom_convert_heif_in_rest_upload( $file ) {
	if ( ! class_exists( 'Photon_OpenCV' ) ) {
		return $file;
	}

	// Only process if this is a REST API media upload
	if ( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) {
		return $file;
	}

	// Check if this is a media upload request
	$route = sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ) );
	if ( strpos( $route, '/wp/v2/media' ) === false ) {
		return $file;
	}

	// Apply the same HEIF conversion logic as regular uploads
	return jetpack_wpcom_transparently_convert_heif_upload_to_jpg( $file );
}

// Hook into the REST API upload process
add_filter( 'rest_upload_from_data', 'jetpack_wpcom_convert_heif_in_rest_upload', 10, 1 );
