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

	$img = new Photon_OpenCV();
	try {
		$img->readimage( $filename );
	} catch ( Exception $e ) {
		// Bad detection or malformed image
		/** This action is documented in modules/widgets/social-media-icons.php */
		do_action( 'jetpack_bump_stats_extras', 'heif2jpg', 'failed-to-read' );
		return false;
	}

	$img->setimageformat( 'jpg' );
	// This should never fail
	$img->writeimage( $filename );

	return true;
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
	// Only need to modify 'upload_mimes' on Atomic.
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		$mimes['heif'] = 'image/heif';
		$mimes['heic'] = 'image/heic';
	}
	return $mimes;
}
add_filter( 'upload_mimes', 'jetpack_wpcom_add_heif_mimes_to_supported_upload_types' );
