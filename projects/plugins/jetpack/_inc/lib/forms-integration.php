<?php
/**
 * File that sets up Jetpack integration with the Forms package.
 *
 * @package automattic/jetpack
 */

/**
 * Handle feedback post sync.
 *
 * @param int      $post_id The post ID.
 * @param \WP_Post $post    The post object.
 * @param bool     $update  Whether this is an existing post being updated.
 * @param array    $state   State data.
 */
function jetpack_forms_handle_feedback_sync( $post_id, $post, $update, $state ) {
	// Only process feedback posts
	if ( ! $post || 'feedback' !== $post->post_type ) {
		return;
	}

	error_log( sprintf( 'DEBUG: Processing synced feedback post ID: %d, Update: %s', $post_id, $update ? 'true' : 'false' ) );
}

/**
 * Registers filters for integration with Forms package.
 */
function jetpack_forms_integration_init() {
	// Only add the hook if we have the forms package
	if ( ! class_exists( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field' ) ) {
		return;
	}

	// Add filter to provide the upload token
	add_filter( 'jetpack_forms_file_upload_token', 'jetpack_forms_provide_upload_token' );

	// Add filter to get file data from token
	add_filter( 'jetpack_forms_get_file_data_from_token', 'jetpack_forms_get_file_data_from_token', 10, 2 );

	// Add hook for feedback post sync
	add_action( 'jetpack_sync_save_post', 'jetpack_forms_handle_feedback_sync', 10, 4 );
}
add_action( 'init', 'jetpack_forms_integration_init' );

/**
 * Provides an upload token using the Unauth_File_Upload_Handler.
 *
 * @return string The generated upload token.
 */
function jetpack_forms_provide_upload_token() {
	l( 'PROVIDE UPLOAD TOKEN' );

	// If we're on a simple site (WordPress.com), generate token directly
	if ( ( new Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
		require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-unauth-file-upload-handler.php';
		$handler = new Automattic\Jetpack\Unauth_File_Upload_Handler();
		return $handler->generate_upload_token();
	}

	$manager  = new Automattic\Jetpack\Connection\Manager();
	$is_valid = $manager->is_connected();
	l( 'Is Connected: ' . var_export( $is_valid, true ) );

	// Add token validation check
	$tokens = new Automattic\Jetpack\Connection\Tokens();
	$token  = $tokens->get_access_token();
	l( 'Blog Token: ' . var_export( $token, true ) );

	if ( ! $is_valid || ! $token || is_wp_error( $token ) ) {
		error_log( 'Jetpack connection validation failed or blog token not available' );
		return '';
	}

	$blog_id = Jetpack_Options::get_option( 'id' );
	l( 'Blog ID: ' . var_export( $blog_id, true ) );

	// Add more detailed request logging
	$request_url = sprintf( '/sites/%d/unauth-file-upload/token', $blog_id );
	l( 'Request URL: ' . $request_url );

	$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
		$request_url,
		'v2',
		array(
			'method'  => 'POST',
			'headers' => array(
				'Content-Type' => 'application/json',
			),
		),
		wp_json_encode(
			array(
				'context' => 'jetpack-form',
			)
		),
		'wpcom'
	);

	if ( is_wp_error( $response ) ) {
		error_log( 'Error getting upload token: ' . $response->get_error_message() );
		l( 'Response Error: ' . $response->get_error_message() );
		return '';
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );
	l( 'Response Body: ' . var_export( $body, true ) );

	if ( ! isset( $body['token'] ) ) {
		error_log( 'Invalid response from upload token endpoint' );
		return '';
	}

	return $body['token'];
}

/**
 * Gets file data from a token using the Unauth_File_Upload_Handler.
 * Also includes the full path to the temporary file.
 *
 * @param array  $default_data Default empty array.
 * @param string $token        The file token.
 * @return array The file data.
 */
function jetpack_forms_get_file_data_from_token( $default_data, $token ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-unauth-file-upload-handler.php';
	$handler   = new Automattic\Jetpack\Unauth_File_Upload_Handler();
	$file_data = $handler->get_file_data( $token );

	if ( ! $file_data ) {
		return $default_data;
	}

	return $file_data;
}
