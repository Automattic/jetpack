<?php
/**
 * Protected Owner Permission Handler functionality for wpcomsh.
 *
 * @package wpcomsh
 */

namespace Automattic\WPComSH\Connection;

// Use the local Atomic_Persistent_Data class instead of the Jetpack one
use Atomic_Persistent_Data;

/**
 * Class to handle Protected Owner permission operations.
 *
 * This class provides the backend functionality for fixing protected owner errors
 * by using the Atomic Persistent Data class.
 */
class Protected_Owner_Permission_Handler {

	/**
	 * The key used in the Atomic Persistent Data file for protected owner fixes.
	 *
	 * @var string
	 */
	const FIX_DATA_KEY = 'protected_owner_fix';

	/**
	 * The singleton instance.
	 *
	 * @var Protected_Owner_Permission_Handler
	 */
	private static $instance = null;

	/**
	 * Atomic Persistent Data instance.
	 *
	 * @var Atomic_Persistent_Data
	 */
	private $atomic_data = null;

	/**
	 * Constructor
	 */
	private function __construct() {
		// Register the REST API endpoint
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		// Initialize Atomic_Persistent_Data
		try {
			$this->atomic_data = new Atomic_Persistent_Data();
		} catch ( \Exception $e ) {
			// Log the error but continue - we'll create the instance when needed in methods
			error_log( 'Protected Owner Permission Handler: Error initializing Atomic_Persistent_Data: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}

	/**
	 * Get the singleton instance.
	 *
	 * @return Protected_Owner_Permission_Handler
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Register REST API endpoints.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'wpcomsh/v1',
			'/protected-owner-fix',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'fix_protected_owner' ),
				'permission_callback' => array( $this, 'permission_callback' ),
				'args'                => array(
					'fix_type'   => array(
						'required'          => true,
						'type'              => 'string',
						'enum'              => array( 'permanent' ),
						'sanitize_callback' => 'sanitize_text_field',
						'description'       => 'Permission to recreate missing protected owner account',
					),
					'error_code' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'description'       => 'The error code being fixed',
					),
					'error_data' => array(
						'required'    => false,
						'type'        => 'object',
						'description' => 'Additional error data',
					),
				),
			)
		);
	}

	/**
	 * Permission callback for the REST API endpoint.
	 * Only site administrators can fix protected owner issues.
	 *
	 * @return bool Whether the current user has permission.
	 */
	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Apply a protected owner fix and store it in the Atomic Persistent Data file.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function fix_protected_owner( $request ) {
		$error_code = $request->get_param( 'error_code' );
		$error_data = $request->get_param( 'error_data' );

		// Get current user information
		$current_user = wp_get_current_user();
		if ( ! $current_user || ! $current_user->ID ) {
			return new \WP_Error(
				'invalid_user',
				__( 'Could not determine the current user.', 'wpcomsh' ), //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				array( 'status' => 400 )
			);
		}

		// Prepare the fix data
		$fix_data = array(
			'fix_type'        => 'permanent',
			'error_code'      => $error_code,
			'error_data'      => $error_data,
			'fixed_by_user'   => $current_user->ID,
			'fixed_timestamp' => time(),
		);

		// Use Atomic Persistent Data to store the fix
		$result = $this->store_fix_data( $fix_data );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Clear the error if the fix was successful
		$this->clear_current_error();

		// Return success response
		return rest_ensure_response(
			array(
				'success'  => true,
				'fix_type' => 'permanent',
				'message'  => __( 'The protected owner issue has been permanently fixed.', 'wpcomsh' ), //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			)
		);
	}

	/**
	 * Store the fix data in the Atomic Persistent Data file.
	 *
	 * @param array $fix_data The fix data to store.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	private function store_fix_data( $fix_data ) {
		try {
			if ( ! $this->atomic_data ) {
				$this->atomic_data = new Atomic_Persistent_Data();
			}

			// Check if any permission already exists
			if ( isset( $this->atomic_data->{self::FIX_DATA_KEY} ) ) {
				// Permission already exists, no need to update
				return true;
			}

			// Store in Atomic Persistent Data
			$this->atomic_data->{self::FIX_DATA_KEY} = $fix_data;

			return true;
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'atomic_data_error',
				__( 'Error storing fix data: ', 'wpcomsh' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Clear the current protected owner error.
	 *
	 * @return bool Whether the error was successfully cleared.
	 */
	private function clear_current_error() {
		return delete_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION );
	}

	/**
	 * Get stored fix data from the Atomic Persistent Data file.
	 *
	 * @return array|null The fix data or null if not found.
	 */
	public function get_fix_data() {
		try {
			if ( ! $this->atomic_data ) {
				$this->atomic_data = new Atomic_Persistent_Data();
			}

			return isset( $this->atomic_data->{self::FIX_DATA_KEY} ) ? $this->atomic_data->{self::FIX_DATA_KEY} : null;
		} catch ( \Exception $e ) {
			return null;
		}
	}

	/**
	 * Check if a permanent fix has been applied.
	 *
	 * @return bool Whether a permanent fix has been applied.
	 */
	public function has_permanent_fix() {
		// We only check if any fix data exists - error code doesn't matter
		return $this->get_fix_data() !== null;
	}

	/**
	 * Remove a permanent fix from the Atomic Persistent Data file.
	 *
	 * @return bool Whether the fix was successfully removed.
	 */
	public function remove_permanent_fix() {
		try {
			if ( ! $this->atomic_data ) {
				$this->atomic_data = new Atomic_Persistent_Data();
			}

			// Unset the property
			unset( $this->atomic_data->{self::FIX_DATA_KEY} );
			return true;
		} catch ( \Exception $e ) {
			return false;
		}
	}
}
