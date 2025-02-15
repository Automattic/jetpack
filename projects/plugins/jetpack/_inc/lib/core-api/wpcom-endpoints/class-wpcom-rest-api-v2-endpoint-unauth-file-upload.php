<?php
/**
 * Unauthenticated File Upload endpoint for the WordPress.com REST API.
 *
 * This endpoint is primarily used by the File Upload field in Jetpack Forms,
 * allowing unauthenticated users to securely upload files through WordPress.com.
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
			$this->rest_base . '/nonce',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_nonce' ),
				'permission_callback' => array( $this, 'permissions_check_nonce' ),
				'args'                => array(
					'hash'    => array(
						'description' => __( 'Pass the hash', 'jetpack' ), // This should contain info about the form. allowed types, form id, etc.
						'type'        => 'string',
						'required'    => true,
					),
					'id'      => array(
						'description' => __( 'Pass the field id', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					'form_id' => array(
						'description' => __( 'Pass the form id', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_upload' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'_nonce'  => array(
						'description' => __( 'Nonce', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					'hash'    => array(
						'description' => __( 'Pass the hash', 'jetpack' ), // This should contain info about the form. allowed types, form id, etc.
						'type'        => 'string',
						'required'    => true,
					),
					'id'      => array(
						'description' => __( 'Pass the field id', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					'form_id' => array(
						'description' => __( 'Pass the form id', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);
	}

	public function permissions_check_nonce( $request ) {
		// For non-WPCOM sites, require Jetpack connection
		if ( ! ( new Host() )->is_wpcom_simple() && ! ( new Manager() )->is_connected() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Site must be connected to WordPress.com', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$id       = $request->get_param( 'id' );
		$hash     = $request->get_param( 'hash' );
		$form_id  = $request->get_param( 'form_id' );
		$new_hash = wp_hash( $id . $form_id ); // in the future this could contain other info.
		return hash_equals( $new_hash, $hash );
	}

	public function get_nonce( $request ) {
		return wp_create_nonce( 'file_field' . $request->get_param( 'id' ) );
	}

	/**
	 * Checks if the site has the required Jetpack connection
	 *
	 * @pram WP_REST_Request $request Full data about the request.
	 *
	 * @return true|WP_Error True if the request has permission, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		$nonce_permission_check = $this->permissions_check_nonce( $request );
		if ( is_wp_error( $nonce_permission_check ) ) {
			return $nonce_permission_check;
		}

		if ( ! $nonce_permission_check ) {
			return false;
		}

		$id       = $request->get_param( 'id' );
		$nonce    = $request->get_param( '_nonce' );
		$verified = wp_verify_nonce( $nonce, 'file_field' . $id );

		if ( ! $verified ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Nonce verification failed', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return $verified;
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

		// we should probably check that the file has all the correct things.

		if ( ( new Host() )->is_wpcom_simple() ) {
			// Cloud handling.
			return apply_filters( 'jetpack_unauth_file_upload_response', new WP_REST_Response( array() ), $request );
		} else {

			$file = $files['file'];
			l( 'FILE SEND OVER!' );
			l( $file );

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

			// Handle file upload for Jetpack Forms
			return $this->handle_single_file_upload( $request, $file );
		}
	}

	private function get_upload_error_message( $file_error ) {
		return new WP_Error(
			'rest_upload_error',
			__( 'Failed to upload file.', 'jetpack' ),
			array( 'status' => 400 )
		);
	}

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
	 *
	 * todo: This should be its own class.
	 */
	private function get_secret_directory() {
		$jetpack_forms_dir = get_option( 'jetpack_forms_dir', false );
		if ( ! $jetpack_forms_dir ) {
			$jetpack_forms_dir = wp_generate_password( 64, false );
			update_option( 'jetpack_forms_dir', $jetpack_forms_dir );
		}
		return $jetpack_forms_dir;
	}

	private function handle_single_file_upload( $request, $file ) {
		// only one request per fle
		// Initialize an empty array for storing uploaded file paths
		$file_name  = $file_name = sanitize_file_name( wp_unslash( $file['name'] ) );
		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			// The 302 is to that we can help debug this error.
			return new WP_Error( 'dir_error', __( 'Unable to process file upload.', 'jetpack-forms' ) . ' [301] ', array( 'status' => 400 ) );
		}

		$jetpack_forms_dir = $upload_dir['basedir'] . '/jetpack-forms/' . $this->get_secret_directory() . '/temp';
		if ( ! file_exists( $jetpack_forms_dir ) ) {
			$create_dir = wp_mkdir_p( $jetpack_forms_dir );
			if ( ! $create_dir ) {
				// The 301 is to that we can help debug this error.
				return new WP_Error( 'dir_create', __( 'Unable to process file upload.', 'jetpack-forms' ) . ' [302] ', array( 'status' => 400 ) );
			}
		}

		$file_name = sanitize_file_name( wp_unslash( $file['name'] ) );
		$hash      = $request->get_param( 'hash' );
		// This is a temporary secret that will be used to move the file to the final location.
		$temporary_secret      = wp_hash( wp_rand( 100000, 999999 ) . microtime() );
		$secret_file_name_hash = wp_hash( $temporary_secret . $hash );
		$secret_file_name      = $secret_file_name_hash . '-' . $file_name;

		$new_secret__filename = wp_unique_filename( $jetpack_forms_dir, $secret_file_name );

		if ( $secret_file_name !== $new_secret__filename ) {
			// The 304 is to that we can help debug this error.
			return new WP_Error( 'file_exists', __( 'Unable to process file upload.', 'jetpack-forms' ) . ' [304] ', array( 'status' => 400 ) );
		}

		// Move uploaded file
		$move_result = move_uploaded_file( $file['tmp_name'], $jetpack_forms_dir . '/' . $new_secret__filename );
		if ( ! $move_result ) {
			// The 303 is to that we can help debug this error.
			return new WP_Error( 'file_move', __( 'Unable to process file upload.', 'jetpack-forms' ) . ' [303] ' . array( 'status' => 400 ) );
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'data'    => array(
					'filename' => ltrim( $new_secret__filename, $secret_file_name_hash . '-' ),
					'temp'     => $temporary_secret,
				),
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload' );
