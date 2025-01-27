<?php
/**
 * Class used to define Password Detection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Class Password_Detection
 */
class Password_Detection {
	const PASSWORD_DETECTION_USER_META_KEY = 'jetpack_account_protection_password_status';

	/**
	 * Two factor auth email dependency.
	 *
	 * @var Two_Factor_Auth_Email
	 */
	private $two_factor_auth_email;

	/**
	 * Password_Detection constructor.
	 *
	 * @param ?Two_Factor_Auth_Email $two_factor_auth_email Two factor auth email instance.
	 */
	public function __construct( ?Two_Factor_Auth_Email $two_factor_auth_email = null ) {
		$this->two_factor_auth_email = $two_factor_auth_email ?? new Two_Factor_Auth_Email();
	}

	/**
	 * Redirect to the password detection page.
	 *
	 * @return string The URL to redirect to.
	 */
	public function password_detection_redirect(): string {
		return home_url( '/wp-login.php?action=password-detection' );
	}

	/**
	 * Check if the password is safe after login.
	 *
	 * @param \WP_User|\WP_Error $user The user or error object.
	 * @param string             $password The password.
	 * @return \WP_User|\WP_Error The user object.
	 */
	public function login_form_password_detection( $user, string $password ) {
		// Check if the user is already a WP_Error object
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		// Ensure the password is correct for this user
		if ( ! wp_check_password( $password, $user->user_pass, $user->ID ) ) {
			return $user;
		}

		if ( ! $this->validate_password( $password ) ) {
			// TODO: Ensure usermeta is always up to date
			$this->update_usermeta( $user->ID, 'unsafe' );

			// Redirect to the password detection page
			add_filter( 'login_redirect', array( $this, 'password_detection_redirect' ), 10, 3 );
		} else {
			$this->update_usermeta( $user->ID, 'safe' );
		}

		return $user;
	}

	/**
	 * Render password detection page.
	 *
	 * @return never
	 */
	public function render_page() {
		// Restrict direct access to logged in users
		$current_user = wp_get_current_user();
		if ( 0 === $current_user->ID ) {
			wp_safe_redirect( wp_login_url() );
			exit;
		}

		// Restrict direct access to users with unsafe passwords
		$user_password_status = $this->get_usermeta( $current_user->ID );
		if ( ! $user_password_status || 'safe' === $user_password_status ) {
			wp_safe_redirect( admin_url() );
			exit;
		}

		// Use a transient to track email sent status
		$transient_key   = 'two_factor_auth_email_sent_' . $current_user->ID;
		$email_sent_flag = get_transient( $transient_key );

		// Initialize template variables
		$context = "We've noticed that your current password may have been compromised in a public leak. To keep your account safe, we've added an extra layer of security";
		$error   = '';

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// Send verification code email
		if ( ! $email_sent_flag ) {
			$email_sent = $this->two_factor_auth_email->send();
			if ( $email_sent ) {
				// Set transient to mark the email as sent
				set_transient( $transient_key, true, 15 * MINUTE_IN_SECONDS );
			} else {
				$error = 'email_send_error';
			}
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_resend_two_factor_auth_scripts' ) );

		// Handle verify form submission
		if ( isset( $_POST['verify'] ) ) {

			// Verify nonce
			if ( isset( $_POST['_wpnonce_verify'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_verify'] ) ), 'verify_action' ) ) {
				wp_safe_redirect( admin_url() );
				exit;
			} else {
				$error = 'verify_nonce_verification_error';
			}
		}

		$this->render_content( $context, $error, $this->two_factor_auth_email->mask_email_address( $current_user->user_email ) );
		exit;
	}

	/**
	 * Enqueue the resend two factor auth email scripts.
	 *
	 * @return void
	 */
	public function enqueue_resend_two_factor_auth_scripts(): void {
		wp_enqueue_script( 'resend-two-factor-auth', plugin_dir_url( __FILE__ ) . 'js/resend-two-factor-auth.js', array( 'jquery' ), Account_Protection::PACKAGE_VERSION, true );

		// Pass AJAX URL and nonce to the script
		wp_localize_script(
			'resend-two-factor-auth',
			'ajaxObject',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'resend_two_factor_auth_nonce' ),
			)
		);
	}

	/**
	 * Enqueue the password detection page styles.
	 *
	 * @return void
	 */
	public function enqueue_styles(): void {
		wp_enqueue_style(
			'password-detection-styles',
			plugin_dir_url( __FILE__ ) . 'css/password-detection.css',
			array(),
			Account_Protection::PACKAGE_VERSION
		);
	}

	/**
	 * Run AJAX request to resend two factor auth email.
	 */
	public function ajax_resend_two_factor_auth_email() {
		// Verify the nonce for security
		check_ajax_referer( 'resend_two_factor_auth_nonce', 'security' );

		// Check if the user is logged in
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( array( 'message' => 'User not authenticated' ) );
		}

		// Resend the email
		$email_sent = $this->two_factor_auth_email->send();
		if ( $email_sent ) {
			wp_send_json_success( array( 'message' => 'Resend successful.' ) );
		} else {
			wp_send_json_error( array( 'message' => 'Resend failed. ' ) );
		}
	}

