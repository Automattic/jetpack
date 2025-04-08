<?php
/**
 * Export endpoint.
 *
 * @package endpoints
 */

/**
 * Enables wp_upload_bits call with .xml filename.
 *
 * @param array $mimes Mime types.
 *
 * @return array
 */
function wpcomsh_whitelist_xml_upload( $mimes ) {
	$mimes['xml'] = 'application/xml+rss';
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
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
function wpcomsh_rest_api_export( $request = null ) {
	// Uses wp-admin's export_wp function.
	require_once ABSPATH . 'wp-admin/includes/export.php';

	$args        = wpcomsh_rest_api_export_options( $request );
	$_blog_id    = (int) Jetpack_Options::get_option( 'id' );
	$export_name = "wpcomsh-export-$_blog_id";

	if ( get_transient( $export_name ) ) {
		return new WP_REST_Response(
			array(
				'error' => 'Export in progress',
			),
			423
		);
	} else {
		// Set an hour long _lock_.
		set_transient( $export_name, $export_name, HOUR_IN_SECONDS );
	}

	// Enable uploading of XML file type.
	add_filter( 'upload_mimes', 'wpcomsh_whitelist_xml_upload' );

	// Create a placeholder file in upload directory to stream exported content to.
	$timestamp = time();
	$filename  = "$export_name-$timestamp.xml";

	$upload = wp_upload_bits( $filename, null, '', null );

	// Disable uploading of WXR file type.
	remove_filter( 'upload_mimes', 'wpcomsh_whitelist_xml_upload' );

	if ( ! empty( $upload['error'] ) ) {
		delete_transient( $export_name );
		return new WP_REST_Response(
			array(
				'error' => $upload['error'],
			),
			500
		);
	}
	$upload_file = $upload['file'];
	$upload_url  = $upload['url'];

	// Capture and stream WXR output of export_wp to $upload_file.
	ob_start(
		function ( $data ) use ( $upload_file ) {
			file_put_contents( $upload_file, $data, FILE_APPEND ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			return '';
		},
		1048576
	); // Flush to file in 1MB chunks.
	try {
		export_wp( $args );
	} catch ( Exception $e ) {
		// Exception occurred, delete failed export file before returning error.
		ob_end_clean();
		delete_transient( $export_name );
		@unlink( $upload_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink,WordPress.PHP.NoSilencedErrors.Discouraged
		return new WP_REST_Response(
			array(
				'error' => $e->getMessage(),
			),
			500
		);
	}

	// Export finished without exception. Flush and close.
	ob_end_clean();
	$upload_size = filesize( $upload_file );

	delete_transient( $export_name );
	return new WP_REST_Response(
		array(
			'url'  => $upload_url,
			'type' => 'wxr',
			'size' => $upload_size,
		),
		200
	);
}

/**
 * Declare privileges this plugin needs.
 *
 * @return bool
 */
function wpcomsh_rest_api_export_permission_callback() {
	return current_user_can( 'export' );
}

/**
 * Prepare export options.
 *
 * TODO: code share with `wp-admin/export.php`.
 *
 * @param WP_REST_Request $request Request object.
 *
 * @return array
 */
function wpcomsh_rest_api_export_options( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis
	$args = array();

	// phpcs:disable WordPress.Security
	if ( ! isset( $_GET['content'] ) || 'all' === $_GET['content'] ) {
		$args['content'] = 'all';
	} elseif ( 'posts' === $_GET['content'] ) {
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
	} elseif ( 'pages' === $_GET['content'] ) {
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
	} elseif ( 'attachment' === $_GET['content'] ) {
		$args['content'] = 'attachment';

		if ( $_GET['attachment_start_date'] || $_GET['attachment_end_date'] ) {
			$args['start_date'] = $_GET['attachment_start_date'];
			$args['end_date']   = $_GET['attachment_end_date'];
		}
	} else {
		$args['content'] = $_GET['content'];
	}
	// phpcs:enable

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
 * Initialize API.
 */
function wpcomsh_rest_api_export_init() {
	register_rest_route(
		'wpcomsh/v1',
		'/export',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => 'wpcomsh_rest_api_export_permission_callback',
				'callback'            => 'wpcomsh_rest_api_export',
			),
		)
	);
}
