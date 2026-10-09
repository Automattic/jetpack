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
	 * Values of the attempt locks this request holds, keyed by user ID.
	 *
	 * @var string[]
	 */
	private $attempt_locks = array();

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
	 * @param \WP_User|\WP_Error|null $user The user or error object, or null.
	 * @param string|null             $password The password.
	 *
	 * @return \WP_User|\WP_Error|null The user object, error object, or null.
	 */
	public function login_form_password_detection( $user, ?string $password = null ) {
		// First check if the user object and password are valid. Third-party plugins might pass
		// incompatible types to authentication hooks, so we need this extra check.
		if ( is_wp_error( $user ) || ! ( $user instanceof \WP_User ) || $password === null ) {
			return $user;
		}

		if ( ! $this->user_requires_protection( $user, $password ) ) {
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

		// The same limit applies per user across the network.
		if ( $this->email_service->user_email_limit_reached( $user->ID ) ) {
			$this->set_transient_error(
				$user->ID,
				array(
					'code'    => 'email_request_limit_exceeded',
					'message' => __( 'Email request limit exceeded. Please try again later.', 'jetpack-account-protection' ),
				)
			);

			$this->redirect_and_exit( $this->get_redirect_url( $existing_transient_token ? $existing_transient_token : $this->generate_and_store_transient_data( $user->ID, $auth_code ) ) );
			// @phan-suppress-next-line PhanPluginUnreachableCode This would fall through in unit tests otherwise.
			return $user;
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
		} else {
			$this->email_service->count_user_email( $user->ID );
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
			$this->redirect_and_exit( get_dashboard_url( get_current_user_id() ) );
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

				$this->handle_auth_form_submission( $user, $token, $transient_data, $user_input );
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
							<a href="<?php echo esc_url( get_dashboard_url( $user->ID, 'profile.php#password' ) ); ?>" class="action action-update-password">
								<?php esc_html_e( 'Create a new password', 'jetpack-account-protection' ); ?>
							</a>
							<a href="<?php echo esc_url( get_dashboard_url( $user->ID ) ); ?>" class="action action-proceed">
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
						<p>
							<?php
								printf(
									/* translators: %s: Jetpack Account Protection link */
									esc_html__( '%s has flagged that your password may appear in a known data breach.', 'jetpack-account-protection' ),
									'<a class="how-it-works-link" href="' . esc_url( Config::SUPPORT_LINK . '#how-account-protection-works' ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Jetpack Account Protection', 'jetpack-account-protection' ) . '</a>'
								);
							?>
						</p>
						<p><?php esc_html_e( 'This security feature is enabled on this site to help keep your account safe.', 'jetpack-account-protection' ); ?></p>
						<p>
							<?php
								printf(
									/* translators: %s: Masked email address */
									esc_html__( 'As an extra layer of security, we\'ve sent a verification code to your WordPress profile email address (%s).', 'jetpack-account-protection' ),
									esc_html( $this->email_service->mask_email_address( $user->user_email ) )
								);
							?>
						</p>
						<p>
							<?php esc_html_e( 'Please check your inbox and enter the code below to complete your login:', 'jetpack-account-protection' ); ?>
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
						<?php if ( in_array( $error_data['code'], array( 'email_request_limit_exceeded', 'email_send_error', 'auth_code_user_attempt_limit_exceeded' ), true ) ) : ?>
							<p class="account-recovery">
								<?php
									printf(
										/* translators: %s: Jetpack support link */
										esc_html__( 'If you did not receive your authentication code or are experiencing difficulties using it, try again later or %s now.', 'jetpack-account-protection' ),
										'<a class="risks-link" href="' . esc_url( wp_lostpassword_url() ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'reset your password', 'jetpack-account-protection' ) . '</a>'
									);
								?>
							</p>
						<?php else : ?>
							<p class="email-status">
								<?php
									printf(
										/* translators: %s: Resend email link */
										esc_html__( "Didn't get the code? Check your spam folder or %s.", 'jetpack-account-protection' ),
										'<a class="resend-email-link" href="' . esc_url( $this->get_redirect_url( $token ) . '&resend_email=1&_wpnonce=' . wp_create_nonce( 'resend_email_nonce' ) ) . '">' . esc_html__( 'resend the email', 'jetpack-account-protection' ) . '</a>'
									);
								?>
							</p>
							<p class="email-status">
								<?php
								printf(
									/* translators: %s: Contact Jetpack Support link */
									esc_html__( 'No longer have access to this email address or need additional help? %s.', 'jetpack-account-protection' ),
									'<a class="contact-support-link" href="' . esc_url( 'https://jetpack.com/contact-support/?rel=support' ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Contact Jetpack Support', 'jetpack-account-protection' ) . '</a>'
								);
								?>
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
		$can_publish         = user_can( $user, 'publish_posts' ) || user_can( $user, 'edit_published_posts' );
		$password_is_correct = null;

		// On multisite, a publishing role on any of the user's sites counts. Looked up only for a correct password.
		if ( ! $can_publish && $this->is_multisite() ) {
			$password_is_correct = wp_check_password( $password, $user->user_pass, $user->ID );
			$can_publish         = $password_is_correct && $this->user_can_publish_on_another_site( $user );
		}

		if ( ! $can_publish ) {
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

		return $password_is_correct ?? wp_check_password( $password, $user->user_pass, $user->ID );
	}

	/**
	 * Whether this is a multisite network. Dependency decoupling.
	 *
	 * @return bool
	 */
	protected function is_multisite(): bool {
		return is_multisite();
	}

	/**
	 * Whether the user can publish on any other site of the network they belong to.
	 *
	 * @param \WP_User $user The user object.
	 *
	 * @return bool
	 */
	protected function user_can_publish_on_another_site( \WP_User $user ): bool {
		$current_site_id = get_current_blog_id();

		foreach ( get_blogs_of_user( $user->ID ) as $site ) {
			if ( (int) $site->userblog_id === $current_site_id ) {
				continue;
			}

			switch_to_blog( $site->userblog_id );
			// Pass the ID, not the object: the object's capabilities are bound to the site it was loaded on.
			$can_publish = user_can( $user->ID, 'publish_posts' ) || user_can( $user->ID, 'edit_published_posts' );
			restore_current_blog();

			if ( $can_publish ) {
				return true;
			}
		}

		return false;
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
	 * @param \WP_User    $user           The current user.
	 * @param string      $token          The token.
	 * @param array       $transient_data The stored data for the token.
	 * @param string|null $user_input     The user input.
	 *
	 * @return void
	 */
	private function handle_auth_form_submission( \WP_User $user, string $token, array $transient_data, ?string $user_input ): void {
		// One submission per user is checked at a time, so every wrong try is counted before the next is read.
		if ( ! $this->acquire_attempt_lock( $user->ID ) ) {
			$this->set_transient_error(
				$user->ID,
				array(
					'code'    => 'auth_code_error',
					'message' => __( 'Authentication code verification failed. Please try again.', 'jetpack-account-protection' ),
				)
			);
			return;
		}

		try {
			$this->check_auth_code( $user, $token, $transient_data, $user_input );
		} finally {
			$this->release_attempt_lock( $user->ID );
		}
	}

	/**
	 * Check a submitted code against the stored one and count it when it is wrong.
	 *
	 * @param \WP_User    $user           The current user.
	 * @param string      $token          The token.
	 * @param array       $transient_data The stored data for the token.
	 * @param string|null $user_input     The user input.
	 *
	 * @return void
	 */
	private function check_auth_code( \WP_User $user, string $token, array $transient_data, ?string $user_input ): void {
		$auth_code = $transient_data['auth_code'] ?? null;

		// Wrong tries are counted per code, so a newly sent code starts from zero, and per user across the network.
		$code_attempts_key = Config::PREFIX . "_failed_attempts_{$token}_{$auth_code}";
		$user_attempts_key = Config::PREFIX . "_failed_attempts_user_{$user->ID}";
		$code_attempts     = (int) get_transient( $code_attempts_key );
		$user_attempts     = (int) get_site_transient( $user_attempts_key );
		$can_try           = $code_attempts < Config::PASSWORD_DETECTION_FAILED_ATTEMPT_LIMIT
			&& $user_attempts < Config::PASSWORD_DETECTION_USER_FAILED_ATTEMPT_LIMIT;

		if ( $can_try && $auth_code && $auth_code === $user_input ) {
			$this->set_transient_success(
				$user->ID,
				array(
					'code'    => 'auth_code_success',
					'message' => __( 'Authentication code verified successfully.', 'jetpack-account-protection' ),
				)
			);

			delete_transient( Config::PREFIX . "_{$token}" );
			delete_transient( Config::PREFIX . "_last_valid_token_{$user->ID}" );
			delete_transient( $code_attempts_key );
			delete_site_transient( $user_attempts_key );
			delete_site_transient( Email_Service::get_user_email_count_key( $user->ID ) );
			wp_set_auth_cookie( $user->ID, true );
			wp_set_current_user( $user->ID );
			return;
		}

		if ( $can_try ) {
			set_transient( $code_attempts_key, ++$code_attempts, Config::PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION );
			set_site_transient( $user_attempts_key, ++$user_attempts, Config::PASSWORD_DETECTION_USER_FAILED_ATTEMPT_EXPIRATION );
		}

		if ( $user_attempts >= Config::PASSWORD_DETECTION_USER_FAILED_ATTEMPT_LIMIT ) {
			$this->set_transient_error(
				$user->ID,
				array(
					'code'    => 'auth_code_user_attempt_limit_exceeded',
					'message' => __( 'Too many incorrect verification codes. Please try again later.', 'jetpack-account-protection' ),
				)
			);
			return;
		}

		if ( $code_attempts >= Config::PASSWORD_DETECTION_FAILED_ATTEMPT_LIMIT ) {
			$this->set_transient_error(
				$user->ID,
				array(
					'code'    => 'auth_code_attempt_limit_exceeded',
					'message' => __( 'Too many incorrect verification codes. Please request a new code.', 'jetpack-account-protection' ),
				)
			);
			return;
		}

		$this->set_transient_error(
			$user->ID,
			array(
				'code'    => 'auth_code_error',
				'message' => __( 'Authentication code verification failed. Please try again.', 'jetpack-account-protection' ),
			)
		);
	}

	/**
	 * Take the lock for checking a user's submitted code. Dependency decoupling.
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return bool Whether the lock was taken.
	 */
	protected function acquire_attempt_lock( int $user_id ): bool {
		global $wpdb;

		$table = $this->get_attempt_lock_table();
		$name  = Config::PREFIX . "_attempt_lock_{$user_id}";
		$now   = time();
		// The time it was taken, then digits that tell this request's lock from any other.
		$value = sprintf( '%d.%09d', $now, wp_rand( 0, 999999999 ) );

		// INSERT IGNORE adds the row only when there is none, as WP_Upgrader::create_lock() does.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- The Options API cannot add a row only when it is missing; the table name is not user input.
		$taken = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO {$table} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $name, $value ) );

		if ( ! $taken ) {
			// Take over a lock that a request left behind without releasing it.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- See above.
			$taken = $wpdb->query( $wpdb->prepare( "UPDATE {$table} SET option_value = %s WHERE option_name = %s AND option_value + 0 < %d", $value, $name, $now - Config::PASSWORD_DETECTION_ATTEMPT_LOCK_EXPIRATION ) );
		}

		if ( $taken ) {
			$this->attempt_locks[ $user_id ] = $value;
		}

		return (bool) $taken;
	}

	/**
	 * Release the lock for checking a user's submitted code. Dependency decoupling.
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return void
	 */
	protected function release_attempt_lock( int $user_id ): void {
		global $wpdb;

		if ( ! isset( $this->attempt_locks[ $user_id ] ) ) {
			return;
		}

		// Matching the value leaves the row alone when another request has since taken the lock over.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- The lock row is not written through the Options API.
		$wpdb->delete(
			$this->get_attempt_lock_table(),
			array(
				'option_name'  => Config::PREFIX . "_attempt_lock_{$user_id}",
				'option_value' => $this->attempt_locks[ $user_id ],
			)
		);
		unset( $this->attempt_locks[ $user_id ] );
	}

	/**
	 * Get the table holding the lock, which on multisite is the main site's so the network shares it.
	 *
	 * @return string
	 */
	private function get_attempt_lock_table(): string {
		global $wpdb;

		return is_multisite() ? $wpdb->get_blog_prefix( get_main_site_id() ) . 'options' : $wpdb->options;
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
