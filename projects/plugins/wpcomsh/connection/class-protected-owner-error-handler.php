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
 * @since $$next-version$$
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

		// Add form prepopulation functionality - run before User_Admin class (priority 0)
		add_action( 'user_new_form', array( $this, 'override_wpcom_invite_checkbox' ), 0 );
		add_action( 'user_new_form', array( $this, 'prepopulate_user_form' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_form_scripts' ) );
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

		$error_details = array(
			'error_code'    => $error_code,
			'user_id'       => $user_id,
			'error_message' => $this->get_error_message( $raw_error['email'] ),
			'error_data'    => array(
				'email'       => $raw_error['email'],
				'error_type'  => $raw_error['error_type'],
				'action'      => 'create_missing_account',
				'support_url' => admin_url( 'user-new.php' ),
			),
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
	 * Get a user-friendly error message for protected owner errors
	 *
	 * @param string $email The WordPress.com email address of the protected owner.
	 * @return string The error message.
	 */
	private function get_error_message( $email ) {
		return sprintf(
			/* translators: %s is the WordPress.com email address */
			__( 'This site needs to be connected to WordPress.com by the plan owner account with email %s. Please create a local user account with this email address to resolve this issue.', 'wpcomsh' ),
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
		<tr class="form-field form-required">
			<th scope="row">
				<label for="jetpack_protected_owner_notice">
					<?php esc_html_e( 'WordPress.com Plan Owner', 'wpcomsh' ); ?>
				</label>
			</th>
			<td>
				<div class="notice notice-info inline">
					<p>
						<?php
						printf(
							/* translators: %s is the email address */
							esc_html__( 'Creating account for WordPress.com plan owner: %s', 'wpcomsh' ),
							'<strong>' . esc_html( $email ) . '</strong>'
						);
						?>
					</p>
				</div>
				<input type="hidden" id="jetpack_prepopulate_email" value="<?php echo esc_attr( $email ); ?>" />
				<input type="hidden" name="jetpack_create_missing_account" value="1" />
			</td>
		</tr>
		
		<script type="text/javascript">
		(function($) {
			$(document).ready(function() {
				// Prepopulate the email field and role
				var email = $('#jetpack_prepopulate_email').val();
				if (email) {
					$('#email').val(email);
					$('#role').val('administrator');
					
					// Ensure invite checkbox is unchecked for protected owner creation
					$('#invite_user_wpcom').prop('checked', false);
				}
			});
		})(jQuery);
		</script>
		<?php
	}

	/**
	 * Enqueue form scripts
	 *
	 * @param string $hook The current admin page hook.
	 */
	public function enqueue_form_scripts( $hook ) {
		// Only load on user-new.php page
		if ( 'user-new.php' !== $hook ) {
			return;
		}

		// Only enqueue if we have an email to prepopulate
		$email = $this->get_prepopulation_email();
		if ( ! $email ) {
			return;
		}

		// Enqueue jQuery (should already be available in admin)
		wp_enqueue_script( 'jquery' );
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
	 * Override the WP.com invite checkbox behavior when creating a missing protected user
	 *
	 * This method runs before the User_Admin class hook (priority 0) to override
	 * the default checkbox behavior when we're creating a missing protected owner account.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $type The type of new user form the hook follows.
	 */
	public function override_wpcom_invite_checkbox( $type ) {
		// Only override for add-new-user form type
		if ( 'add-new-user' !== $type ) {
			return;
		}

		// Check if we're in a protected owner creation context
		$email = $this->get_prepopulation_email();
		if ( ! $email ) {
			return; // Not a protected owner creation, let the default behavior proceed
		}

		// Remove the User_Admin hook that would pre-check the invitation checkbox
		$this->remove_user_admin_invite_checkbox_hook();

		// Add our own version that ensures the checkbox is unchecked
		add_action( 'user_new_form', array( $this, 'render_unchecked_wpcom_invite_checkbox' ), 1 );
	}

	/**
	 * Remove the User_Admin class hook that renders the invite checkbox
	 *
	 * This is necessary to prevent the default pre-checked behavior for protected owner creation.
	 *
	 * @since $$next-version$$
	 */
	private function remove_user_admin_invite_checkbox_hook() {
		// Get all hooked functions for the user_new_form action
		global $wp_filter;

		if ( ! isset( $wp_filter['user_new_form'] ) ) {
			return;
		}

		// Look for the User_Admin class hook at priority 1
		if ( isset( $wp_filter['user_new_form']->callbacks[1] ) ) {
			foreach ( $wp_filter['user_new_form']->callbacks[1] as $callback ) {
				// Check if this is the User_Admin render_wpcom_invite_checkbox method
				if (
					is_array( $callback['function'] ) &&
					is_object( $callback['function'][0] ) &&
					get_class( $callback['function'][0] ) === 'Automattic\Jetpack\Connection\SSO\User_Admin' &&
					$callback['function'][1] === 'render_wpcom_invite_checkbox'
				) {
					// Remove the hook
					remove_action( 'user_new_form', $callback['function'], 1 );
					break;
				}
			}
		}
	}

	/**
	 * Render the WP.com invite checkbox in an unchecked state for protected owner creation
	 *
	 * This replaces the User_Admin method to ensure the checkbox is not pre-checked
	 * when creating a missing protected owner account.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $type The type of new user form the hook follows.
	 */
	public function render_unchecked_wpcom_invite_checkbox( $type ) {
		if ( 'add-new-user' !== $type ) {
			return;
		}

		?>
		<table class="form-table">
			<tr class="form-field">
				<th scope="row">
					<label for="invite_user_wpcom"><?php esc_html_e( 'Invite user', 'wpcomsh' ); ?></label>
				</th>
				<td>
					<fieldset>
						<legend class="screen-reader-text">
							<span><?php esc_html_e( 'Invite user', 'wpcomsh' ); ?></span>
						</legend>
						<label for="invite_user_wpcom">
							<input
								name="invite_user_wpcom"
								type="checkbox"
								id="invite_user_wpcom"
								value="1"
								>
							<?php esc_html_e( 'Invite user to WordPress.com', 'wpcomsh' ); ?>
						</label>
						<p class="description">
							<?php esc_html_e( 'Note: This user is being created to resolve a Jetpack connection issue. You may choose whether to invite them to WordPress.com.', 'wpcomsh' ); ?>
						</p>
					</fieldset>
				</td>
			</tr>
		</table>
		<?php
	}
}
