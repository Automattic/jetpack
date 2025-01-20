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
	 * Password reset email dependency.
	 *
	 * @var Password_Reset_Email
	 */
	private $password_reset_email;

	/**
	 * Password_Detection constructor.
	 *
	 * @param ?Password_Reset_Email $password_reset_email Password reset email instance.
	 */
	public function __construct( ?Password_Reset_Email $password_reset_email = null ) {
		$this->password_reset_email = $password_reset_email ?? new Password_Reset_Email();
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
	public function render_page(): never {
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
		$transient_key   = 'password_reset_email_sent_' . $current_user->ID;
		$email_sent_flag = get_transient( $transient_key );

		// Initialize template variables
		$reset   = false;
		$context = 'Your current password was found in a public leak, which means your account might be at risk.';
		$error   = '';

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// Handle reset_password_action form submission
		if ( isset( $_POST['reset-password'] ) ) {
			$reset = true;

			// Verify nonce
			if ( isset( $_POST['_wpnonce_reset_password'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_reset_password'] ) ), 'reset_password_action' ) ) {
				// Send password reset email
				if ( ! $email_sent_flag ) {
					$email_sent = $this->password_reset_email->send();
					if ( $email_sent ) {
						// Set transient to mark the email as sent
						set_transient( $transient_key, true, 15 * MINUTE_IN_SECONDS );
					} else {
						$error = 'email_send_error';
					}
				}

				add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_resend_password_reset_scripts' ) );
			} else {
				$error = 'reset_passowrd_nonce_verification_error';
			}

			// Handle proceed_action form submission
		} elseif ( isset( $_POST['proceed'] ) ) {
			$reset = true;

			// Verify nonce
			if ( isset( $_POST['_wpnonce_proceed'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_proceed'] ) ), 'proceed_action' ) ) {
				wp_safe_redirect( admin_url() );
				exit;
			} else {
				$error = 'proceed_nonce_verification_error';
			}
		}

		$this->render_content( $reset, $context, $error, $this->password_reset_email->mask_email_address( $current_user->user_email ) );
		exit;
	}

	/**
	 * Enqueue the resend password reset email scripts.
	 *
	 * @return void
	 */
	public function enqueue_resend_password_reset_scripts(): void {
		wp_enqueue_script( 'resend-password-reset', plugin_dir_url( __FILE__ ) . 'js/resend-password-reset.js', array( 'jquery' ), Account_Protection::PACKAGE_VERSION, true );

		// Pass AJAX URL and nonce to the script
		wp_localize_script(
			'resend-password-reset',
			'ajaxObject',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'resend_password_reset_nonce' ),
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
	 * Run AJAX request to resend password reset email.
	 */
	public function ajax_resend_password_reset_email() {
		// Verify the nonce for security
		check_ajax_referer( 'resend_password_reset_nonce', 'security' );

		// Check if the user is logged in
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( array( 'message' => 'User not authenticated' ) );
		}

		// Resend the email
		$email_sent = $this->password_reset_email->send();
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
	 * @param bool   $reset        Whether the user is resetting their password.
	 * @param string $context      The context for the password detection page.
	 * @param string $error        The error message to display.
	 * @param string $masked_email The masked email address.
	 * @return void
	 */
	public function render_content( bool $reset, string $context, string $error, string $masked_email ): void {
		defined( 'ABSPATH' ) || exit;
		?>
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title><?php echo esc_html( $reset ? 'Jetpack - Stay Secure' : 'Jetpack - Secure Your Account' ); ?></title>
				<?php wp_head(); ?>
			</head>
			<body class="password-detection-wrapper">
				<div class="password-detection">
					<?php require plugin_dir_path( __FILE__ ) . '/assets/jetpack-logo.svg'; ?>
					<p class="password-detection-title"><?php echo esc_html( $reset ? 'Take action to stay secure' : "Let's secure your account" ); ?></p>
					<?php if ( $reset ) : ?>
						<p><?php echo esc_html( $context ); ?></p>
						<?php if ( $error ) : ?>
							<?php if ( 'proceed_nonce_verification_error' === $error ) : ?>
								<p>We've encountered an issue verifying your request to proceed without updating your password.</p>
							<?php else : ?>
								<p>
									<?php
									echo 'reset_password_nonce_verification_error' === $error
										? "We've encountered an issue verifying your request to create a new password. "
										: '';
									?>
									While attempting to send a verification email to <?php echo esc_html( $masked_email ); ?>, an error occurred.
								</p>
							<?php endif; ?>
						<?php else : ?>
							<p>Don't worry - To keep your account safe, we've sent a verification email to <?php echo esc_html( $masked_email ); ?>. After that, we'll guide you through updating your password.</p>
						<?php endif; ?>
						<p>Please check your inbox and click the link to verify it's you. Alternatively, you can update your password from your <a href="/wp-admin/profile.php#password">account profile</a>.</p>
						<p>
							<span id="resend-password-reset-message">Didn't get the email? </span>
							<a href="#" id="resend-password-reset">Resend email</a>
						</p>
					<?php else : ?>
						<p><?php echo esc_html( $context ); ?></p>
						<p>It is highly recommended that you update your password.</p>
						<div class="actions">
							<form method="post">
								<?php wp_nonce_field( 'reset_password_action', '_wpnonce_reset_password' ); ?>
								<button class="action action-reset" type="submit" name="reset-password">Create a new password</button>
							</form>
							<form method="post">
								<?php wp_nonce_field( 'proceed_action', '_wpnonce_proceed' ); ?>
								<button class="action action-proceed" type="submit" name="proceed">Proceed without updating</button>
							</form>
						</div>
						<p>Learn more about the <a href="#">risks of using weak passwords</a> and how to protect your account.</p>
					<?php endif; ?>
				</div>
				<?php wp_footer(); ?>
			</body>
		</html>
		<?php
	}
}
