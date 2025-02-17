<?php
/**
 * Unauthenticated File Upload endpoint for the WordPress.com REST API.
 *
 * A generic endpoint that allows unauthenticated users to securely upload files through WordPress.com.
 * The endpoint requires a nonce and context to validate and organize uploads.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload
 *
 * Handles unauthenticated file uploads through WordPress.com
 */
class WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/unauth-file-upload';
		$this->wpcom_is_wpcom_only_endpoint    = true;
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
				'callback'            => array( $this, 'handle_upload' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'authentication'      => array(),  // Disable all authentication methods
				'args'                => array(
					'_wpnonce' => array(
						'description' => __( 'Nonce', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					'context'  => array(
						'description' => __( 'Context identifier for the upload', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
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
		// For non-WPCOM sites, require Jetpack connection
		if ( ! ( new Host() )->is_wpcom_simple() && ! ( new Manager() )->is_connected() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Site must be connected to WordPress.com', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$context = $request->get_param( 'context' );
		$nonce   = $request->get_param( '_wpnonce' );

		// Verify the form upload nonce
		if ( ! wp_verify_nonce( $nonce, 'jetpack_upload_' . $context ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Invalid upload token.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
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
		// Get the uploaded file
		$files = $request->get_file_params();

		if ( empty( $files ) || empty( $files['file'] ) ) {
			return new WP_Error(
				'rest_missing_callback_param',
				__( 'No file was uploaded.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$context = $request->get_param( 'context' );

		// Allow filtering of upload handling based on context
		$upload_handler = apply_filters( 'jetpack_unauth_file_upload_handler', array( $this, 'handle_default_upload' ), $context );

		if ( is_callable( $upload_handler ) ) {
			return call_user_func( $upload_handler, $request, $files['file'] );
		}

		return new WP_Error(
			'rest_invalid_handler',
			__( 'Invalid upload handler.', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Default handler for file uploads when no specific handler is registered
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @param array           $file The uploaded file data.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function handle_default_upload( $request, $file ) {
		if ( ( new Host() )->is_wpcom_simple() ) {
			// Cloud handling.
			return apply_filters( 'jetpack_unauth_file_upload_response', new WP_REST_Response( array() ), $request );
		} else {
			if ( UPLOAD_ERR_OK !== $file['error'] ) {
				return $this->get_upload_error_message( $file['error'] );
			}

			$file_name = sanitize_file_name( wp_unslash( $file['name'] ) );
			$is_error  = $this->check_file_type( $file_name );
			if ( is_wp_error( $is_error ) ) {
				return $is_error;
			}

			if ( defined( 'JETPACK_FILE_UPLOAD_PROXY' ) && JETPACK_FILE_UPLOAD_PROXY ) {
				// For Jetpack sites, just proxy the temporary file directly to WPCOM
				return $this->proxy_request_to_wpcom( $request );
			}

			// Handle file upload locally
			return $this->handle_local_file_upload( $request, $file );
		}
	}

	/**
	 * Gets an error message for file upload errors
	 *
	 * @param int $error_code The error code from the file upload.
	 * @return WP_Error Error object with the error message.
	 */
	private function get_upload_error_message( $error_code ) {
		$error_message = __( 'Failed to upload file.', 'jetpack' );

		// Add specific error messages based on the error code if needed
		switch ( $error_code ) {
			case UPLOAD_ERR_INI_SIZE:
			case UPLOAD_ERR_FORM_SIZE:
				$error_message = __( 'The uploaded file exceeds the maximum allowed size.', 'jetpack' );
				break;
			case UPLOAD_ERR_PARTIAL:
				$error_message = __( 'The file was only partially uploaded.', 'jetpack' );
				break;
			case UPLOAD_ERR_NO_FILE:
				$error_message = __( 'No file was uploaded.', 'jetpack' );
				break;
		}

		return new WP_Error(
			'rest_upload_error',
			$error_message,
			array( 'status' => 400 )
		);
	}

	/**
	 * Checks if the file type is allowed
	 *
	 * @param string $file_name The name of the file to check.
	 * @return true|WP_Error True if the file type is allowed, WP_Error object otherwise.
	 */
	private function check_file_type( $file_name ) {
		// Define allowed mime types
		$allowed_mime_types = get_allowed_mime_types();
		$file_type          = wp_check_filetype( $file_name, $allowed_mime_types );

		if ( ! $file_type['type'] ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'Invalid file type.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}
	}

	/**
	 * Gets a secure upload directory for temporary files
	 */
	private function get_secret_directory() {
		$secret_dir = get_option( 'jetpack_upload_temp_dir', false );
		if ( ! $secret_dir ) {
			$secret_dir = wp_generate_password( 64, false );
			update_option( 'jetpack_upload_temp_dir', $secret_dir );
		}
		return $secret_dir;
	}

	/**
	 * Handles local file upload processing
	 *
	 * @param WP_REST_Request $request The request object.
	 * @param array           $file The uploaded file data.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	private function handle_local_file_upload( $request, $file ) {
		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return new WP_Error( 'dir_error', __( 'Unable to process file upload.', 'jetpack' ) . ' [301] ', array( 'status' => 400 ) );
		}

		$temp_dir = $upload_dir['basedir'] . '/jetpack-upload/' . $this->get_secret_directory() . '/temp';
		if ( ! file_exists( $temp_dir ) ) {
			$create_dir = wp_mkdir_p( $temp_dir );
			if ( ! $create_dir ) {
				return new WP_Error( 'dir_create', __( 'Unable to process file upload.', 'jetpack' ) . ' [302] ', array( 'status' => 400 ) );
			}
		}

		$file_name = sanitize_file_name( wp_unslash( $file['name'] ) );
		// This is a temporary secret that will be used to move the file to the final location.
		$temporary_secret = wp_hash( wp_rand( 100000, 999999 ) . microtime() );
		$secret_file_name = $temporary_secret . '-' . $file_name;

		$new_secret__filename = wp_unique_filename( $temp_dir, $secret_file_name );

		if ( $secret_file_name !== $new_secret__filename ) {
			return new WP_Error( 'file_exists', __( 'Unable to process file upload.', 'jetpack' ) . ' [304] ', array( 'status' => 400 ) );
		}

		// Move uploaded file
		$move_result = move_uploaded_file( $file['tmp_name'], $temp_dir . '/' . $new_secret__filename );
		if ( ! $move_result ) {
			return new WP_Error( 'file_move', __( 'Unable to process file upload.', 'jetpack' ) . ' [303] ', array( 'status' => 400 ) );
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'data'    => array(
					'filename' => ltrim( $new_secret__filename, $temporary_secret . '-' ),
					'temp'     => $temporary_secret,
				),
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload' );
