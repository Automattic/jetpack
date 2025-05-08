<?php
/**
 * The Jetpack Connection Protected Owner Error Handler class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

// Manually require the base class until the autoloader includes it.
require_once __DIR__ . '/class-base-error-handler.php';

/**
 * The Jetpack Connection Protected Owner Error Handler class.
 *
 * This class handles errors related to protected owner accounts in the Jetpack Connection.
 * It processes and stores owner account errors received from WordPress.com.
 *
 * The class accepts two types of requests:
 * 1. Connection owner mismatch requests - When WordPress.com detects that the current connection owner
 *    has a different email than the protected owner account. These requests are authenticated using
 *    a user token to verify the requester's identity.
 * 2. Self-healing requests - When WordPress.com detects that no owner is connected and the protected
 *    owner email is missing in the local database. These requests are authenticated using a blog token
 *    since there is no connected owner to provide a user token.
 *
 * @since $$next-version$$
 */
class Protected_Owner_Error_Handler extends Base_Error_Handler {

	/**
	 * The name of the option that stores the errors
	 *
	 * @since $$next-version$$
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_protected_owner_errors';

	/**
	 * The name of the option that stores the verified errors
	 *
	 * @since $$next-version$$
	 *
	 * @var string
	 */
	const STORED_VERIFIED_ERRORS_OPTION = 'jetpack_connection_protected_owner_verified_errors';

	/**
	 * The authenticated user ID from the current API request
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	private $authenticated_user_id;

	/**
	 * Initialize instance and register hooks
	 *
	 * @since $$next-version$$
	 */
	private function __construct() {
		parent::__construct();

		// Initialize protected owner specific properties
		$this->authenticated_user_id = 0;
	}

