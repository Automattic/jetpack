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

use Automattic\Jetpack\Unauth_File_Upload_Handler;

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
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/remove',
			array(
				'methods'             => 'POST',
				'permission_callback' => array( $this, 'permissions_check' ),
				'callback'            => array( $this, 'remove_file' ),
				'args'                => array(
					'file_id' => array(
						'required' => true,
						'type'     => 'string',
					),
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
		$token = $request->get_param( 'upload_token' );
		if ( ! $token ) {
			return new WP_Error(
				'missing_token',
				__( 'Upload token is required.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		try {
			require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-unauth-file-upload-handler.php';
			$handler = new Unauth_File_Upload_Handler();
			$claims  = $handler->verify_upload_token( $token );

			// Verify claims
			if ( time() > $claims->exp ) {
				return new WP_Error( 'token_expired', 'Upload token has expired' );
			}

			// Verify IP if specified
			if ( isset( $claims->ip ) && isset( $_SERVER['REMOTE_ADDR'] ) && $_SERVER['REMOTE_ADDR'] !== $claims->ip ) {
				return new WP_Error( 'invalid_ip', 'Invalid IP address' );
			}

			return true;

		} catch ( \Exception $e ) {
			return new WP_Error( 'invalid_token', $e->getMessage() );
		}
	}

	/**
	 * Handles the file upload request
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function handle_upload( $request ) {
		$files = $request->get_file_params();
		if ( empty( $files ) || empty( $files['file'] ) ) {
			return new WP_Error(
				'rest_missing_callback_param',
				__( 'No file was uploaded.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$file = $files['file'];
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
	 * Removes the file from the server that was temporary added.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function remove_file( $request ) {
		$file_id = $request->get_param( 'file_id' );
		if ( empty( $file_id ) ) {
			return new WP_Error(
				'missing_file_id',
				__( 'File ID is required.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		// TODO: Implement actual file removal logic here
		// For now, just return success response
		return rest_ensure_response(
			array(
				'success' => true,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload' );
