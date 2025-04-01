<?php
/**
 * Class used to define Password Detection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;

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

		// Skip if we're validating a Brute force protection recovery token
		if ( get_transient( 'jetpack_protect_recovery_key_validated_' . $user->ID ) ) {
			return $user;
		}

		if ( ! $this->validation_service->is_leaked_password( $password ) ) {
			return $user;
		}

		$auth_code                = $this->email_service->generate_auth_code();
		$existing_transient_token = get_transient( Config::PREFIX . "_last_valid_token_{$user->ID}" );
		$existing_transient       = $existing_transient_token ? get_transient( Config::PREFIX . "_{$existing_transient_token}" ) : null;

		if ( $existing_transient && isset( $existing_transient['requests'] ) &&
			$existing_transient['requests'] >= Config::PASSWORD_DETECTION_EMAIL_REQUEST_LIMIT ) {

			// Resend limit reached, prevent sending new email
			$this->set_transient_error(
				$user->ID,
				array(
					'code'    => 'email_request_limit_exceeded',
					'message' => __( 'Email request limit exceeded. Please try again later.', 'jetpack-account-protection' ),
				)
			);

			$this->redirect_and_exit( $this->get_redirect_url( $existing_transient_token ) );

		}

		$email_sent = $this->email_service->api_send_auth_email( $user->ID, $auth_code );

		if ( is_wp_error( $email_sent ) ) {
			$this->set_transient_error(
				$user->ID,
				array(
					'code'    => $email_sent->get_error_code(),
					'message' => $email_sent->get_error_message(),
				)
			);
		}

		$new_transient_token = null;

		// Update or create a transient token
		if ( $existing_transient ) {
			if ( ! is_wp_error( $email_sent ) ) {
				$existing_transient['auth_code'] = $auth_code;
				$existing_transient['requests']  = ( $existing_transient['requests'] ?? 0 ) + 1;

				if ( ! set_transient( Config::PREFIX . "_{$existing_transient_token}", $existing_transient, Config::PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION ) ) {
					$this->set_transient_error(
						$user->ID,
						array(
							'code'    => 'transient_error',
							'message' => __( 'Failed to update authentication token. Please try again.', 'jetpack-account-protection' ),
						)
					);
				}
			}
		} else {
			$new_transient_token = $this->generate_and_store_transient_data( $user->ID, $auth_code );
		}

		$this->redirect_and_exit( $this->get_redirect_url( $new_transient_token ? $new_transient_token : $existing_transient_token ) );
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
		$transient_data = get_transient( Config::PREFIX . "_{$token}" );
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
				$email_resent = $this->email_service->resend_auth_email( $user->ID, $transient_data, $token );
				if ( is_wp_error( $email_resent ) ) {
					$this->set_transient_error(
						$user->ID,
						array(
							'code'    => $email_resent->get_error_code(),
							'message' => $email_resent->get_error_message(),
						)
					);
				} else {
					$this->set_transient_success(
						$user->ID,
						array(
							'code'    => 'email_resend_success',
							'message' => __( 'Authentication email resent successfully.', 'jetpack-account-protection' ),
						)
					);
				}

				$this->redirect_and_exit( $this->get_redirect_url( $token ) );
				// @phan-suppress-next-line PhanPluginUnreachableCode This would fall through in unit tests otherwise.
				return;
			} else {
				$this->set_transient_error(
					$user->ID,
					array(
						'code'    => 'email_resend_nonce_error',
						'message' => __( 'Resend nonce verification failed. Please try again.', 'jetpack-account-protection' ),
					)
				);
			}
		}

		// Handle verify form submission
		if ( isset( $_POST['verify'] ) ) {
			if ( ! empty( $_POST['_wpnonce_verify'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_verify'] ) ), 'verify_action' ) ) {
				$user_input = isset( $_POST['user_input'] ) ? sanitize_text_field( wp_unslash( $_POST['user_input'] ) ) : null;

				$this->handle_auth_form_submission( $user, $token, $transient_data['auth_code'] ?? null, $user_input );
			} else {
				$this->set_transient_error(
					$user->ID,
					array(
						'code'    => 'verify_nonce_error',
						'message' => __( 'Verify nonce verification failed. Please try again.', 'jetpack-account-protection' ),
					)
				);
			}
		}

		$this->render_content( $user, $token );
	}

	/**
	 * Extract transient data safely and delete the transient.
	 *
	 * @param string $transient_key The transient key.
	 * @return array An array containing 'message' and 'code'.
	 */
	public function extract_and_clear_transient_data( string $transient_key ): array {
		$data = get_transient( $transient_key );
		delete_transient( $transient_key );

		return array(
			'message' => $data['message'] ?? null,
			'code'    => $data['code'] ?? null,
		);
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
		$error_transient_key   = Config::PREFIX . "_error_{$user->ID}";
		$success_transient_key = Config::PREFIX . "_success_{$user->ID}";

		$error_data   = $this->extract_and_clear_transient_data( $error_transient_key );
		$success_data = $this->extract_and_clear_transient_data( $success_transient_key );

		$body_classes = 'password-detection-wrapper';
		if ( 'auth_code_success' === $success_data['code'] ) {
			$body_classes .= ' interim-login-success';
		}

		?>
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title><?php esc_html_e( 'Jetpack - Secure Your Account', 'jetpack-account-protection' ); ?></title>
				<?php wp_head(); ?>
			</head>
			<body class="<?php echo esc_attr( $body_classes ); ?>">
				<div class="password-detection-content">
					<?php
						$jetpack_logo = new Jetpack_Logo();
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						echo $jetpack_logo->get_jp_emblem( true );
					?>
					<p class="password-detection-title"><?php echo $success_data['code'] === 'auth_code_success' ? esc_html__( 'Take action to stay secure', 'jetpack-account-protection' ) : esc_html__( 'Verify your identity', 'jetpack-account-protection' ); ?></p>
					<?php if ( $error_data['message'] ) : ?>
						<div class="error notice">
							<p class="notice-message"><?php echo esc_html( $error_data['message'] ); ?></p>
						</div>
					<?php endif; ?>
					<?php if ( $success_data['message'] ) : ?>
						<div class="success notice">
							<p class="notice-message"><?php echo esc_html( $success_data['message'] ); ?></p>
						</div>
					<?php endif; ?>
					<?php if ( $success_data['code'] === 'auth_code_success' ) : ?>
						<p><?php esc_html_e( "You're all set! You can now access your account.", 'jetpack-account-protection' ); ?></p>
						<p><?php esc_html_e( 'Please keep in mind that your current password was found in a public leak, which means your account might be at risk. It is highly recommended that you update your password.', 'jetpack-account-protection' ); ?></p>
						<div class="actions">
							<a href="<?php echo esc_url( admin_url( 'profile.php#password' ) ); ?>" class="action action-update-password">
								<?php esc_html_e( 'Create a new password', 'jetpack-account-protection' ); ?>
							</a>
							<a href="<?php echo esc_url( admin_url() ); ?>" class="action action-proceed">
								<?php esc_html_e( 'Proceed without updating', 'jetpack-account-protection' ); ?>
							</a>
						</div>

						<p>
							<?php
								printf(
									/* translators: %s: Risks of using weak passwords link */
									esc_html__( 'Learn more about the %s and how to protect your account.', 'jetpack-account-protection' ),
									'<a class="risks-link" href="' . esc_url( Config::SUPPORT_LINK . '#risks-of-using-a-weak-password' ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'risks of using weak passwords', 'jetpack-account-protection' ) . '</a>'
								);
							?>
						</p>
					<?php else : ?>
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
						<?php if ( in_array( $error_data['code'], array( 'email_request_limit_exceeded', 'email_send_error' ), true ) ) : ?>
							<p class="account-recovery">
								<?php
									printf(
										/* translators: %s: Jetpack support link */
										esc_html__( 'If you did not receive your authentication code, please try again later or %s now.', 'jetpack-account-protection' ),
										'<a class="risks-link" href="' . esc_url( wp_lostpassword_url() ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'reset your password', 'jetpack-account-protection' ) . '</a>'
									);
								?>
							</p>
						<?php else : ?>
							<p class="email-status">
								<span><?php esc_html_e( "Didn't get the code?", 'jetpack-account-protection' ); ?> </span>
								<a class="resend-email-link" href="<?php echo esc_url( $this->get_redirect_url( $token ) . '&resend_email=1&_wpnonce=' . wp_create_nonce( 'resend_email_nonce' ) ); ?>">
									<?php esc_html_e( 'Resend email', 'jetpack-account-protection' ); ?>
								</a>
							</p>
						<?php endif; ?>
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

		/**
		 * Filter which determines whether or not password detection should be applied for the provided user.
		 *
		 * @since 0.1.0
		 *
		 * @param bool     $requires_protection Whether or not password detection should be applied.
		 * @param \WP_User $user                The user object to apply the filter against.
		 */

		$user_requires_protection = apply_filters( 'jetpack_account_protection_user_requires_protection', true, $user );

		if ( ! $user_requires_protection ) {
			return false;
		}

		return wp_check_password( $password, $user->user_pass, $user->ID );
	}

	/**
	 * Generate and store a consolidated transient for the user.
	 *
	 * @param int    $user_id The user ID.
	 * @param string $auth_code The auth code.
	 *
	 * @return string The generated token associated with the new transient data.
	 */
	private function generate_and_store_transient_data( int $user_id, string $auth_code ): string {
		$token = wp_generate_password( 32, false, false );

		$data = array(
			'user_id'   => $user_id,
			'auth_code' => $auth_code,
			'requests'  => 1,
		);

		$set_token_transient = set_transient( Config::PREFIX . "_{$token}", $data, Config::PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION );
		$set_user_transient  = set_transient( Config::PREFIX . "_last_valid_token_{$user_id}", $token, Config::PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION );
		if ( ! $set_token_transient || ! $set_user_transient ) {
			$this->set_transient_error(
				$user_id,
				array(
					'code'    => 'transient_error',
					'message' => __( 'Failed to set transient data. Please try again.', 'jetpack-account-protection' ),
				)
			);
		}

		return $token;
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
			$this->set_transient_success(
				$user->ID,
				array(
					'code'    => 'auth_code_success',
					'message' => __( 'Authentication code verified successfully.', 'jetpack-account-protection' ),
				)
			);

			delete_transient( Config::PREFIX . "_{$token}" );
			delete_transient( Config::PREFIX . "_last_valid_token_{$user->ID}" );
			wp_set_auth_cookie( $user->ID, true );
			wp_set_current_user( $user->ID );
		} else {
			$this->set_transient_error(
				$user->ID,
				array(
					'code'    => 'auth_code_error',
					'message' => __( 'Authentication code verification failed. Please try again.', 'jetpack-account-protection' ),
				)
			);
		}
	}

	/**
	 * Set a transient success message.
	 *
	 * @param int   $user_id    The user ID.
	 * @param array $success    An array of the success code and message.
	 * @param int   $expiration The expiration time in seconds.
	 *
	 * @return void
	 */
	public function set_transient_success( int $user_id, array $success, int $expiration = 60 ): void {
		set_transient( Config::PREFIX . "_success_{$user_id}", $success, $expiration );
	}

	/**
	 * Set a transient error message.
	 *
	 * @param int   $user_id    The user ID.
	 * @param array $error      An array of the error code and message.
	 * @param int   $expiration The expiration time in seconds.
	 *
	 * @return void
	 */
	public function set_transient_error( int $user_id, array $error, int $expiration = 60 ): void {
		set_transient( Config::PREFIX . "_error_{$user_id}", $error, $expiration );
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
		// phpcs:ignore WordPress.Security.NonceVerification
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
