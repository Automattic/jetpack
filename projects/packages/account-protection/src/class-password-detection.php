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

	const PASSWORD_DETECTION_USER_META_KEY = 'jetpack_account_protection_password_status';

	/**
	 * Redirect to the password detection page.
	 *
	 * @return string The URL to redirect to.
	 */
	public static function password_detection_redirect() {
		return home_url( '/wp-login.php?action=password-detection' );
	}

	/**
	 * Check if the password is safe after login.
	 *
	 * @param WP_User $user The user object.
	 * @param string  $password The password.
	 * @return WP_User The user object.
	 */
	public static function login_form_password_detection( $user, $password ) {
		if ( ! self::validate_password( $password ) ) {
			// TODO: Ensure this usermeta is always up to date
			self::add_password_detection_usermeta( $user->ID, 'unsafe' );

			// Redirect to the password detection page
			add_filter( 'login_redirect', __CLASS__ . '::password_detection_redirect', 10, 3 );
		} else {
			self::add_password_detection_usermeta( $user->ID, 'safe' );

		}

		return $user;
	}

	/**
	 * Render password detection page.
	 *
	 * This page is shown to users with unsafe passwords after login.
	 *
	 * @return void
	 */
	public static function render_password_detection_page() {
		// Restrict direct access to logged in users
		$current_user = wp_get_current_user();
		if ( 0 === $current_user->ID ) {
			wp_safe_redirect( wp_login_url() );
			exit;
		}

		// Restrict direct access to users with unsafe passwords
		$user_password_status = self::get_password_detection_usermeta( $current_user->ID );
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

		add_action( 'wp_enqueue_scripts', __CLASS__ . '::enqueue_password_detection_styles' );

		// Handle reset_password_action form submission
		if ( isset( $_POST['reset-password'] ) ) {
			$reset = true;

			// Verify nonce
			if ( isset( $_POST['_wpnonce_reset_password'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce_reset_password'] ) ), 'reset_password_action' ) ) {
				// Send password reset email
				if ( ! $email_sent_flag ) {
					$email_sent = Password_Reset_Email::send( $current_user );
					if ( $email_sent ) {
						// Set transient to mark the email as sent
						set_transient( $transient_key, true, 15 * MINUTE_IN_SECONDS );
					} else {
						$error = 'email_send_error';
					}
				}

				add_action( 'wp_enqueue_scripts', __CLASS__ . '::enqueue_resend_password_reset_scripts' );
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

		// TODO: Remove this once we decide which template approach is best - ensure the functionality is 1:1
		// include plugin_dir_path( __FILE__ ) . 'templates/password-detection-template.php';
		self::render_password_detection_template( $reset, $context, $error, Password_Reset_Email::mask_email_address( $current_user->user_email ) );
		exit;
	}

	/**
	 * Enqueue the resend password reset email scripts.
	 */
	public static function enqueue_resend_password_reset_scripts() {
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
	 */
	public static function enqueue_password_detection_styles() {
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
	public static function ajax_resend_password_reset_email() {
		// Verify the nonce for security
		check_ajax_referer( 'resend_password_reset_nonce', 'security' );

		// Check if the user is logged in
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( array( 'message' => 'User not authenticated' ) );
		}

		$current_user = wp_get_current_user();
		$email        = $current_user->user_email;

		// Resend the email
		$email_sent = Password_Reset_Email::send( $current_user, $email );
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
	public static function validate_password( $password ) {
		// TODO: Update to use custom password validation method(s) when available.
		return $password ? false : true;
	}

	/**
	 * Add the password detection usermeta.
	 *
	 * @param int    $user_id The user ID.
	 * @param string $setting The password detection setting.
	 */
	public static function add_password_detection_usermeta( $user_id, $setting ) {
		update_user_meta( $user_id, self::PASSWORD_DETECTION_USER_META_KEY, $setting );
	}

	/**
	 * Remove the password detection usermeta.
	 *
	 * @param int $user_id The user ID.
	 */
	public static function remove_password_detection_usermeta( $user_id ) {
		delete_user_meta( $user_id, self::PASSWORD_DETECTION_USER_META_KEY );
	}

	/**
	 * Get the password detection usermeta.
	 *
	 * @param int $user_id The user ID.
	 */
	public static function get_password_detection_usermeta( $user_id ) {
		return get_user_meta( $user_id, self::PASSWORD_DETECTION_USER_META_KEY, true );
	}

	/**
	 * Render template for password detection page.
	 *
	 * @param bool   $reset        Whether the user is resetting their password.
	 * @param string $context      The context for the password detection page.
	 * @param string $error        The error message to display.
	 * @param string $masked_email The masked email address.
	 */
	public static function render_password_detection_template( $reset, $context, $error, $masked_email ) {
		defined( 'ABSPATH' ) || exit;

		echo '<!DOCTYPE html>';
		echo '<html>';
		echo '<head>';
		echo '<meta charset="UTF-8">';
		echo '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
		echo '<title>' . esc_html( $reset ? 'Jetpack - Stay Secure' : 'Jetpack - Secure Your Account' ) . '</title>';
		wp_head();
		echo '</head>';
		echo '<body class="password-detection-wrapper">';
		echo '<div class="password-detection">';

		// Include Jetpack logo
		require plugin_dir_path( __FILE__ ) . '/assets/jetpack-logo.php';

		echo '<p class="password-detection-title">' . esc_html( $reset ? 'Take action to stay secure' : "Let's secure your account" ) . '</p>';

		if ( $reset ) {
			echo '<p>' . esc_html( $context ) . '</p>';
			if ( $error ) {
				if ( 'proceed_nonce_verification_error' === $error ) {
					echo '<p>We\'ve encountered an issue verifying your request to proceed without updating your password.</p>';
				} else {
					echo '<p>';
					echo 'reset_password_nonce_verification_error' === $error
						? "We've encountered an issue verifying your request to create a new password. "
						: '';
					echo 'While attempting to send a verification email to ' . esc_html( $masked_email ) . ', an error occurred.';
					echo '</p>';
				}
			} else {
				echo '<p>Don\'t worry - To keep your account safe, we\'ve sent a verification email to ' . esc_html( $masked_email ) . '. After that, we\'ll guide you through updating your password.</p>';
			}
			echo '<p>Please check your inbox and click the link to verify it\'s you. Alternatively, you can update your password from your <a href="/wp-admin/profile.php#password">account profile</a>.</p>';
			echo '<p>';
			echo '<span id="resend-password-reset-message">Didn\'t get the email? </span>';
			echo '<a href="#" id="resend-password-reset">Resend email</a>';
			echo '</p>';
		} else {
			echo '<p>' . esc_html( $context ) . '</p>';
			echo '<p>It is highly recommended that you update your password.</p>';
			echo '<div class="actions">';
			echo '<form method="post">';
			wp_nonce_field( 'reset_password_action', '_wpnonce_reset_password' );
			echo '<button class="action action-reset" type="submit" name="reset-password">Create a new password</button>';
			echo '</form>';
			echo '<form method="post">';
			wp_nonce_field( 'proceed_action', '_wpnonce_proceed' );
			echo '<button class="action action-proceed" type="submit" name="proceed">Proceed without updating</button>';
			echo '</form>';
			echo '</div>';
			echo '<p>Learn more about the <a href="#">risks of using weak passwords</a> and how to protect your account.</p>';
		}

		echo '</div>';
		wp_footer();
		echo '</body>';
		echo '</html>';
	}
}
