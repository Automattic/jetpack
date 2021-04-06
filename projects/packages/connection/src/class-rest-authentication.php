<?php
/**
 * The Jetpack Connection Rest Authentication file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Jetpack Connection Rest Authentication class.
 */
class Rest_Authentication {

	/**
	 * The rest authentication status.
	 *
	 * @since 8.9.0
	 * @var boolean
	 */
	private $rest_authentication_status = null;

	/**
	 * The Manager object.
	 *
	 * @since 8.9.0
	 * @var Object
	 */
	private $connection_manager = null;

	/**
	 * Holds the singleton instance of this class
	 *
	 * @since 8.9.0
	 * @var Object
	 */
	private static $instance = false;

	/**
	 * Flag used to avoid determine_current_user filter to enter an infinite loop
	 *
	 * @since 9.7.0
	 * @var boolean
	 */
	private $doing_determine_current_user_filter = false;

	/**
	 * The constructor.
	 */
	private function __construct() {
		$this->connection_manager = new Manager();
	}

	/**
	 * Controls the single instance of this class.
	 *
	 * @static
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new self();

			add_filter( 'determine_current_user', array( self::$instance, 'wp_rest_authenticate' ) );
			add_filter( 'rest_authentication_errors', array( self::$instance, 'wp_rest_authentication_errors' ) );
		}

		return self::$instance;
	}

	/**
	 * Authenticates requests from Jetpack server to WP REST API endpoints.
	 * Uses the existing XMLRPC request signing implementation.
	 *
	 * @param int|bool $user User ID if one has been determined, false otherwise.
	 *
	 * @return int|null The user id or null if the request was not authenticated.
	 */
	public function wp_rest_authenticate( $user ) {
		if ( $this->doing_determine_current_user_filter || ! empty( $user ) ) {
			// Another authentication method is in effect.
			return $user;
		}

		$this->initialize_determine_current_user_filter();

		add_filter(
			'jetpack_constant_default_value',
			__NAMESPACE__ . '\Utils::jetpack_api_constant_filter',
			10,
			2
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['_for'] ) || 'jetpack' !== $_GET['_for'] ) {
			// Nothing to do for this authentication method.
			return $this->return_determine_current_user_filter();
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['token'] ) && ! isset( $_GET['signature'] ) ) {
			// Nothing to do for this authentication method.
			return $this->return_determine_current_user_filter();
		}

		if ( ! isset( $_SERVER['REQUEST_METHOD'] ) ) {
			$this->rest_authentication_status = new \WP_Error(
				'rest_invalid_request',
				__( 'The request method is missing.', 'jetpack' ),
				array( 'status' => 400 )
			);
			return $this->return_determine_current_user_filter();
		}

		// Only support specific request parameters that have been tested and
		// are known to work with signature verification.  A different method
		// can be passed to the WP REST API via the '?_method=' parameter if
		// needed.
		if ( 'GET' !== $_SERVER['REQUEST_METHOD'] && 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
			$this->rest_authentication_status = new \WP_Error(
				'rest_invalid_request',
				__( 'This request method is not supported.', 'jetpack' ),
				array( 'status' => 400 )
			);
			return $this->return_determine_current_user_filter();
		}
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] && ! empty( file_get_contents( 'php://input' ) ) ) {
			$this->rest_authentication_status = new \WP_Error(
				'rest_invalid_request',
				__( 'This request method does not support body parameters.', 'jetpack' ),
				array( 'status' => 400 )
			);
			return $this->return_determine_current_user_filter();
		}

		$verified = $this->connection_manager->verify_xml_rpc_signature();

		if (
			$verified &&
			isset( $verified['type'] ) &&
			'user' === $verified['type'] &&
			! empty( $verified['user_id'] )
		) {
			// Authentication successful.
			$this->rest_authentication_status = true;
			return $this->return_determine_current_user_filter( $verified['user_id'] );
		}

		// Something else went wrong.  Probably a signature error.
		$this->rest_authentication_status = new \WP_Error(
			'rest_invalid_signature',
			__( 'The request is not signed correctly.', 'jetpack' ),
			array( 'status' => 400 )
		);
		return $this->return_determine_current_user_filter();
	}

	/**
	 * Resets determine_current_user filter infinite loop control and returns the value
	 *
	 * @since 9.7.0
	 *
	 * @param mixed $value The value to be returned.
	 * @return mixed
	 */
	private function return_determine_current_user_filter( $value = null ) {
		$this->doing_determine_current_user_filter = false;
		return $value;
	}

	/**
	 * Initializes determine_current_user filter infinite loop control
	 *
	 * @since 9.7.0
	 *
	 * @return void
	 */
	private function initialize_determine_current_user_filter() {
		$this->doing_determine_current_user_filter = true;
	}

	/**
	 * Report authentication status to the WP REST API.
	 *
	 * @param  WP_Error|mixed $value Error from another authentication handler, null if we should handle it, or another value if not.
	 * @return WP_Error|boolean|null {@see WP_JSON_Server::check_authentication}
	 */
	public function wp_rest_authentication_errors( $value ) {
		if ( null !== $value ) {
			return $value;
		}
		return $this->rest_authentication_status;
	}

	/**
	 * Resets the saved authentication state in between testing requests.
	 */
	public function reset_saved_auth_state() {
		$this->rest_authentication_status = null;
		$this->connection_manager->reset_saved_auth_state();
	}
}
