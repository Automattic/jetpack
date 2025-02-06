<?php
/**
 * Allows uploading media from URL in Media Library.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Appends the wpcom media URL upload form.
 */
function wpcom_media_url_upload() {
	global $pagenow;

	if ( empty( $_GET['untangling-media'] ) ) { // phpcs:disable WordPress.Security.NonceVerification.Recommended
		return;
	}

	?>
	<div id="wpcom-media-url-upload"></div>
	<?php

	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-media-url-upload', array( 'js', 'css' ) );

	$data = wp_json_encode(
		array(
			'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
			'action'   => 'wpcom_media_url_upload',
			'nonce'    => wp_create_nonce( 'wpcom_media_url_upload' ),
			'isEditor' => $pagenow !== 'upload.php',
		)
	);

	wp_add_inline_script(
		$handle,
		"window.JETPACK_MU_WPCOM_MEDIA_URL_UPLOAD = $data;",
		'before'
	);
}

/**
 * AJAX handler for the wpcom media URL upload.
 */
function wpcom_handle_media_url_upload() {
	check_ajax_referer( 'wpcom_media_url_upload' );

	if ( ! isset( $_POST['url'] ) ) {
		return;
	}

	$url = esc_url_raw( wp_unslash( $_POST['url'] ) );

	$tmp_file = download_url( $url );
	if ( is_wp_error( $tmp_file ) ) {
		return wp_send_json_error( $tmp_file );
	}

	if ( is_multisite() ) {
		add_filter( 'wp_handle_sideload_prefilter', 'check_upload_size' );
	}

	$attachment_id = media_handle_sideload(
		array(
			'name'     => basename( wp_parse_url( $url, PHP_URL_PATH ) ),
			'tmp_name' => $tmp_file,
		)
	);

	if ( file_exists( $tmp_file ) ) {
		wp_delete_file( $tmp_file );
	}

	if ( is_wp_error( $attachment_id ) ) {
		return wp_send_json_error( $attachment_id );
	} else {
		return wp_send_json_success( array( 'attachment_id' => $attachment_id ) );
	}
}

if ( current_user_can( 'upload_files' ) ) {
	add_action( 'pre-upload-ui', 'wpcom_media_url_upload', 9 );
	add_action( 'wp_ajax_wpcom_media_url_upload', 'wpcom_handle_media_url_upload' );
}