	/**
	 * Gets the instance of this singleton class
	 *
	 * @return Protected_Owner_Error_Handler $instance
	 */
	public static function get_instance() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Register REST API routes
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		$this->register_protected_owner_error_endpoints();
	}

	/**
	 * Register REST API endpoints for protected account owner error notifications from WPcom.
	 *
	 * Two separate endpoints are provided:
	 * 1. /protected_owner_mismatch - For handling connection owner mismatch requests
	 *    - Requires user token authentication
	 *    - Requires both protected_owner_account_email and requester_account_email
	 *
	 * 2. /protected_owner_self_heal - For handling self-healing requests
	 *    - Requires blog token authentication
	 *    - Requires only protected_owner_account_email
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function register_protected_owner_error_endpoints() {
		// Endpoint for connection owner mismatch requests
		register_rest_route(
			'jetpack/v4',
			'/protected_owner_mismatch',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'store_protected_owner_error' ),
				'permission_callback' => array( $this, 'protected_owner_mismatch_permission_check' ),
				'args'                => array(
					'protected_owner_account_email' => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'The email address of the protected account owner on WordPress.com',
					),
					'requester_account_email'       => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'The email address of the requester trying to claim ownership',
					),
				),
			)
		);

		// Endpoint for self-healing requests
		register_rest_route(
			'jetpack/v4',
			'/protected_owner_self_heal',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'store_protected_owner_error' ),
				'permission_callback' => array( $this, 'protected_owner_self_heal_permission_check' ),
				'args'                => array(
					'protected_owner_account_email' => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'The email address of the protected account owner on WordPress.com',
					),
				),
			)
		);
	}

	/**
	 * Permission callback for self-healing requests
	 * Ensures the request is authenticated with a valid blog token
	 *
	 * @since $$next-version$$
	 *
	 * @return bool|\WP_Error True if request has valid authentication, WP_Error otherwise
	 */
	public function protected_owner_self_heal_permission_check() {
		if ( ! Rest_Authentication::is_signed_with_blog_token() ) {
			return new \WP_Error(
				'invalid_permission_protected_owner_error',
				'Self-heal requests must be signed with a valid blog token',
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Permission callback for protected owner mismatch requests
	 * Ensures the request is authenticated with a valid user token
	 *
	 * @since $$next-version$$
	 *
	 * @return bool|\WP_Error True if request has valid authentication, WP_Error otherwise
	 */
	public function protected_owner_mismatch_permission_check() {
		if ( ! Rest_Authentication::is_signed_with_user_token() ) {
			return new \WP_Error(
				'invalid_permission_protected_owner_error',
				'Protected owner mismatch requests must be signed with a valid user token',
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// Get the user ID from the authentication token
		// The user ID is already set by Rest_Authentication::wp_rest_authenticate
		// when the token is verified
		$user_id = apply_filters( 'determine_current_user', false );
		if ( ! $user_id || ! is_numeric( $user_id ) ) {
			return new \WP_Error(
				'invalid_user_id_from_token',
				'Unable to determine user ID from token',
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// Store the authenticated user ID for later use
		$this->authenticated_user_id = $user_id;

		return true;
	}

	/**
	 * Store protected owner error sent from WordPress.com
	 * This method handles both protected owner mismatch and self-healing requests
	 *
	 * @since $$next-version$$
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error The response object or WP_Error on failure.
	 */
	public function store_protected_owner_error( \WP_REST_Request $request ) {
		$protected_owner_email = $request->get_param( 'protected_owner_account_email' );
		$requester_email       = $request->get_param( 'requester_account_email' ) ?? null;
		$request_type          = $requester_email ? 'mismatch' : 'self-heal';

		// Process the error based on request type
		if ( 'mismatch' === $request_type ) {
			$error_data = $this->process_protected_wpcom_owner_error(
				$protected_owner_email,
				$requester_email,
				$this->authenticated_user_id
			);
		} else {
			// For self-heal requests
			$user_with_protected_email = get_user_by( 'email', $protected_owner_email );
			if ( $user_with_protected_email ) {
				// If user exists with the protected email, no need for self-healing
				return rest_ensure_response(
					array(
						'success' => true,
						'message' => 'User with protected email exists',
					)
				);
			}

			$error_data = array(
				'protected_owner_email' => $protected_owner_email,
				'error_type'            => 'self_heal_protected_owner_missing',
				'request_type'          => 'self-heal',
				'timestamp'             => time(),
			);
		}

		if ( ! $error_data ) {
			return new \WP_Error(
				'invalid_protected_owner_error',
				__( 'The protected owner error could not be processed.', 'jetpack-connection' ),
				array( 'status' => 400 )
			);
		}

		// Create a WP_Error object to store
		$error = new \WP_Error(
			'protected_owner_error',
			__( 'Protected owner account error.', 'jetpack-connection' ),
			array(
				'user_id'    => $this->authenticated_user_id,
				'error_data' => $error_data,
			)
		);

		// Store the error as verified immediately since it came from WordPress.com
		$stored_error = $this->store_error( $error );
		if ( $stored_error ) {
			$this->verify_error( $stored_error );
			return rest_ensure_response( array( 'success' => true ) );
		}

		return new \WP_Error(
			'error_storage_failed',
			__( 'Failed to store the protected owner error.', 'jetpack-connection' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Process the protected owner error notification
	 *
	 * @since $$next-version$$
	 *
	 * @param string $protected_owner_email The email address of the protected account owner.
	 * @param string $requester_email The email address of the requester.
	 * @param int    $authenticated_user_id The WP user ID of the authenticated user.
	 * @return array|false The processed error data to be stored, or false if invalid
	 */
	public function process_protected_wpcom_owner_error( $protected_owner_email, $requester_email, $authenticated_user_id ) {
		// Check if the authenticated user is the master user (connection owner)
		$master_user_id = \Jetpack_Options::get_option( 'master_user' );

		// If authenticated user is not the master user, return early
		if ( $authenticated_user_id !== $master_user_id ) {
			return false;
		}

		// Get the master user email
		$master_user = get_userdata( $master_user_id );
		if ( ! $master_user ) {
			return false;
		}

		$master_user_email = $master_user->user_email;
		$error_data        = array(
			'protected_owner_email' => $protected_owner_email,
			'requester_email'       => $requester_email,
			'authenticated_user_id' => $authenticated_user_id,
			'timestamp'             => time(),
		);

		// Determine error type based on email comparisons
		if ( $master_user_email === $protected_owner_email ) {
			$error_data['error_type'] = 'owner_connected_wrong_wpcom_account';
		} elseif ( $master_user_email === $requester_email ) {
			$user_with_protected_email = get_user_by( 'email', $protected_owner_email );
			$error_data['error_type']  = $user_with_protected_email
				? 'wrong_owner_protected_owner_exists'
				: 'wrong_owner_protected_owner_missing';

			if ( $user_with_protected_email ) {
				$error_data['protected_owner_user_id'] = $user_with_protected_email->ID;
			}
		} else {
			$error_data['error_type'] = 'unknown_owner_error';
		}

		return $error_data;
	}

	/**
	 * Handle verified errors by adding them to the admin notices
	 *
	 * @since $$next-version$$
	 */
	public function handle_verified_errors() {
		$verified_errors = $this->get_verified_errors();
		if ( isset( $verified_errors['protected_owner_error'] ) ) {
			add_action( 'admin_notices', array( $this, 'generic_admin_notice_error' ) );
			add_action( 'react_connection_errors_initial_state', array( $this, 'jetpack_react_dashboard_error' ) );
		}
	}

	/**
	 * Get a user-friendly error message based on the error type
	 *
	 * @since $$next-version$$
	 *
	 * @param string $error_type The type of error.
	 * @return string The error message.
	 */
	protected function get_error_message( $error_type ) {
		switch ( $error_type ) {
			case 'owner_connected_wrong_wpcom_account':
				return __( 'The current connection owner has connected with a different WordPress.com account than the protected owner.', 'jetpack-connection' );
			case 'wrong_owner_protected_owner_exists':
				return __( 'The protected owner account exists on this site but is not the connection owner.', 'jetpack-connection' );
			case 'wrong_owner_protected_owner_missing':
				return __( 'The protected owner account does not exist on this site.', 'jetpack-connection' );
			case 'self_heal_protected_owner_missing':
				return __( 'WordPress.com detected a protected owner account issue that needs attention.', 'jetpack-connection' );
			default:
				return __( 'There is an issue with the protected owner account connection.', 'jetpack-connection' );
		}
	}

	/**
	 * Send the error to WordPress.com for verification
	 *
	 * @since $$next-version$$
	 *
	 * @param array $error_array The error to send.
	 * @return bool
	 */
	public function send_error_to_wpcom( $error_array ) {
		// No need to send to WordPress.com as these errors already come from WordPress.com
		$this->verify_error( $error_array );
		return true;
	}

	/**
	 * Check if there are any self-heal protected owner errors
	 *
	 * @since $$next-version$$
	 *
	 * @return bool True if there are self-heal errors, false otherwise
	 */
	public function has_self_heal_errors() {
		$verified_errors = $this->get_verified_errors();
		if ( ! isset( $verified_errors['protected_owner_error'] ) ) {
			return false;
		}

		// Get the first protected owner error
		$error = reset( $verified_errors['protected_owner_error'] );
		return isset( $error['error_data']['request_type'] ) && 'self-heal' === $error['error_data']['request_type'];
	}
}
