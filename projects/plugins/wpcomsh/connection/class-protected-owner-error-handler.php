<?php
/**
 * The Jetpack Connection Protected Owner Error Handler class file.
 *
 * USAGE EXAMPLES:
 *
 * 1. Basic usage (automatic - no code required):
 *    The class automatically handles protected owner errors when they occur.
 *
 * 2. Check if enhanced features are available:
 *    $handler = Protected_Owner_Error_Handler::get_instance();
 *    if ( $handler->has_enhanced_error_handling() ) {
 *        // Enhanced features are available
 *    }
 *
 * @package wpcomsh
 */

namespace Automattic\WPComSH\Connection;

/**
 * The Jetpack Connection Protected Owner Error Handler class.
 *
 * This class handles errors related to protected owner accounts in the Jetpack Connection.
 * It retrieves owner account errors stored in WordPress options and displays them in the UI.
 *
 * The class automatically clears errors when the required local account is created,
 * allowing external healing code to establish the proper Jetpack connection.
 *
 * Additionally, this class provides email prepopulation functionality for the WordPress
 * user creation form when creating missing protected owner accounts. It overrides the
 * default User_Admin class behavior to ensure the WP.com invitation checkbox is not
 * pre-checked when creating protected owner accounts.
 *
 * Automatically uses enhanced error handling when available in newer connection package versions,
 * with backward compatibility for older versions.
 *
 * @since 7.0.0
 */
class Protected_Owner_Error_Handler {

	/**
	 * The name of the option that stores the error
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_protected_owner_error';

	/**
	 * Holds the instance of this singleton class
	 *
	 * @var Protected_Owner_Error_Handler $instance
	 */
	private static $instance = null;

	/**
	 * Initialize instance and register hooks
	 */
	private function __construct() {
		// Inject protected owner errors into the connection error system
		add_filter( 'jetpack_connection_get_verified_errors', array( $this, 'handle_error' ) );

		// Clear errors when the missing user is created or updated (allows external healing code to work)
		add_action( 'user_register', array( $this, 'check_and_clear_error_for_user' ) );
		add_action( 'profile_update', array( $this, 'check_and_clear_error_for_user' ) );

		// Add form prepopulation functionality
		add_action( 'user_new_form', array( $this, 'prepopulate_user_form' ) );

		// Disable WordPress.com invitations when creating protected owner accounts
		add_filter( 'jetpack_sso_invite_new_users_wpcom', array( $this, 'disable_wpcom_invite_for_protected_owner' ) );
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
	 * Check if there's an active protected owner error
	 *
	 * @return array|false Raw error data if there's an active error, false otherwise.
	 */
	private function get_active_error() {
		// Check if option is populated
		$raw_error = get_option( self::STORED_ERRORS_OPTION, false );

		// Return early if no error is stored
		if ( ! $raw_error || ! is_array( $raw_error ) ) {
			return false;
		}

		// Validate the minimal required fields
		if ( ! isset( $raw_error['error_type'] ) || ! isset( $raw_error['email'] ) ) {
			return false;
		}

		// Check if user exists with the required email
		$user = get_user_by( 'email', $raw_error['email'] );
		if ( $user ) {
			// User exists, delete the option and return false (no active error)
			$this->delete_error();
			return false;
		}

		// User doesn't exist, we have an active error
		return $raw_error;
	}

	/**
	 * Handle protected owner errors in the connection error system
	 *
	 * @param array $verified_errors Current verified errors.
	 * @return array Updated verified errors including protected owner errors.
	 */
	public function handle_error( $verified_errors ) {
		// Clear all existing errors first
		$verified_errors = array();

		$raw_error = $this->get_active_error();

		// Return early if no active error
		if ( ! $raw_error ) {
			return $verified_errors;
		}

		// Use a consistent error code for all protected owner errors
		$error_code = 'protected_owner_missing';

		// Prepare error data for the connection error system
		$user_id   = '0';
		$timestamp = $raw_error['timestamp'] ?? time();

		// Check if we have the new Error_Handler class with build_action_error_data method
		// This provides enhanced error data for newer connection package versions
		$error_data = $this->build_enhanced_error_data( $raw_error );

		// Fallback to legacy error data if enhanced method is not available
		if ( false === $error_data ) {
			$error_data = $this->build_legacy_error_data( $raw_error );
		}

		$error_details = array(
			'error_code'    => $error_code,
			'user_id'       => $user_id,
			'error_message' => $this->get_error_message( $raw_error['email'] ),
			'error_data'    => $error_data,
			'timestamp'     => $timestamp,
			'nonce'         => wp_generate_password( 10, false ),
			'error_type'    => 'protected_owner',
		);

		// Return only the protected owner error - it takes priority over other connection errors
		// since it's typically the root cause and other errors may be symptoms
		return array(
			$error_code => array(
				$user_id => $error_details,
			),
		);
	}

	/**
	 * Build enhanced error data using the new connection package methods
	 *
	 * This method leverages the new build_action_error_data method available in
	 * new connection package version to provide enhanced
	 * error handling with secondary button support.
	 *
	 * @param array $raw_error The raw error data from the stored option.
	 * @return array|false Enhanced error data array or false if method not available.
	 */
	private function build_enhanced_error_data( $raw_error ) {
		// Check if enhanced error handling is available
		if ( ! $this->has_enhanced_error_handling() ) {
			return false;
		}

		$error_handler = \Automattic\Jetpack\Connection\Error_Handler::get_instance();

		// Build enhanced error data with improved action handling
		$args = array(
			'action'         => 'create_missing_account',
			'action_label'   => __( 'Create Account', 'wpcomsh' ),
			'action_variant' => 'primary',
			'action_url'     => add_query_arg(
				array(
					'jetpack_protected_owner_email'  => rawurlencode( $raw_error['email'] ),
					'jetpack_create_missing_account' => '1',
				),
				admin_url( 'user-new.php' )
			),
			'tracking_event' => 'jetpack_protected_owner_create_account_click',
			'extra_data'     => array(
				'email'       => $raw_error['email'],
				'error_type'  => $raw_error['error_type'],
				'support_url' => admin_url( 'user-new.php' ), // Backward compatibility
			),
		);

		// @phan-suppress-next-line PhanUndeclaredMethod -- Method exists in newer connection package versions
		return $error_handler->build_action_error_data( $args );
	}

	/**
	 * Build legacy error data for backward compatibility
	 *
	 * This method provides the original error data structure for older
	 * connection package versions that don't support the enhanced features.
	 *
	 * @since 7.0.0
	 *
	 * @param array $raw_error The raw error data from the stored option.
	 * @return array Legacy error data array.
	 */
	private function build_legacy_error_data( $raw_error ) {
		$legacy_data = array(
			'email'       => $raw_error['email'],
			'error_type'  => $raw_error['error_type'],
			'action'      => 'create_missing_account',
			'support_url' => admin_url( 'user-new.php' ),
		);

		return $legacy_data;
	}

	/**
	 * Check if enhanced error handling is available
	 *
	 * This method can be used to determine if the current connection package version
	 * supports the enhanced error handling features.
	 *
	 * @return bool True if enhanced features are available, false otherwise.
	 */
	public function has_enhanced_error_handling() {
		if ( ! class_exists( '\Automattic\Jetpack\Connection\Error_Handler' ) ) {
			return false;
		}

		$error_handler = \Automattic\Jetpack\Connection\Error_Handler::get_instance();
		return method_exists( $error_handler, 'build_action_error_data' );
	}

	/**
	 * Get a user-friendly error message for protected owner errors
	 *
	 * @param string $email The WordPress.com email address of the protected owner.
	 * @return string The error message.
	 */
	private function get_error_message( $email ) {
		return sprintf(
			/* translators: %s is the WordPress.com email address */
			__( 'The user account that owns the plan is missing from your site. To fix this, you can create an account using the email address %s.', 'wpcomsh' ),
			esc_html( $email )
		);
	}

	/**
	 * Delete the stored error
	 */
	public function delete_error() {
		delete_option( self::STORED_ERRORS_OPTION );
	}

	/**
	 * Check if the user matches the protected owner error and clear it if so
	 * This allows external healing code to automatically establish the connection
	 *
	 * @param int $user_id The ID of the user to check.
	 */
	public function check_and_clear_error_for_user( $user_id ) {
		// Get the raw error data to check the email
		$raw_error = get_option( self::STORED_ERRORS_OPTION, false );

		// Return early if no error is stored
		if ( ! $raw_error || ! is_array( $raw_error ) || ! isset( $raw_error['email'] ) ) {
			return;
		}

		// Get the user
		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return;
		}

		// Check if the user's email matches the required email
		if ( strtolower( $user->user_email ) === strtolower( $raw_error['email'] ) ) {
			// The user with the required email has been created/updated
			// Clear the error so external healing code can establish the connection
			$this->delete_error();
		}
	}

