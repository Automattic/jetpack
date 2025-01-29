<?php
/**
 * Class used to define Password Detection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Password_Detection
 */
class Password_Detection {
	/**
	 * Email service dependency.
	 *
	 * @var Email_Service
	 */
	private $email_service;

	/**
	 * Validation service dependency.
	 *
	 * @var Validation_Service
	 */
	private $validation_service;

	/**
	 * Password_Detection constructor.
	 *
	 * @param ?Email_Service      $email_service Email service instance.
	 * @param ?Validation_Service $validation_service Validation service instance.
	 */
	public function __construct( ?Email_Service $email_service = null, ?Validation_Service $validation_service = null ) {
		$this->email_service      = $email_service ?? new Email_Service();
		$this->validation_service = $validation_service ?? new Validation_Service();
	}

	/**
	 * Check if the password is safe after login.
	 *
	 * @param \WP_User|\WP_Error $user The user or error object.
	 * @param string             $password The password.
	 * @return \WP_User|\WP_Error The user object.
	 */
	public function login_form_password_detection( $user, string $password ) {
		if ( is_wp_error( $user ) || ! $this->user_requires_protection( $user, $password ) ) {
			return $user;
		}

		if ( $this->validation_service->check_weak_passwords( $password ) ) {
			// TODO: Every time the user logs in we generate a new token based transient. This might not be ideal.
			$transient = $this->generate_and_store_transient_data( $user->ID );

			$email_sent = $this->email_service->send_auth_email( $user, $transient['auth_code'] );
			if ( ! $email_sent ) {
				$this->set_transient_error( $user->ID, __( 'Failed to send authentication email. Please try again.', 'jetpack-account-protection' ) );
			}

			return new \WP_Error(
				Config::ERROR_CODE,
				Config::ERROR_MESSAGE,
				array( 'token' => $transient['token'] )
			);
		}

		return $user;
	}

	/**
	 * Handle password detection validation error.
	 *
	 * @param string    $username The username.
	 * @param \WP_Error $error The error object.
	 * @return never
	 */
	public function handle_password_detection_validation_error( $username, $error ) {
		if ( isset( $error->errors['password_detection_validation_error'] ) ) {
			$token = $error->get_error_data()['token'];
			wp_safe_redirect( $this->get_redirect_url( $token ) );
			exit;
		}
	}

