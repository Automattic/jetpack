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
		if ( ! is_user_logged_in() ) {
			wp_redirect( wp_login_url() );
			exit;
		}

		$current_user         = wp_get_current_user();
		$user_password_status = self::get_password_detection_usermeta( $current_user->ID );

		// Restrict direct access to users with unsafe passwords
		if ( ! $user_password_status || 'safe' === $user_password_status ) {
			wp_redirect( admin_url() );
			exit;
		}

		if ( isset( $_POST['reset'] ) ) {
			$email = $current_user->user_email;

			// Send reset email to the user - only initially and on resend, not refresh
			$email_sent = Password_Reset_Email::send( $current_user, $email );
			if ( ! $email_sent ) {
				// TODO: Handle email sending errors
			}

			$header_title = 'Secure Your Account';
			$page_title   = "Let's secure your account";
			$content      = '
			<p>Your current password was found in a public leak, which means your account might be at risk.</p>
			<p>Don\'t worry - To keep your account safe, we\'ve sent a verification email to a ' . Password_Reset_Email::mask_email_address( $email ) . '. After that, we\'ll guide you through updating your password.</p>
			<p>Please check your inbox and click the link to verify it\'s you. Didn\'t get the email? <a href="#">Resend email</a></p>';

		} elseif ( isset( $_POST['proceed'] ) ) {
			wp_redirect( admin_url() );
			exit;
		} else {
			$header_title = 'Stay Secure';
			$page_title   = 'Take action to stay secure';
			$content      = '
			<p>Your current password was found in a public leak, which means your account might be at risk.</p>
			<p>It is highly recommended that you update your password.</p>
			<div class="actions">
				<form method="post">
					<button class="action action-reset" type="submit" name="reset">Create a new password</button>
				</form>
				<form method="post">
					<button class="action action-proceed" type="submit" name="proceed">Procceed without updating</button>
				</form>
			</div>
			<p>Learn more about the <a href="#">risks of using weak passwords</a> and how to protect your account.</p>';
		}

		include plugin_dir_path( __FILE__ ) . 'templates/password-detection-template.php';
		exit;
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
	 * @param int $user_id The user ID.
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
	 */
	public static function get_password_detection_usermeta( $user_id ) {
		return get_user_meta( $user_id, self::PASSWORD_DETECTION_USER_META_KEY, true );
	}
}
