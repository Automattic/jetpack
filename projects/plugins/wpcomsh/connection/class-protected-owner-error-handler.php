<?php
/**
 * The Jetpack Connection Protected Owner Error Handler class file.
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

		// Add warning when editing the protected owner's email
		add_action( 'admin_footer-profile.php', array( $this, 'add_owner_email_warning' ) );
		add_action( 'admin_footer-user-edit.php', array( $this, 'add_owner_email_warning' ) );
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

		// Validate that the error email matches the owner email in Atomic Persistent Data (source of truth)
		if ( class_exists( \Atomic_Persistent_Data::class ) ) {
			$atomic_persistent_data = new \Atomic_Persistent_Data(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$owner_email            = $atomic_persistent_data->JETPACK_CONNECTION_OWNER_EMAIL; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			if ( $owner_email ) {
				// APD has owner email - connection was established, error is not valid
				$this->delete_error();
				return false;
			}
		} else {
			// We are not on WordPress.com Atomic, delete the error and return false (no active error)
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

		// Build error data using the connection package build_action_error_data method
		$error_data = $this->build_error_data( $raw_error );

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
	 * Build error data using the connection package methods
	 *
	 * This method leverages the build_action_error_data method from the
	 * connection package to provide consistent error handling.
	 *
	 * @param array $raw_error The raw error data from the stored option.
	 * @return array Error data array.
	 */
	private function build_error_data( $raw_error ) {
		$error_handler = \Automattic\Jetpack\Connection\Error_Handler::get_instance();

		// Build error data with action handling
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
				'email'      => $raw_error['email'],
				'error_type' => $raw_error['error_type'],
			),
		);

		return $error_handler->build_action_error_data( $args );
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

	/**
	 * Get the protected owner match status for a user
	 *
	 * Returns information about how (or if) the user matches the protected owner:
	 * - 'email_match': User's email matches the APD owner email
	 * - 'token_match': User's email doesn't match, but their token matches the APD owner token
	 * - 'no_match': User is not the protected owner
	 *
	 * @param int $user_id User ID to check.
	 * @return array {
	 *     @type string      $match_type   One of 'email_match', 'token_match', or 'no_match'.
	 *     @type string|null $owner_email  The owner email from APD (if available).
	 * }
	 */
	private function get_protected_owner_status( $user_id ) {
		$default_status = array(
			'match_type'  => 'no_match',
			'owner_email' => null,
		);

		if ( ! class_exists( \Atomic_Persistent_Data::class ) ) {
			return $default_status;
		}

		$apd          = new \Atomic_Persistent_Data(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$owner_email  = $apd->JETPACK_CONNECTION_OWNER_EMAIL; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$owner_secret = $apd->JETPACK_CONNECTION_OWNER_TOKEN_SECRET; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		// Need at least email or secret to identify the owner
		if ( ! $owner_email && ! $owner_secret ) {
			return $default_status;
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return $default_status;
		}

		// First, try to match by email
		if ( $owner_email && strtolower( $user->user_email ) === strtolower( $owner_email ) ) {
			return array(
				'match_type'  => 'email_match',
				'owner_email' => $owner_email,
			);
		}

		// If email doesn't match, try to match by token
		// This handles the case where the user already changed their local email
		if ( $owner_secret && $this->user_has_owner_token( $user_id, $owner_secret ) ) {
			return array(
				'match_type'  => 'token_match',
				'owner_email' => $owner_email,
			);
		}

		return $default_status;
	}

	/**
	 * Check if a user has the owner token from APD
	 *
	 * @param int    $user_id      User ID to check.
	 * @param string $owner_secret The owner token secret from APD (format: token_key.secret).
	 * @return bool True if user has a token matching the owner secret.
	 */
	private function user_has_owner_token( $user_id, $owner_secret ) {
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			return false;
		}

		$private_options = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
		if ( ! isset( $private_options['user_tokens'] ) || ! is_array( $private_options['user_tokens'] ) ) {
			return false;
		}

		$user_tokens = $private_options['user_tokens'];
		if ( ! isset( $user_tokens[ $user_id ] ) || ! is_string( $user_tokens[ $user_id ] ) ) {
			return false;
		}

		$user_token = $user_tokens[ $user_id ];

		// User token format: token_key.secret.user_id
		// Owner secret format: token_key.secret
		// Match if user's token starts with owner_secret followed by a dot
		return strpos( $user_token, $owner_secret . '.' ) === 0;
	}

	/**
	 * Add warning notice for protected owner email field
	 *
	 * Displays a warning when editing a user profile if the user is the WordPress.com
	 * plan owner, cautioning against changing their email address.
	 */
	public function add_owner_email_warning() {
		// Determine which user is being edited
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only check for display purposes
		$user_id = isset( $_GET['user_id'] ) ? (int) $_GET['user_id'] : get_current_user_id();

		$status = $this->get_protected_owner_status( $user_id );

		if ( 'no_match' === $status['match_type'] ) {
			return;
		}

		// Define allowed HTML for the warning message (only safe link attributes)
		$allowed_html = array(
			'a' => array(
				'href'   => array(),
				'target' => array(),
			),
		);

		$wpcom_account_link = '<a href="https://wordpress.com/me/account" target="_blank">WordPress.com account</a>';

		if ( 'email_match' === $status['match_type'] ) {
			// Emails are in sync - show preventive warning
			$warning_text = sprintf(
				/* translators: %s is a link to the WordPress.com account settings page */
				__(
					'This account is the WordPress.com plan owner. Changing the email address here can affect the connection between the site and WordPress.com. If you need to change your email, update it on both your %s and here to keep them synchronized.',
					'wpcomsh'
				),
				$wpcom_account_link
			);
		} else {
			// Token match but emails differ - show sync warning
			$warning_text = sprintf(
				/* translators: 1: The expected WordPress.com email address, 2: A link to the WordPress.com account settings page */
				__(
					'This account is the WordPress.com plan owner, but the email address here does not match your WordPress.com account email (%1$s). This mismatch may cause connection issues. Please update this email to match your %2$s, or update both if you need to change your email.',
					'wpcomsh'
				),
				esc_html( $status['owner_email'] ),
				$wpcom_account_link
			);
		}

		// Sanitize HTML to only allow safe tags
		$warning_text  = wp_kses( $warning_text, $allowed_html );
		$warning_label = __( 'Warning:', 'wpcomsh' );
		?>
		<script type="text/javascript">
		document.addEventListener('DOMContentLoaded', function() {
			var emailCell = document.querySelector('.user-email-wrap')?.querySelector('td');
			if (emailCell) {
				var warning = document.createElement('p');
				warning.className = 'description';
				warning.innerHTML = '<span style="color: #d63638; font-weight: 600;">⚠️ ' + <?php echo wp_json_encode( $warning_label, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?> + '</span> ' + <?php echo wp_json_encode( $warning_text, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;
				emailCell.insertBefore(warning, emailCell.firstChild);
			}
		});
		</script>
		<?php
	}
}