	/**
	 * Render password detection page.
	 *
	 * @return never
	 */
	public function render_page() {
		if ( is_user_logged_in() ) {
			wp_safe_redirect( admin_url() );
			exit;
		}

		$token          = isset( $_GET['token'] ) ? sanitize_text_field( wp_unslash( $_GET['token'] ) ) : null;
		$transient_data = get_transient( Config::TRANSIENT_PREFIX . "_{$token}" );
		if ( ! $transient_data ) {
			$this->redirect_to_login();
		}

		$user_id      = $transient_data['user_id'] ?? null;
		$current_user = $user_id ? get_user_by( 'ID', $user_id ) : null;

		if ( ! $current_user ) {
			$this->redirect_to_login();
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// Handle resend email request
		if ( isset( $_GET['resend_email'] ) && $_GET['resend_email'] === '1' ) {
			$email_resent = $this->email_service->resend_auth_email( $current_user, $transient_data, $token );
			if ( ! $email_resent ) {
				$message = __( 'Failed to resend authentication email. Please try again.', 'jetpack-account-protection' );

				if ( $transient_data['resend_attempts'] >= Config::MAX_RESEND_ATTEMPTS ) {
					$message = __( 'Resend limit exceeded. Please try again later.', 'jetpack-account-protection' );
				}

				$this->set_transient_error( $current_user->ID, $message );
			}

			wp_safe_redirect( $this->get_redirect_url( $token ) );
			exit;
		}

		// Handle verify form submission
		if ( isset( $_POST['verify'] ) ) {
			if ( ! empty( $_POST['_wpnonce_verify'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_verify'] ) ), 'verify_action' ) ) {
				$user_input = isset( $_POST['user_input'] ) ? sanitize_text_field( wp_unslash( $_POST['user_input'] ) ) : null;

				$this->handle_auth_form_submission( $current_user, $token, $transient_data['auth_code'] ?? null, $user_input );
			} else {
				$this->set_transient_error( $current_user->ID, __( 'Nonce verification failed. Please try again.', 'jetpack-account-protection' ) );
			}
		}

		$this->render_content( $current_user->ID, $this->get_redirect_url( $token ), $this->email_service->mask_email_address( $current_user->user_email ) );
		exit;
	}

	/**
	 * Render content for password detection page.
	 *
	 * @param int    $user_id The user ID.
	 * @param string $redirect_url The redirect URL.
	 * @param string $masked_email The masked email address.
	 * @return void
	 */
	public function render_content( $user_id, string $redirect_url, string $masked_email ): void {
		$transient_key = Config::TRANSIENT_PREFIX . "_error_{$user_id}";
		$error_message = get_transient( $transient_key );
		delete_transient( $transient_key );

		defined( 'ABSPATH' ) || exit;
		?>
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title><?php echo esc_html__( 'Jetpack - Secure Your Account', 'jetpack-account-protection' ); ?></title>
				<?php wp_head(); ?>
			</head>
			<body class="password-detection-wrapper">
				<div class="password-detection">
					<?php require plugin_dir_path( __FILE__ ) . '/assets/jetpack-logo.svg'; ?>
					<p class="password-detection-title"><?php echo esc_html__( 'Verify your identity', 'jetpack-account-protection' ); ?></p>
						<p><?php echo esc_html__( 'We\'ve noticed that your current password may have been compromised in a public leak. To keep your account safe, we\'ve added an extra layer of security.', 'jetpack-account-protection' ); ?></p>
						<p>
							<?php
								printf(
									/* translators: %s: Masked email address */
									esc_html__( 'We\'ve sent a code to %s. Please check your inbox and enter the code below to verify it\'s really you.', 'jetpack-account-protection' ),
									esc_html( $masked_email )
								);
							?>
						</p>
						<div class="actions">
							<form method="post">
								<?php wp_nonce_field( 'verify_action', '_wpnonce_verify' ); ?>
								<input
									type="text" 
									name="user_input" 
									class="action-input" 
									placeholder="<?php esc_attr_e( 'Enter verification code', 'jetpack-account-protection' ); ?>" 
									required 
									pattern="\d{6}" 
									minlength="6" 
									maxlength="6" 
									inputmode="numeric" 
									oninput="this.value = this.value.replace(/\D/g, '');"
								/>
								<button class="action action-verify" type="submit" name="verify"><?php esc_html_e( 'Verify', 'jetpack-account-protection' ); ?></button>
							</form>
						</div>
						<p class="email-status">
							<span><?php esc_html_e( 'Didn\'t get the code?', 'jetpack-account-protection' ); ?> </span>
							<a href="<?php echo esc_url( $redirect_url . '&resend_email=1' ); ?>"><?php esc_html_e( 'Resend email', 'jetpack-account-protection' ); ?></a>
						</p>
						<?php if ( $error_message ) : ?>
							<p class="error-message"><?php echo esc_html( $error_message ); ?></p>
						<?php endif; ?>
				</div>
				<?php wp_footer(); ?>
			</body>
		</html>
		<?php
	}

	/**
	 * Check if the user requires password protection.
	 *
	 * @param \WP_User $user     The user object.
	 * @param string   $password The password.
	 * @return bool
	 */
	private function user_requires_protection( $user, $password ) {
		if ( ! user_can( $user, 'publish_posts' ) && ! user_can( $user, 'edit_published_posts' ) ) {
			return false;
		}

		return wp_check_password( $password, $user->user_pass, $user->ID );
	}

	/**
	 * Generate and store a consolidated transient for the user.
	 *
	 * @param int $user_id The user ID.
	 * @return string The generated token.
	 */
	private function generate_and_store_transient_data( $user_id ) {
		$token     = wp_generate_password( 32, false, false );
		$auth_code = $this->email_service->generate_auth_code();

		$data = array(
			'user_id'         => $user_id,
			'auth_code'       => $auth_code,
			'resend_attempts' => 1,
		);

		$transient_set = set_transient( Config::TRANSIENT_PREFIX . "_{$token}", $data, Config::EMAIL_SENT_EXPIRATION );
		if ( ! $transient_set ) {
			$this->set_transient_error( $user_id, __( 'Failed to set transient data. Please try again.', 'jetpack-account-protection' ) );
		}

		return array(
			'token'     => $token,
			'auth_code' => $auth_code,
		);
	}

	/**
	 * Redirect to the login page.
	 */
	private function redirect_to_login() {
		wp_safe_redirect( wp_login_url() );
		exit;
	}

	/**
	 * Get redirect URL.
	 *
	 * @param string $token The token.
	 * @return string The redirect URL.
	 */
	private function get_redirect_url( $token ) {
		return home_url( '/wp-login.php?action=password-detection&token=' . $token );
	}

	/**
	 * Handle auth form submission.
	 *
	 * @param \WP_User $current_user The current user.
	 * @param string   $token        The token.
	 * @param string   $auth_code    The expected auth code.
	 * @param string   $user_input   The user input.
	 */
	private function handle_auth_form_submission( $current_user, $token, $auth_code, $user_input ) {
		if ( $auth_code && $auth_code === $user_input ) {
			// TODO: Ensure all transient are also removed on module and/or plugin deactivation
			delete_transient( Config::TRANSIENT_PREFIX . "_{$token}" );
			wp_set_auth_cookie( $current_user->ID, true );
			// TODO: Notify user to update their password/redirect to password update page
			wp_safe_redirect( admin_url() );
			exit;
		} else {
			$this->set_transient_error( $current_user->ID, __( 'Authentication code verification failed. Please try again.', 'jetpack-account-protection' ) );
		}
	}

	/**
	 * Set a transient error message.
	 *
	 * @param int    $user_id    The user ID.
	 * @param string $message    The error message.
	 * @param int    $expiration The expiration time in seconds.
	 */
	private function set_transient_error( int $user_id, string $message, int $expiration = 60 ): void {
		set_transient( Config::TRANSIENT_PREFIX . "_error_{$user_id}", esc_html( $message ), $expiration );
	}

	/**
	 * Mask an email address like d*****@g*****.com.
	 *
	 * @param string $email The email address to mask.
	 * @return string The masked email address.
	 */
	public function mask_email_address( string $email ): string {
		$parts         = explode( '@', $email );
		$name          = $parts[0];
		$domain        = $parts[1];
		$masked_name   = substr( $name, 0, 1 ) . str_repeat( '*', strlen( $name ) - 1 );
		$domain_parts  = explode( '.', $domain );
		$masked_domain = substr( $domain_parts[0], 0, 1 ) . str_repeat( '*', strlen( $domain_parts[0] ) - 1 ) . '.' . $domain_parts[1];

		return $masked_name . '@' . $masked_domain;
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
}
