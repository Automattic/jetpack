<?php
/**
 * Allows uploading media from URL in Media Library.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Appends the wpcom media URL upload form.
 */
function append_wpcom_media_url_upload() {
	?>
	<div id="wpcom-media-url-upload"></div>
	<?php
}

/**
 * Enqueue the assets of the wpcom media URL upload form
 */
function enqueue_wpcom_media_url_upload_form() {
	global $pagenow;

	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-media-url-upload', array( 'js', 'css' ) );

	$page = 'editor';
	if ( $pagenow === 'upload.php' ) {
		$page = 'media-library';
	} elseif ( $pagenow === 'media-new.php' ) {
		$page = 'media-new';
	}

	$data = wp_json_encode(
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'action'  => 'wpcom_media_url_upload',
			'nonce'   => wp_create_nonce( 'wpcom_media_url_upload' ),
			'page'    => $page,
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

/**
 * Load the wpcom media URL upload form.
 */
function load_wpcom_media_url_upload_form() {
	if ( ! is_admin() || ! current_user_can( 'upload_files' ) ) {
		return;
	}

	add_action( 'wp_ajax_wpcom_media_url_upload', 'wpcom_handle_media_url_upload' );

	global $pagenow;
	if ( $pagenow !== 'media-new.php' ) {
		add_action( 'pre-upload-ui', 'append_wpcom_media_url_upload', 9 );
	}

	add_action( 'post-plupload-upload-ui', 'enqueue_wpcom_media_url_upload_form' );
}
load_wpcom_media_url_upload_form();
