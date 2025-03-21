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
		add_filter( 'rest_pre_serve_request', array( $this, 'add_cors_headers' ), 10, 4 );
	}

	/**
	 * Adds CORS headers to the preflight response.
	 *
	 * @param bool             $served Whether the request has been served.
	 * @param WP_HTTP_Response $result Result to send to the client. Usually a WP_REST_Response.
	 * @param WP_REST_Request  $request Request used to generate the response.
	 * @param WP_REST_Server   $server Server instance.
	 * @return bool
	 */
	public function add_cors_headers( bool $served, WP_HTTP_Response $result, WP_REST_Request $request, WP_REST_Server $server ): bool {
		if ( ! $this->matches_endpoint_route( $request->get_route() ) ) {
			return $served;
		}

		if ( $this->is_preflight() ) { // phpcs:ignore
			$server->send_header( 'Access-Control-Allow-Origin', '*' ); // Todo: Should we allow only some origins?
			$server->send_header( 'Access-Control-Allow-Methods', 'POST, OPTIONS' );
			$server->send_header( 'Access-Control-Allow-Headers', 'Authorization, Content-Type,Referer, X-Requested-With, X-WP-Nonce, X-Jetpack-Upload-Nonce' );
			$server->send_header( 'Access-Control-Allow-Credentials', 'true' );
		}

		return $served;
	}

	/**
	 * Is the request a preflight request? Checks the request method
	 *
	 * @return boolean
	 */
	protected function is_preflight() {
		return (
			isset( $_SERVER['REQUEST_METHOD'] ) &&
			isset( $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ) &&
			isset( $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ) &&
			isset( $_SERVER['HTTP_ORIGIN'] ) &&
			'OPTIONS' === $_SERVER['REQUEST_METHOD']
		);
	}
	/**
	 * Checks that the endpoint is the one that we want.
	 *
	 * @param string $route The route to check.
	 * @param string $path The path to check.
	 * @return bool
	 */
	private function matches_endpoint_route( string $route, string $path = '(/remove)?' ): bool {
		$endpoint_route         = $this->namespace . '/sites/\d+' . $this->rest_base . $path;
		$endpoint_route_pattern = '/' . ltrim( $endpoint_route, '/' );
		return preg_match( "#^$endpoint_route_pattern$#", $route ) === 1;
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
	 * Set the user id from the cookie if the user is not logged in.
	 *
	 * @param int    $uid The user id.
	 * @param string $action The action.
	 *
	 * @return int|null The user id.
	 */
	public function set_uid_from_cookie( $uid, $action ) {
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return $uid;
		}

		// Only check the jetpack_file_upload_ action.
		if ( ! str_starts_with( $action, 'jetpack_file_upload_' ) ) {
			return $uid;
		}

		// If we are logged in already. Then there is nothing to change.
		if ( get_current_user_id() ) {
			return $uid;
		}

		if ( ! isset( $_COOKIE['wp_api_sec'] ) ) {
			return $uid;
		}

		$wp_api_sec_cookie = wp_unslash( $_COOKIE['wp_api_sec'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		return wp_validate_auth_cookie( $wp_api_sec_cookie, 'secure_auth' );
	}

	/**
	 * Checks if the request has permission to upload files
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has permission, WP_Error object otherwise.
	 */
	public function permissions_check_params( $request ) {
		add_filter( 'nonce_user_logged_out', array( $this, 'set_uid_from_cookie' ), 10, 2 );
		// Check the wp_rest upload nonce
		$upload_nonce = $request->get_header( 'X-WP-Nonce' );

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
		$upload_nonce = $request->get_header( 'X-Jetpack-Upload-Nonce' );

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

		remove_filter( 'nonce_user_logged_out', array( $this, 'set_uid_from_cookie' ), 10 );

		// Check if this is a WPCOM Simple site
		if ( ( new Host() )->is_wpcom_simple() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Jetpack sites only endpoint.', 'jetpack' ),
				array( 'status' => 403 )
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
		$files   = $request->get_file_params();
		$file    = $files['file'];
		$context = $request->get_param( 'context' );

		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-unauth-file-upload-handler.php';

		$upload_handler = new Unauth_File_Upload_Handler();
		$result         = $upload_handler->handle_local_file_upload( $file, $context );

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
