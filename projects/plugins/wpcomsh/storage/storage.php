<?php
/**
 * Filters related to disk storage for WordPress on Atomic.
 *
 * @package wpcomsh
 */

/**
 * Determine if uploaded file exceeds space quota.
 * Modeled after core's check_upload_size() for multisite, but specific for WordPress on Atomic.
 *
 * @param array $file An element from the `$_FILES` array for a given file.
 * @return array The `$_FILES` array element with 'error' key set if file exceeds quota. 'error' is empty otherwise.
 */
function wpcomsh_check_upload_size( $file ) {
	if ( $file['error'] > 0 ) { // There's already an error.
		return $file;
	}

	if ( defined( 'WP_IMPORTING' ) ) {
		return $file;
	}

	$site_info = wpcomsh_get_at_site_info();
	if ( empty( $site_info['space_used'] ) || empty( $site_info['space_quota'] ) ) {
		return $file;
	}

	$space_available = $site_info['space_quota'] - $site_info['space_used'];
	$file_size       = filesize( $file['tmp_name'] );

	if ( $file_size >= $space_available ) {
		$file['error'] = __( 'You have used your space quota. Please delete files before uploading.', 'wpcomsh' );
	}

	if ( $file['error'] > 0 && ! isset( $_POST['html-upload'] ) && ! wp_doing_ajax() ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		wp_die( esc_html( $file['error'] ), '', array( 'back_link' => true ) );
	}

	return $file;
}
add_filter( 'wp_handle_upload_prefilter', 'wpcomsh_check_upload_size' );

/**
 * Do not allow uploads from Calypso's media section if it would cause our
 * disk usage to go over the quota.
 *
 * @param bool|WP_Error $allowed If false or WP_Error, blocks the upload. If true, allows the upload.
 * @param array         $files   The $_FILES attempting to be uploaded.
 *
 * @return bool|WP_Error WP_Error when uploaded file would exceed upload space, $allowed when not.
 */
function wpcomsh_jetpack_upload_handler_can_upload( $allowed, $files ) {
	$site_info = wpcomsh_get_at_site_info();

	if ( empty( $site_info['space_used'] ) || empty( $site_info['space_quota'] ) ) {
		return $allowed;
	}

	if ( ! empty( $files['media']['size'] ) ) {
		$upload_size = array_sum( $files['media']['size'] );
		if ( $site_info['space_used'] + $upload_size > $site_info['space_quota'] ) {
			return new WP_Error( 'insufficient_space_available', 'Uploaded file is too large.' );
		}
	}

	return $allowed;
}
add_filter( 'jetpack_upload_handler_can_upload', 'wpcomsh_jetpack_upload_handler_can_upload', 10, 2 );

/**
 * Allow the additional mime types that WPCOM already allows.
 *
 * @param array    $file_data {
 *     Values for the extension, mime type, and corrected filename.
 *
 *     @type string|false $ext             File extension, or false if the file doesn't match a mime type.
 *     @type string|false $type            File mime type, or false if the file doesn't match a mime type.
 *     @type string|false $proper_filename File name with its correct extension, or false if it cannot be determined.
 * }
 * @param string   $file                      Full path to the file.
 * @param string   $filename                  The name of the file (may differ from $file due to
 *                                                $file being in a tmp directory).
 * @param string[] $mimes                     Array of mime types keyed by their file extension regex.
 */
function wpcomsh_allow_file_uploads_with_invalid_mime_types( $file_data, $file, $filename, $mimes ) {
	// Remove itself to avoid potential infinite loops
	remove_filter( 'wp_check_filetype_and_ext', 'wpcomsh_allow_file_uploads_with_invalid_mime_types', 1000 );
	if ( ! file_exists( $file ) ) {
		return $file_data;
	}

	// If wp_check_filetype_and_ext already allows it or if the file does not,
	// exist, don't bother doing the checks
	if ( ! empty( $file_data['type'] ) ) {
		return $file_data;
	}

	// Try to get the file type with the extension based check, bail if it fails
	$file_type = wp_check_filetype( $filename, $mimes );
	if ( empty( $file_type['type'] ) ) {
		return $file_data;
	}

	$finfo     = finfo_open( FILEINFO_MIME_TYPE );
	$real_mime = finfo_file( $finfo, $file );
	finfo_close( $finfo );

	if ( empty( $real_mime ) ) {
		return $file_data;
	}

	$allowed = array();
	switch ( strtolower( $file_type['ext'] ) ) {
		case 'doc':
		case 'docm':
		case 'docx':
			$allowed[] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
			$allowed[] = 'application/vnd.openxmlformats-officedocument.wordprocessingml';
			$allowed[] = $file_type['type'];
			$allowed[] = 'application/cdfv2';
			break;
		case 'pot':
		case 'pps':
		case 'ppt':
		case 'ppsm':
		case 'ppsx':
		case 'pptm':
		case 'pptx':
			$allowed[] = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
			$allowed[] = 'application/vnd.openxmlformats-officedocument.presentationml.slideshow';
			$allowed[] = $file_type['type'];
			$allowed[] = 'application/cdfv2';
			break;
		case 'xla':
		case 'xls':
		case 'xlt':
		case 'xlw':
		case 'xslb':
		case 'xlsm':
		case 'xlsx':
			$allowed[] = 'application/vnd.openxmlformats-officedocument.spreadsheetml';
			$allowed[] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
			$allowed[] = $file_type['type'];
			$allowed[] = 'application/cdfv2';
			break;
		case 'odt':
			$allowed[] = 'application/vnd.oasis.opendocument.presentation';
			$allowed[] = $file_type['type'];
			$allowed[] = 'application/cdfv2';
			break;
	}

	// Duplicate the mime types as a work around for https://bugs.php.net/bug.php?id=78028
	$_allowed = array_map(
		function ( $item ) {
			return $item . $item;
		},
		$allowed
	);
	if ( in_array( strtolower( $real_mime ), $allowed, true ) || in_array( strtolower( $real_mime ), $_allowed, true ) ) {
		$file_data['type'] = $file_type['type'];
		$file_data['ext']  = $file_type['ext'];
	}

	return $file_data;
}

add_filter( 'wp_check_filetype_and_ext', 'wpcomsh_allow_file_uploads_with_invalid_mime_types', 1000, 4 );
