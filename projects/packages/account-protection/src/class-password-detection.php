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
	 *
	 * @return \WP_User|\WP_Error The user object.
	 */
	public function login_form_password_detection( $user, string $password ) {
		if ( is_wp_error( $user ) || ! $this->user_requires_protection( $user, $password ) ) {
			return $user;
		}

		if ( $this->validation_service->is_weak_password( $password ) ) {
			$transient = $this->generate_and_store_transient_data( $user->ID );

			$email_sent = $this->email_service->api_send_auth_email( $user, $transient['auth_code'] );
			if ( ! $email_sent ) {
				$this->set_transient_error( $user->ID, __( 'Failed to send authentication email. Please try again.', 'jetpack-account-protection' ) );
			}

			return new \WP_Error(
				Config::PASSWORD_DETECTION_ERROR_CODE,
				__( 'Password validation failed.', 'jetpack-account-protection' ),
				array( 'token' => $transient['token'] )
			);
		}

		return $user;
	}

	/**
	 * Redirect and exit.
	 *
	 * @param string $redirect_location The redirect location.
	 *
	 * @return never
	 */
	protected function redirect_and_exit( string $redirect_location ) {
		wp_safe_redirect( $redirect_location );
		$this->exit();
	}

	/**
	 * Exit decoupling.
	 *
	 * @return never
	 */
	protected function exit() {
		exit;
	}

	/**
	 * Handle password detection validation error.
	 *
	 * @param string    $username The username.
	 * @param \WP_Error $error The error object.
	 *
	 * @return void
	 */
	public function handle_password_detection_validation_error( string $username, \WP_Error $error ): void {
		if ( isset( $error->errors['password_detection_validation_error'] ) ) {
			$token = $error->get_error_data()['token'];
			$this->redirect_and_exit( $this->get_redirect_url( $token ) );
		}
	}

	/**
	 * Load user by ID. Dependency decoupling.
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return \WP_User|null The user object.
	 */
	protected function load_user( int $user_id ) {
		return get_user_by( 'ID', $user_id );
	}

	/**
	 * Render password detection page.
	 */
	public function render_page() {
		if ( is_user_logged_in() ) {
			$this->redirect_and_exit( admin_url() );
			// @phan-suppress-next-line PhanPluginUnreachableCode This would fall through in unit tests otherwise.
			return;
		}

		$token          = isset( $_GET['token'] ) ? sanitize_text_field( wp_unslash( $_GET['token'] ) ) : null;
		$transient_data = get_transient( Config::PASSWORD_DETECTION_TRANSIENT_PREFIX . "_{$token}" );
		if ( ! $transient_data ) {
			$this->redirect_to_login();
			// @phan-suppress-next-line PhanPluginUnreachableCode This would fall through in unit tests otherwise.
			return;
		}

		$user_id = $transient_data['user_id'] ?? null;
		$user    = $user_id ? $this->load_user( (int) $user_id ) : null;
		if ( ! $user instanceof \WP_User ) {
			$this->redirect_to_login();
			// @phan-suppress-next-line PhanPluginUnreachableCode This would fall through in unit tests otherwise.
			return;
		}

		// Handle resend email request
		if ( isset( $_GET['resend_email'] ) && $_GET['resend_email'] === '1' ) {
			if ( isset( $_GET['_wpnonce'] )
			&& wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'resend_email_nonce' )
			) {
				$email_resent = $this->email_service->resend_auth_email( $user, $transient_data, $token );
				if ( ! $email_resent ) {
					$message = __( 'Failed to resend authentication email. Please try again.', 'jetpack-account-protection' );

					if ( $transient_data['resend_attempts'] >= Config::PASSWORD_DETECTION_MAX_RESEND_ATTEMPTS ) {
						$message = __( 'Resend limit exceeded. Please try again later.', 'jetpack-account-protection' );
					}

					$this->set_transient_error( $user->ID, $message );
				}

				$this->redirect_and_exit( $this->get_redirect_url( $token ) );
				// @phan-suppress-next-line PhanPluginUnreachableCode This would fall through in unit tests otherwise.
				return;
			} else {
				$this->set_transient_error( $user->ID, __( 'Resend nonce verification failed. Please try again.', 'jetpack-account-protection' ) );
			}
		}

		// Handle verify form submission
		if ( isset( $_POST['verify'] ) ) {
			if ( ! empty( $_POST['_wpnonce_verify'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_verify'] ) ), 'verify_action' ) ) {
				$user_input = isset( $_POST['user_input'] ) ? sanitize_text_field( wp_unslash( $_POST['user_input'] ) ) : null;

				$this->handle_auth_form_submission( $user, $token, $transient_data['auth_code'] ?? null, $user_input );
				return;
			} else {
				$this->set_transient_error( $user->ID, __( 'Verify nonce verification failed. Please try again.', 'jetpack-account-protection' ) );
			}
		}

		$this->render_content( $user, $token );
	}

	/**
	 * Render content for password detection page.
	 *
	 * @param \WP_User $user The user.
	 * @param string   $token The token.
	 *
	 * @return void
	 */
	public function render_content( \WP_User $user, string $token ): void {
		$transient_key = Config::PASSWORD_DETECTION_TRANSIENT_PREFIX . "_error_{$user->ID}";
		$error_message = get_transient( $transient_key );
		delete_transient( $transient_key );

		defined( 'ABSPATH' ) || exit;
		?>
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title><?php esc_html_e( 'Jetpack - Secure Your Account', 'jetpack-account-protection' ); ?></title>
				<?php wp_head(); ?>
			</head>
			<body class="password-detection-wrapper">
				<div class="password-detection">
					<?php require plugin_dir_path( __FILE__ ) . '/assets/jetpack-logo.svg'; ?>
					<p class="password-detection-title"><?php esc_html_e( 'Verify your identity', 'jetpack-account-protection' ); ?></p>
						<p><?php esc_html_e( 'We\'ve noticed that your current password may have been compromised in a public leak. To keep your account safe, we\'ve added an extra layer of security.', 'jetpack-account-protection' ); ?></p>
						<p>
							<?php
								printf(
									/* translators: %s: Masked email address */
									esc_html__( 'We\'ve sent a code to %s. Please check your inbox and enter the code below to verify it\'s really you.', 'jetpack-account-protection' ),
									esc_html( $this->email_service->mask_email_address( $user->user_email ) )
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
							<a href="<?php echo esc_url( $this->get_redirect_url( $token ) . '&resend_email=1&_wpnonce=' . wp_create_nonce( 'resend_email_nonce' ) ); ?>">
								<?php esc_html_e( 'Resend email', 'jetpack-account-protection' ); ?>
							</a>
						</p>
						<?php if ( $error_message ) : ?>
							<p class="error-message"><?php echo esc_html( $error_message ); ?></p>
						<?php endif; ?>
				</div>
				<?php wp_footer(); ?>
			</body>
		</html>
		<?php
		$this->exit();
	}

	/**
	 * Check if the user requires password protection.
	 *
	 * @param \WP_User $user     The user object.
	 * @param string   $password The password.
	 *
	 * @return bool
	 */
	private function user_requires_protection( \WP_User $user, string $password ): bool {
		if ( ! user_can( $user, 'publish_posts' ) && ! user_can( $user, 'edit_published_posts' ) ) {
			return false;
		}

		return wp_check_password( $password, $user->user_pass, $user->ID );
	}

	/**
	 * Generate and store a consolidated transient for the user.
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return array An array of the generated token and auth code.
	 */
	private function generate_and_store_transient_data( int $user_id ): array {
		$token     = wp_generate_password( 32, false, false );
		$auth_code = $this->email_service->generate_auth_code();

		$data = array(
			'user_id'         => $user_id,
			'auth_code'       => $auth_code,
			'resend_attempts' => 0,
		);

		$transient_set = set_transient( Config::PASSWORD_DETECTION_TRANSIENT_PREFIX . "_{$token}", $data, Config::PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION );
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
	 *
	 * @return never
	 */
	private function redirect_to_login() {
		$this->redirect_and_exit( wp_login_url() );
	}

	/**
	 * Get redirect URL.
	 *
	 * @param string $token The token.
	 *
	 * @return string The redirect URL.
	 */
	private function get_redirect_url( string $token ): string {
		return home_url( '/wp-login.php?action=password-detection&token=' . $token );
	}

	/**
	 * Handle auth form submission.
	 *
	 * @param \WP_User $user The current user.
	 * @param string   $token        The token.
	 * @param string   $auth_code    The expected auth code.
	 * @param string   $user_input   The user input.
	 *
	 * @return void
	 */
	private function handle_auth_form_submission( \WP_User $user, string $token, string $auth_code, string $user_input ): void {
		if ( $auth_code && $auth_code === $user_input ) {
			// TODO: Ensure all transient are also removed on module and/or plugin deactivation
			delete_transient( Config::PASSWORD_DETECTION_TRANSIENT_PREFIX . "_{$token}" );
			wp_set_auth_cookie( $user->ID, true );
			// TODO: Notify user to update their password/redirect to password update page
			$this->redirect_and_exit( admin_url() );
		} else {
			$this->set_transient_error( $user->ID, __( 'Authentication code verification failed. Please try again.', 'jetpack-account-protection' ) );
		}
	}

	/**
	 * Set a transient error message.
	 *
	 * @param int    $user_id    The user ID.
	 * @param string $message    The error message.
	 * @param int    $expiration The expiration time in seconds.
	 *
	 * @return void
	 */
	private function set_transient_error( int $user_id, string $message, int $expiration = 60 ): void {
		set_transient( Config::PASSWORD_DETECTION_TRANSIENT_PREFIX . "_error_{$user_id}", $message, $expiration );
	}

	/**
	 * Enqueue the password detection page styles.
	 *
	 * @return void
	 */
	public function enqueue_styles(): void {
		global $pagenow;
		if ( ! isset( $pagenow ) || $pagenow !== 'wp-login.php' ) {
			return;
		}
		// No nonce verification necessary - reading only
		// phpcs:disable WordPress.Security.NonceVerification
		if ( isset( $_GET['action'] ) && $_GET['action'] === 'password-detection' ) {
			wp_enqueue_style(
				'password-detection-styles',
				plugin_dir_url( __FILE__ ) . 'css/password-detection.css',
				array(),
				Account_Protection::PACKAGE_VERSION
			);
		}
	}
}