	/**
	 * Add form prepopulation functionality
	 */
	public function prepopulate_user_form() {
		$email = $this->get_prepopulation_email();

		if ( ! $email ) {
			return;
		}

		// Output hidden field and JavaScript to prepopulate the form
		?>
		<input type="hidden" id="jetpack_prepopulate_email" value="<?php echo esc_attr( $email ); ?>" />
		<input type="hidden" name="jetpack_create_missing_account" value="1" />
		
		<script type="text/javascript">
		(function() {
			document.addEventListener('DOMContentLoaded', function() {
				// Prepopulate the email field and role
				var emailInput = document.getElementById('jetpack_prepopulate_email');
				if (emailInput && emailInput.value) {
					var emailField = document.getElementById('email');
					var roleField = document.getElementById('role');
					
					if (emailField) {
						emailField.value = emailInput.value;
					}
					if (roleField) {
						roleField.value = 'administrator';
					}
				}
			});
		})();
		</script>
		<?php
	}

	/**
	 * Get the email address for prepopulation from various sources
	 *
	 * @return string|false Email address if available, false otherwise
	 */
	private function get_prepopulation_email() {
		// Check URL parameters first (from React component)
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- URL parameters are read-only for prepopulation, no sensitive actions performed
		if ( isset( $_GET['jetpack_protected_owner_email'] ) &&
			isset( $_GET['jetpack_create_missing_account'] ) ) {
			$email = sanitize_email( wp_unslash( $_GET['jetpack_protected_owner_email'] ) );
			if ( is_email( $email ) ) {
				return $email;
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		// Only prepopulate when explicitly triggered from dashboard
		return false;
	}

	/**
	 * Disable WordPress.com invitations when creating protected owner accounts
	 *
	 * @param bool $invite_new_users_wpcom Whether to invite new users to WordPress.com.
	 * @return bool Updated value indicating whether to invite new users to WordPress.com.
	 */
	public function disable_wpcom_invite_for_protected_owner( $invite_new_users_wpcom ) {
		// Check if we're in a protected owner creation context
		$email = $this->get_prepopulation_email();
		if ( ! $email ) {
			return $invite_new_users_wpcom; // Not a protected owner creation, let the default behavior proceed
		}

		// Disable invitations for protected owner creation
		return false;
	}
}
