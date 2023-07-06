<?php

function wpcom_maybe_convert_heif_to_jpg( $filename ) {
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

	$magic_bytes = file_get_contents( $filename, false, null, 4, 8 );
	if ( false === in_array( $magic_bytes, $valid_magic_bytes, true ) ) {
		return false;
	}

	$img = new Photon_OpenCV();
	try {
		$img->readimage( $filename );
	} catch ( Exception $e ) {
		// Bad detection or malformed image
		bump_stats_extras( 'heif2jpg', 'failed-to-read' );
		return false;
	}

	$img->setimageformat( 'jpg' );
	// This should never fail
	$img->writeimage( $filename );

	return true;
}

function wpcom_transparently_convert_heif_upload_to_jpg( $file ) {
	// $file only has `name` and `tmp_name` when sideloading
	$original_size = filesize( $file['tmp_name'] );

	if ( false === wpcom_maybe_convert_heif_to_jpg( $file['tmp_name'] ) ) {
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

	bump_stats_extras( 'heif2jpg', 'conversions' );
	bump_stats_extras( 'heif2jpg', 'bytes-added', $new_file['size'] - $original_size );

	return $new_file;
}
add_filter( 'wp_handle_upload_prefilter', 'wpcom_transparently_convert_heif_upload_to_jpg' );
add_filter( 'wp_handle_sideload_prefilter', 'wpcom_transparently_convert_heif_upload_to_jpg' );

function wpcom_add_heif_mimes_to_supported_sideload_types( $mimes ) {
	$mimes[] = 'image/heif';
	$mimes[] = 'image/heic';
	return $mimes;
}
// Necessary for importing media from URL
add_filter( 'jetpack_supported_media_sideload_types', 'wpcom_add_heif_mimes_to_supported_sideload_types' );
