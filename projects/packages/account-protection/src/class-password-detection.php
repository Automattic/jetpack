<?php
/**
 * Class used to define Password Detection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WP_Error;

/**
 * Class Password_Detection
 */
class Password_Detection {
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
	 * Handle password detection login failure.
	 *
	 * @param string   $username The username.
	 * @param WP_Error $error The error object.
	 * @return never
	 */
	public function handle_password_detection_login_failure( $username, $error ) {
		// Check for the validation error
		if ( isset( $error->errors['password_detection_validation_error'] ) ) {
			// Get the token from the error data
			$token = $error->get_error_data()['token'];
			// Redirect the user back to the login page with a custom error message
			wp_safe_redirect( home_url( '/wp-login.php?action=password-detection&token=' . $token ) );
			exit;
		}
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

		// Check if the user has the required role or capabilities, Author role or higher
		if ( ! user_can( $user, 'publish_posts' ) && ! user_can( $user, 'edit_published_posts' ) ) {
			return $user;
		}

		// Ensure the password is correct for this user
		if ( wp_check_password( $password, $user->user_pass, $user->ID ) ) {
			// TODO: Only run validation only if we haven't already checked?
			if ( ! $this->validate_password( $password ) ) {
				// Use a transient to track email sent status
				$sent_transient_key = 'two_factor_auth_email_sent_' . $user->ID;
				$email_sent_flag    = get_transient( $sent_transient_key );

				// Send verification code email
				if ( ! $email_sent_flag ) {
					$email_sent = $this->two_factor_auth_email->send( $user->ID, $user->user_email );
					if ( $email_sent ) {
						// Set transient to mark the email as sent
						set_transient( $sent_transient_key, true, 10 * MINUTE_IN_SECONDS );
					}
				}

				// Generate a unique token and store user details in a transient
				// TODO: Ensure we are clearing all transients after use
				$token = wp_generate_password( 32, false, false );
				set_transient( "password_detection_$token", $user->ID, 10 * MINUTE_IN_SECONDS );

				// Return error to redirect to the password detection page
				return new \WP_Error( 'password_detection_validation_error', 'Password detection validation error', array( 'token' => $token ) );
			}
		}

		return $user;
	}

	/**
	 * Render password detection page.
	 *
	 * @return never
	 */
	public function render_page() {
		// Ensure the user is logged out
		if ( is_user_logged_in() ) {
			wp_safe_redirect( admin_url() );
			exit;
		}

		// Get the token from the query string
		$token = isset( $_GET['token'] ) ? sanitize_text_field( wp_unslash( $_GET['token'] ) ) : null;

		// Get the user ID from the transient
		$user_id = $token ? get_transient( "password_detection_$token" ) : null;
		if ( ! $user_id ) {
			wp_safe_redirect( wp_login_url() );
			exit;
		}

		// Get the user details
		$current_user = get_user_by( 'ID', $user_id );
		if ( ! $current_user ) {
			wp_safe_redirect( wp_login_url() );
			exit;
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// Initialize template variables
		$context      = "We've noticed that your current password may have been compromised in a public leak. To keep your account safe, we've added an extra layer of security";
		$error        = '';
		$redirect_url = '/wp-login.php?action=password-detection&token=' . $token;

		// Use a transient to track email resent status
		$resent_transient_key  = 'two_factor_auth_email_resent_' . $current_user->ID;
		$email_resent_attempts = get_transient( $resent_transient_key );

		if ( false === $email_resent_attempts ) {
			$email_resent_attempts = 0;
		}

		// Handle resend email request
		if ( isset( $_GET['resend_email'] ) && $_GET['resend_email'] === '1' ) {
			if ( $email_resent_attempts >= 3 ) {
				// User has exceeded the maximum resend attempts
				$error = 'maximum_resend_attempts_exceeded';
			} else {
				// Resend email
				$email_resent = $this->two_factor_auth_email->send( $current_user->ID, $current_user->user_email );
				if ( $email_resent ) {
					// Increment the resend attempts and set the transient
					++$email_resent_attempts;
					set_transient( $resent_transient_key, $email_resent_attempts, 10 * MINUTE_IN_SECONDS );
				} else {
					$error = 'email_resend_error';
				}
			}

			// Redirect to the password detection page
			wp_safe_redirect( home_url( $redirect_url ) );
		}

		// TODO: Separate out large blocks of code into functions
		// TODO: Update resend message when attempts met or error

		// Handle verify form submission
		if ( isset( $_POST['verify'] ) ) {

			// Verify nonce
			if ( isset( $_POST['_wpnonce_verify'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_verify'] ) ), 'verify_action' ) ) {
				// If the auth code is correct, log the user in and clear transient
				$auth_code  = get_transient( "password_detection_auth_code_$user_id" );
				$user_input = isset( $_POST['user_input'] ) ? sanitize_text_field( wp_unslash( $_POST['user_input'] ) ) : null;

				if ( $auth_code && $user_input && $auth_code === $user_input ) {
					// Clear the transients
					delete_transient( "password_detection_$token" );
					delete_transient( "password_detection_auth_code_$user_id" );
					delete_transient( $resent_transient_key );
					delete_transient( "two_factor_auth_email_sent_$user_id" );

					// Log the user in
					wp_set_auth_cookie( $user_id, true );

					// Redirect to the admin dashboard
					wp_safe_redirect( admin_url() );

					// TODO: How can we notify the user to update their password?
					exit;
				} else {
					$error = 'invalid_auth_code';
				}
			} else {
				$error = 'verify_nonce_verification_error';
			}
		}

		$this->render_content( $context, $error, $redirect_url, $this->two_factor_auth_email->mask_email_address( $current_user->user_email ) );
		exit;
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
	 * Render content for password detection page.
	 *
	 * @param string $context      The context for the password detection page.
	 * @param string $error        The error message to display.
	 * @param string $redirect_url The redirect URL.
	 * @param string $masked_email The masked email address.
	 * @return void
	 */
	public function render_content( string $context, string $error, string $redirect_url, string $masked_email ): void {
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
							<span>Didn't get the code? </span>
							<a href=<?php echo esc_attr( $redirect_url ) . '&resend_email=1'; ?>>Resend email</a>
						</p>
				</div>
				<?php wp_footer(); ?>
			</body>
		</html>
		<?php
	}
}