	/**
	 * Password validation.
	 *
	 * @param string $password The password to validate.
	 * @return bool True if the password is valid, false otherwise.
	 */
	public function validate_password( string $password ): bool {
		// TODO: Uncomment out once endpoint is live
		// Check compromised and common passwords
		// $weak_password = self::check_weak_passwords( $password );

		return $password ? false : true;
	}

	/**
	 * Check if the password is in the list of common/compromised passwords.
	 *
	 * @param string $password The password to check.
	 * @return bool|\WP_Error True if the password is in the list of common/compromised passwords, false otherwise.
	 */
	public function check_weak_passwords( string $password ) {
		$api_url = '/jetpack-protect-weak-password';

		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $is_connected ) {
			return new \WP_Error( 'site_not_connected' );
		}

		// Hash pass with sha1, and pass first 5 characters to the API
		$hashed_password = sha1( $password );
		$password_prefix = substr( $hashed_password, 0, 5 );

		$response = Client::wpcom_json_api_request_as_blog(
			$api_url . '/' . $password_prefix,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return new \WP_Error( 'failed_fetching_weak_passwords', 'Failed to fetch weak passwords from the server', array( 'status' => $response_code ) );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		// Check if the password is in the list of common/compromised passwords
		$password_suffix = substr( $hashed_password, 5 );
		if ( in_array( $password_suffix, $body['compromised'] ?? array(), true ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Get the password detection usermeta.
	 *
	 * @param int $user_id The user ID.
	 */
	public function get_usermeta( int $user_id ) {
		return get_user_meta( $user_id, self::PASSWORD_DETECTION_USER_META_KEY, true );
	}

	/**
	 * Update the password detection usermeta.
	 *
	 * @param int    $user_id The user ID.
	 * @param string $setting The password detection setting.
	 */
	public function update_usermeta( int $user_id, string $setting ) {
		update_user_meta( $user_id, self::PASSWORD_DETECTION_USER_META_KEY, $setting );
	}

	/**
	 * Delete password detection usermeta for all users.
	 */
	public function delete_all_usermeta() {
		$users = get_users();
		foreach ( $users as $user ) {
			$this->delete_usermeta( $user->ID );
		}
	}

	/**
	 * Delete the password detection usermeta.
	 *
	 * @param int $user_id The user ID.
	 */
	public function delete_usermeta( int $user_id ) {
		delete_user_meta( $user_id, self::PASSWORD_DETECTION_USER_META_KEY );
	}

	/**
	 * Delete the password detection usermeta after password reset.
	 *
	 * @param \WP_User $user The user object.
	 */
	public function delete_usermeta_after_password_reset( \WP_User $user ) {
		$this->delete_usermeta( $user->ID );
	}

	/**
	 * Delete the password detection usermeta on profile password update.
	 *
	 * @param int $user_id The user ID.
	 */
	public function delete_usermeta_on_profile_update( int $user_id ) {
		if (
			! empty( $_POST['_wpnonce'] ) &&
			wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'update-user_' . $user_id )
		) {
			if ( isset( $_POST['pass1'] ) && ! empty( $_POST['pass1'] ) ) {
				$this->delete_usermeta( $user_id );
			}
		}
	}

	/**
	 * Render content for password detection page.
	 *
	 * @param string $context      The context for the password detection page.
	 * @param string $error        The error message to display.
	 * @param string $masked_email The masked email address.
	 * @return void
	 */
	public function render_content( string $context, string $error, string $masked_email ): void {
		defined( 'ABSPATH' ) || exit;
		?>
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title><?php echo esc_html( 'Jetpack - Secure Your Account' ); ?></title>
				<?php wp_head(); ?>
			</head>
			<body class="password-detection-wrapper">
				<div class="password-detection">
					<?php require plugin_dir_path( __FILE__ ) . '/assets/jetpack-logo.svg'; ?>
					<p class="password-detection-title"><?php echo esc_html( 'Verify your identity' ); ?></p>
						<p><?php echo esc_html( $context ); ?></p>
						<?php if ( $error ) : ?>
							<?php if ( 'verify_nonce_verification_error' === $error ) : ?>
								<p>We've encountered an issue verifying your request to proceed without updating your password.</p>
							<?php else : ?>
									While attempting to send a code to <?php echo esc_html( $masked_email ); ?>, an error occurred.
								</p>
							<?php endif; ?>
						<?php else : ?>
							<p>We've sent a code to <?php echo esc_html( $masked_email ); ?>. Please check your inbox and enter the code below to verify it's really you.</p>
						<?php endif; ?>
						<div class="actions">
							<form method="post">
								<?php wp_nonce_field( 'verify_action', '_wpnonce_verify' ); ?>
								<input 
									type="number"
									name="user_input"
									class="action-input"
									placeholder="Enter verification code"
									required
								/>
								<button class="action action-verify" type="submit" name="verify">Verify</button>
							</form>
						</div>
						<p class="email-status">
							<span id="resend-code-message">Didn't get the code? </span>
							<a href="#" id="resend-code">Resend email</a>
						</p>
				</div>
				<?php wp_footer(); ?>
			</body>
		</html>
		<?php
	}
}
