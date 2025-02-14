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
			$this->rest_base,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_upload' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
	}

	/**
	 * Checks if the site has the required Jetpack connection
	 *
	 * @return true|WP_Error True if the request has permission, WP_Error object otherwise.
	 */
	public function permissions_check() {
		l('hola');
		l($_REQUEST);
		l($_FILES);
		// For non-WPCOM sites, require Jetpack connection
		if ( ! ( new Host() )->is_wpcom_simple() && ! ( new Manager() )->is_connected() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Site must be connected to WordPress.com', 'jetpack' ),
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
		error_log( 'DEBUG Jetpack Forms Upload - Request received' );
		error_log( 'DEBUG Jetpack Forms Upload - Files: ' . print_r( $_FILES, true ) );
		error_log( 'DEBUG Jetpack Forms Upload - POST: ' . print_r( $_POST, true ) );
		error_log( 'DEBUG Jetpack Forms Upload - Request params: ' . print_r( $request->get_params(), true ) );
		error_log( 'DEBUG Jetpack Forms Upload - Request files: ' . print_r( $request->get_file_params(), true ) );
		error_log( 'DEBUG Jetpack Forms Upload - Raw data: ' . print_r( $request->get_body(), true ) );
		error_log( 'DEBUG Jetpack Forms Upload - Content Type: ' . $_SERVER['CONTENT_TYPE'] );

		// Get the uploaded file
		$files = $request->get_file_params();
		error_log( 'DEBUG Jetpack Forms Upload - Files from request: ' . print_r( $files, true ) );

		if ( empty( $files ) || empty( $files['file'] ) ) {
			error_log( 'DEBUG Jetpack Forms Upload - No file found in request' );
			return new WP_Error(
				'rest_missing_callback_param',
				__( 'No file was uploaded.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$file = $files['file'];
		error_log( 'DEBUG Jetpack Forms Upload - Processing file: ' . print_r( $file, true ) );

		if ( ( new Host() )->is_wpcom_simple() ) {
			// Direct handling on WPCOM
			return $this->process_upload( $request );
		} else {
			// For Jetpack sites, just proxy the temporary file directly to WPCOM
			return $this->proxy_request_to_wpcom( $request );
		}
	}

	/**
	 * Process the upload on WPCOM
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	private function process_upload() {
		error_log( 'DEBUG Jetpack Forms Upload - Processing upload on WPCOM' );
		// This method will only be called on WPCOM
		// Implementation will include:
		// 1. File validation
		// 2. Akismet scanning
		// 3. Storage handling
		// 4. Response generation

		// This is a placeholder - actual implementation will be on WPCOM
		return new WP_Error(
			'not_implemented',
			__( 'This method should only be implemented on WordPress.com', 'jetpack' ),
			array( 'status' => 501 )
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload' );
