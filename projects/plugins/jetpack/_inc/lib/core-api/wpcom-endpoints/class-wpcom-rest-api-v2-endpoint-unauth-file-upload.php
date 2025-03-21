<?php
/**
 * Unauthenticated File Upload endpoint for the WordPress.com REST API.
 *
 * A generic endpoint that allows unauthenticated users to upload files.
 * Security is handled through a Jetpack-specific upload nonce that must be generated with a context.
 *
 * Example usage:
 * $nonce = wp_create_nonce('jetpack_file_upload_' . $context);
 * // Use nonce in X-Jetpack-Upload-Nonce header
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Host;
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
		add_filter( 'rest_pre_serve_request', [ $this, 'add_cors_headers' ], 10, 4 );
	}

	public function add_cors_headers( bool $served, WP_HTTP_Response $result, WP_REST_Request $request, WP_REST_Server $server ): bool {
		l( 'add_cors_headers START', $request->get_route()  );

		if ( ! $this->matches_endpoint_route( $request->get_route() ) ) {
			return $served;
		}

		if ( $this->is_preflight() ) { // phpcs:ignore
			header( 'Access-Control-Allow-Origin: *', true, 204 );
			header( 'Access-Control-Allow-Methods: POST, OPTIONS', true, 204 );
			header( 'Access-Control-Allow-Headers: Authorization, Content-Type,Referer, X-Requested-With, X-WP-Nonce, X-Jetpack-Upload-Nonce', true, 204 );
			header( 'Access-Control-Allow-Credentials: true', true, 204 );
			l( 'preflight request! >>>>' );
			return true;
			exit;
		}

		$origin = $request->get_header( 'Origin' );
		if ( $origin && $this->verify_origin( $origin ) ) {
			header( 'Access-Control-Allow-Origin: *', true, 204 );
			header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS', true, 204 );
			header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With, X-WP-Nonce, X-Jetpack-Upload-Nonce', true, 204 );
			header( 'Access-Control-Allow-Credentials: true', true, 204 );
			l( 'REGULAR request! >>>' );
			return true;
		}
		l( 'add_cors_headers END!' );
		return $served;
	}

	/**
	 * Is the request a preflight request? Checks the request method
	 *
	 * @return boolean
	 */
	protected function is_preflight() {
		return isset( $_SERVER['REQUEST_METHOD'], $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'], $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'], $_SERVER['HTTP_ORIGIN'] ) && 'OPTIONS' === $_SERVER['REQUEST_METHOD'];
	}

	private function matches_endpoint_route( string $route, string $path = '(/remove)?' ): bool {
		$endpoint_route = $this->namespace . '/sites/\d+' . $this->rest_base . $path;
		$endpoint_route_pattern = '/' . ltrim( $endpoint_route, '/' );
		return preg_match("#^$endpoint_route_pattern$#", $route ) === 1;
	}

	private function verify_origin( $origin ) {
		// TODO: Add more checks to make sure that the site is a .com simple site.
		return true;
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
		l( 'permissions_check ...' );
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
		l( 'permissions_check_params ...' );
		// Check the wp_rest upload nonce
		$upload_nonce = $request->get_header( 'X-WP-Nonce' );
		l(
			' $upload_nonce : '.  $upload_nonce
		);

		if ( ! $upload_nonce ) {
			l( 'permissions_check_params ... missing_WP_nonce' );
			return new WP_Error(
				'missing_upload_nonce',
				__( 'wp rest nonce is required.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		// Verify the upload nonce with its context
		$context = $request->get_param( 'context' );
		// Check the Jetpack upload nonce
		$upload_nonce = $request->get_header( 'X-Jetpack-Upload-Nonce' );
		l( $upload_nonce , $context );
		if ( ! $upload_nonce ) {
			l( 'permissions_check_params ... missing_upload_nonce' );
			return new WP_Error(
				'missing_upload_nonce',
				__( 'Jetpack upload nonce is required.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		l( 'permissions_check_params ...!!!!' );
		l( $upload_nonce , $context );
		if ( ! wp_verify_nonce( $upload_nonce, 'jetpack_file_upload_' . $context ) ) {
			l( 'permissions_check_params ... invalid_upload_nonce' );
			return new WP_Error(
				'invalid_upload_nonce',
				__( 'Invalid Jetpack upload nonce.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// // Check if this is a WPCOM Simple site
		// if ( ( new Host() )->is_wpcom_simple() ) {
		// 	l( 'permissions_check_params ... is_wpcom_simple' );
		// 	return new WP_Error(
		// 		'rest_forbidden',
		// 		__( 'Jetpack sites only endpoint.', 'jetpack' ),
		// 		array( 'status' => 403 )
		// 	);
		// }

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
			l( 'permissions_check_params ... ip_check' );
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
		l( 'handle_upload ...' );
		$files   = $request->get_file_params();
		$file    = $files['file'];
		$context = $request->get_param( 'context' );

		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-unauth-file-upload-handler.php';

		$upload_handler = new Unauth_File_Upload_Handler();
		// $result = $upload_handler->handle_local_file_upload( $file, $context );
		l( $file );
		return [
			'success' => true,
			'data'    => 'hello',
		];
		if ( is_wp_error( $result ) ) {
			// Add proper HTTP status codes based on error type
			$status = 400; // Default to 400 Bad Request
			switch ( $result->get_error_code() ) {
				case 'upload_error':
				case 'invalid_file_type':
				case 'file_size_limit':
					$status = 400; // Bad Request
					break;
				case 'max_files_limit':
				case 'total_size_limit':
					$status = 507; // Insufficient Storage
					break;
				case 'dir_error':
				case 'dir_create':
				case 'file_move':
					$status = 500; // Internal Server Error
					break;
			}
			$result->add_data( array( 'status' => $status ) );
			return $result;
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'data'    => $result,
			)
		);
	}
	/**
	 * Removes the file from the server that was temprary added.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function remove_file( $request ) {
		l( 'remove_file ...' );
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-unauth-file-upload-handler.php';
		$upload_handler = new Unauth_File_Upload_Handler();

		$token = $request->get_param( 'token' );

		$upload_handler->remove_file( $token );

		return rest_ensure_response(
			array(
				'success' => true,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Unauth_File_Upload' );
