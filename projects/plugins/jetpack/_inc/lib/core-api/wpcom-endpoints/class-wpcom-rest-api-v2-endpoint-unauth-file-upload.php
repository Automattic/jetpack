<?php
/**
 * Unauthenticated File Upload endpoint for the WordPress.com REST API.
 *
 * A generic endpoint that allows unauthenticated users to upload files.
 * Security is handled through a Jetpack-specific upload nonce that must be generated with a context.
 *
 * Example usage:
 * $nonce = wp_create_nonce('jetpack_file_upload_' . $context);
 *
 * @package automattic/jetpack
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload
 *
 * Handles unauthenticated file uploads through WordPress.com
 */
class WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/unauth-file-upload';
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for file upload.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => 'POST',
				'permission_callback' => array( $this, 'permissions_check' ),
				'callback'            => array( $this, 'handle_upload' ),
				'args'                => array(
					'context' => array(
						'description' => __( 'Context identifier for the upload', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					// it also expects a file but there's no way to say this in the args
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/remove',
			array(
				'methods'             => 'POST',
				'permission_callback' => array( $this, 'permissions_check_params' ),
				'callback'            => array( $this, 'remove_file' ),
				'args'                => array(
					'context' => array(
						'description' => __( 'Context identifier for the upload', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					'token'   => array(
						'description' => __( 'Token of the recetnly uploaded file', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					// it also expects a file but there's no way to say this in the args
				),
			)
		);
	}

	/**
	 * Checks if the request has permission to upload files
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has permission, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		$this->served = true;
		// First check if we have a file at all
		$files = $request->get_file_params();
		if ( empty( $files ) || empty( $files['file'] ) ) {
			return new WP_Error(
				'rest_missing_callback_param',
				__( 'No file was uploaded.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		return $this->permissions_check_params( $request );
	}

	/**
	 * Checks if the request has permission to upload files
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has permission, WP_Error object otherwise.
	 */
	public function permissions_check_params( $request ) {
		// Check the wp_rest upload nonce
		$upload_nonce = $request->get_param( 'wp_nonce' );

		if ( ! $upload_nonce ) {
			return new WP_Error(
				'missing_upload_nonce',
				__( 'wp rest nonce is required.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// Verify the upload nonce with its context
		$context = $request->get_param( 'context' );

		// Check the Jetpack upload nonce
		$upload_nonce = $request->get_param( 'jp_upload_nonce' );

		if ( ! $upload_nonce ) {
			return new WP_Error(
				'missing_upload_nonce',
				__( 'Jetpack upload nonce is required.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( ! wp_verify_nonce( $upload_nonce, 'jetpack_file_upload_' . $context ) ) {
			return new WP_Error(
				'invalid_upload_nonce',
				__( 'Invalid Jetpack upload nonce.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		/**
		 * Filter whether to allow the file upload based on IP or other criteria.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool|WP_Error $allowed Whether to allow the upload. Return WP_Error to block with a specific message.
		 * @param WP_REST_Request $request The request object.
		 */
		$ip_check = apply_filters( 'jetpack_unauth_file_upload_ip_check', true, $request );
		if ( is_wp_error( $ip_check ) ) {
			$ip_check->add_data( array( 'status' => 429 ) ); // Rate limit exceeded
			return $ip_check;
		}

		return true;
	}

	/**
	 * Handles the file upload request
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function handle_upload( $request ) {
		$files = $request->get_file_params();
		$file  = $files['file'];

		// Basic file validation
		if ( empty( $file['tmp_name'] ) || empty( $file['name'] ) ) {
			return new WP_Error(
				'rest_missing_callback_param',
				__( 'No file was uploaded.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		// Return dummy response for testing
		return rest_ensure_response(
			array(
				'success' => true,
				'data'    => array(
					'token'         => wp_hash( uniqid( 'test_upload_', true ) ),
					'original_name' => $file['name'],
					'size'          => $file['size'],
					'mime_type'     => $file['type'],
				),
			)
		);
	}

	/**
	 * Removes the file from the server that was temprary added.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function remove_file() {
		// Return dummy success response for testing
		return rest_ensure_response(
			array(
				'success' => true,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload' );
