<?php
/**
 * The Jetpack Connection Protected Owner Error Handler class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

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
class Protected_Owner_Error_Handler {

	/**
	 * The name of the option that stores the error
	 *
	 * @since $$next-version$$
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_protected_owner_error';

	/**
	 * The authenticated user ID from the current API request
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	private $authenticated_user_id;

	/**
	 * Holds the instance of this singleton class
	 *
	 * @since $$next-version$$
	 *
	 * @var Protected_Owner_Error_Handler $instance
	 */
	private static $instance = null;

	/**
	 * Initialize instance and register hooks
	 *
	 * @since $$next-version$$
	 */
	private function __construct() {

		// Register hooks for handling errors
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		// Handle verified errors on admin pages
		add_action( 'admin_init', array( $this, 'handle_verified_errors' ) );

		// Clear errors on reconnection or token updates
		add_action( 'jetpack_site_registered', array( $this, 'delete_error' ) );
		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		add_filter( 'jetpack_connection_delete_all_tokens', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		// Maybe remove?
		add_action( 'jetpack_unlinked_user', array( $this, 'delete_error' ) );
		add_action( 'jetpack_updated_user_token', array( $this, 'delete_error' ) );
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

		// Store the error immediately since it came from WordPress.com
		$this->store_error( $error_data );
		return rest_ensure_response( array( 'success' => true ) );
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
	 * Store an error in the database
	 *
	 * @since $$next-version$$
	 *
	 * @param array $error_data The error data to store.
	 * @return bool Whether the error was successfully stored.
	 */
	public function store_error( $error_data ) {
		// Format the error in the same structure as Error_Handler
		$error_type = $error_data['error_type'];
		$user_id    = isset( $error_data['authenticated_user_id'] ) ? $error_data['authenticated_user_id'] : '0';

		// Create similar structure to Error_Handler errors
		$formatted_errors = array(
			$error_type => array(
				$user_id => array(
					'error_code' => $error_type,
					'user_id'    => $user_id,
					'error_data' => $error_data,
					'timestamp'  => $error_data['timestamp'],
					'nonce'      => wp_generate_password( 10, false ),
					'error_type' => 'protected_owner',
				),
			),
		);

		// Note: This completely replaces any previously stored errors with the new error.
		// Only one error will be stored at a time.
		return update_option( self::STORED_ERRORS_OPTION, $formatted_errors );
	}

	/**
	 * Get the stored error from the database
	 *
	 * @since $$next-version$$
	 *
	 * @return array|false The stored error or false if no error is stored.
	 */
	public function get_error() {
		$error = get_option( self::STORED_ERRORS_OPTION, false );

		// Return early if no error is stored.
		if ( ! $error ) {
			return false;
		}

		// Check if this is a self-healing error.
		$error_type         = key( $error );
		$user_error         = reset( $error[ $error_type ] );
		$is_self_heal_error = isset( $user_error['error_code'] ) && 'self_heal_protected_owner_missing' === $user_error['error_code'];

		// If this is a self-healing error, check if a master user exists.
		if ( $is_self_heal_error ) {
			$master_user_id = \Jetpack_Options::get_option( 'master_user' );

			// If a master user exists, the self-healing error is no longer valid.
			if ( $master_user_id && get_userdata( $master_user_id ) ) {
				$this->delete_error();
				return false;
			}
		}

		return $error;
	}

	/**
	 * Handle verified errors by adding them to the admin notices
	 *
	 * @since $$next-version$$
	 */
	public function handle_verified_errors() {
		$error = $this->get_error();
		if ( $error ) {
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
				return __( 'The WordPress.com owner account exists on this site but is not the connection owner.', 'jetpack-connection' );
			case 'wrong_owner_protected_owner_missing':
				return __( 'The WordPress.com owner account does not exist on this site.', 'jetpack-connection' );
			case 'self_heal_protected_owner_missing':
				return __( 'WordPress.com detected that the owner account is missing.', 'jetpack-connection' );
			default:
				return __( 'There is an issue with the protected owner account connection.', 'jetpack-connection' );
		}
	}

	/**
	 * Delete stored error
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function delete_error() {
		delete_option( self::STORED_ERRORS_OPTION );
	}

	/**
	 * Filter callback to delete error and return the unfiltered value
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $value The value to return.
	 * @return mixed The unfiltered value.
	 */
	public function delete_error_and_return_unfiltered_value( $value ) {
		$this->delete_error();
		return $value;
	}

	/**
	 * Display a generic admin notice for connection errors
	 *
	 * @since $$next-version$$
	 */
	public function generic_admin_notice_error() {
		$error = $this->get_error();
		if ( ! $error || ! isset( $error['error_type'] ) ) {
			return;
		}

		$error_type = $error['error_type'];
		$message    = $this->get_error_message( $error_type );

		?>
		<div class="notice notice-error jetpack-connection-error">
			<p><?php echo esc_html( $message ); ?></p>
			<p>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack#/connection/owner' ) ); ?>" class="button button-primary">
					<?php esc_html_e( 'Fix Connection', 'jetpack-connection' ); ?>
				</a>
			</p>
		</div>
		<?php
	}

	/**
	 * Add error details to the Jetpack React dashboard
	 *
	 * @since $$next-version$$
	 *
	 * @param array $errors Current errors array.
	 * @return array Updated errors array.
	 */
	public function jetpack_react_dashboard_error( $errors ) {
		$stored_errors = $this->get_error();

		if ( ! $stored_errors || empty( $stored_errors ) ) {
			return $errors;
		}

		// Since only one error is stored at a time, we can directly access its components.
		$error_type = key( $stored_errors );
		if ( empty( $error_type ) ) {
			return $errors;
		}

		// Get the user's error in this error type.
		$user_error = reset( $stored_errors[ $error_type ] );
		if ( empty( $user_error ) || ! isset( $user_error['error_code'] ) ) {
			return $errors;
		}

		$error_code = $user_error['error_code'];
		// Generate the error message from the error code
		$error_message = $this->get_error_message( $error_code );

		/**
		 * Determine the appropriate action based on error type.
		 * These actions will be handled by the React frontend to show different UI components:
		 * - 'reconnect': Standard reconnect flow for general connection errors
		 * - 'self_heal_action': Specialized UI for self-healing the connection when protected owner account is missing
		 * - 'protected_owner_action': Specialized UI for fixing protected owner account mismatches
		 */
		$action = 'reconnect'; // Default action

		// Self-heal errors get the self_heal_action
		// Protected owner errors (except self-heal) get the protected_owner_action
		if ( 'self_heal_protected_owner_missing' === $error_code ) {
			$action = 'self_heal_action';
		} elseif ( strpos( $error_code, 'owner_' ) === 0 || strpos( $error_code, 'wrong_owner_' ) === 0 ) {
			$action = 'protected_owner_action';
		}

		$errors[] = array(
			'code'    => 'connection_error',
			'message' => $error_message,
			'action'  => $action,
			'data'    => array( 'api_error_code' => $error_code ),
		);

		return $errors;
	}

	/**
	 * Check if there are any self-heal protected owner errors
	 *
	 * @since $$next-version$$
	 *
	 * @return bool True if there are self-heal errors, false otherwise
	 */
	public function has_self_heal_errors() {
		$error = $this->get_error();
		if ( ! $error ) {
			return false;
		}

		return isset( $error['request_type'] ) && 'self-heal' === $error['request_type'];
	}
}
