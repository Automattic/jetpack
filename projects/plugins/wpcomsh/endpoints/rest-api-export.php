<?php

// used to enable wp_upload_bits call with .xml filename
function wpcomsh_whitelist_xml_upload( $mimes ) {
	$mimes[ 'xml' ] = 'application/xml+rss';
	return $mimes;
}

/**
 * Export site content in WXR format as a file in the upload directory.
 * 
 * Response is a JSON object with following fields:
 * 
 * `url` - URL of exported WXR file
 * `type` - export format (currently always `wxr`)
 * `size` - size of exported WXR file in bytes
 *
 * @param WP_REST_Request $request
 * @return WP_Error|WP_REST_Response
 */
function wpcomsh_rest_api_export( $request = null ) {
	// Uses wp-admin's export_wp function */
	require_once( ABSPATH . 'wp-admin/includes/export.php' );

	$args = wpcomsh_rest_api_export_options( $request );

	// Capture WXR output of export_wp
	ob_start();
	export_wp( $args );
	$wxr = ob_get_contents();
	ob_end_clean();

	// enable uploading of XML file type
	add_filter( 'upload_mimes', 'wpcomsh_whitelist_xml_upload' );

	// Save to uploads to be retrieved by importer
	$timestamp = current_time( 'timestamp', true );
	$upload = wp_upload_bits( "wpcomsh-export-$timestamp.xml", null, $wxr );
	if ( ! empty( $upload['error'] ) ) {
		return new WP_REST_Response( array(
			'error' => $upload['error'],
		), 500);
	}

	// disable uploading of WXR file type
	remove_filter( 'upload_mimes', 'wpcomsh_whitelist_xml_upload' );

	return new WP_REST_Response( array(
		'url' => $upload['url'],
		'type' => 'wxr',
		'size' => strlen( $wxr ),
	), 200);
}

// Declare privileages this plugin needs
function wpcomsh_rest_api_export_permission_callback() {
	return current_user_can( 'export' );
}

// Prepare export options.
// TODO: code share with `wp-admin/export.php`.
function wpcomsh_rest_api_export_options( $request ) {
	$args = array();

	if ( ! isset( $_GET['content'] ) || 'all' == $_GET['content'] ) {
		$args['content'] = 'all';
	} elseif ( 'posts' == $_GET['content'] ) {
		$args['content'] = 'post';

		if ( $_GET['cat'] ) {
			$args['category'] = (int) $_GET['cat'];
		}

		if ( $_GET['post_author'] ) {
			$args['author'] = (int) $_GET['post_author'];
		}

		if ( $_GET['post_start_date'] || $_GET['post_end_date'] ) {
			$args['start_date'] = $_GET['post_start_date'];
			$args['end_date']   = $_GET['post_end_date'];
		}

		if ( $_GET['post_status'] ) {
			$args['status'] = $_GET['post_status'];
		}
	} elseif ( 'pages' == $_GET['content'] ) {
		$args['content'] = 'page';

		if ( $_GET['page_author'] ) {
			$args['author'] = (int) $_GET['page_author'];
		}

		if ( $_GET['page_start_date'] || $_GET['page_end_date'] ) {
			$args['start_date'] = $_GET['page_start_date'];
			$args['end_date']   = $_GET['page_end_date'];
		}

		if ( $_GET['page_status'] ) {
			$args['status'] = $_GET['page_status'];
		}
	} elseif ( 'attachment' == $_GET['content'] ) {
		$args['content'] = 'attachment';

		if ( $_GET['attachment_start_date'] || $_GET['attachment_end_date'] ) {
			$args['start_date'] = $_GET['attachment_start_date'];
			$args['end_date']   = $_GET['attachment_end_date'];
		}
	} else {
		$args['content'] = $_GET['content'];
	}

	/**
	 * Filters the export args.
	 *
	 * @since 3.5.0
	 *
	 * @param array $args The arguments to send to the exporter.
	 */
	return apply_filters( 'export_args', $args );
}

/**
 * Initialize API
 */
function wpcomsh_rest_api_export_init() {
	register_rest_route( 'wpcomsh/v1', '/export',
		array(
			array(
				'methods' => WP_REST_Server::READABLE,
				'permission_callback' => 'wpcomsh_rest_api_export_permission_callback',
				'callback' => 'wpcomsh_rest_api_export',
			)
		) );
}
