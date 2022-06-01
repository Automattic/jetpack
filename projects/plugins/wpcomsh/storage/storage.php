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

