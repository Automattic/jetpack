<?php
/**
 * Class used to define Account Protection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Modules;

/**
 * Class Account_Protection
 */
class Account_Protection {

	const PACKAGE_VERSION = '1.0.0-alpha';

	/**
	 * Initializes the configurations needed for the account protection module.
	 */
	public static function init() {
		// Account protection activation/deactivation hooks
		add_action( 'jetpack_activate_module_account-protection', __CLASS__ . '::on_account_protection_activation' );
		add_action( 'jetpack_deactivate_module_account-protection', __CLASS__ . '::on_account_protection_deactivation' );

		if ( self::is_enabled() ) {
			// Validate password after successful login
			add_action( 'wp_authenticate_user', __CLASS__ . '::login_form_password_detection', 10, 2 );

			// Add password detection flow for users with unsafe passwords
			add_action(
				'login_form_password-detection',
				__CLASS__ . '::render_password_detection_page',
				10,
				2
			);

			// Ensure jetpack_account_protection_password_status usermeta is removed on password change
			add_action(
				'after_password_reset',
				function ( $user, $new_pass ) {
					delete_user_meta( $user->ID, 'jetpack_account_protection_password_status' );
				},
				10,
				2
			);

			// Ensure jetpack_account_protection_password_status usermeta is removed when user updates password via profile updates
			add_action(
				'profile_update',
				function ( $user_id, $old_user_data ) {
					// Profile updates should include validation, but we should reset user meta to be safe
					if ( isset( $_POST['pass1'] ) && ! empty( $_POST['pass1'] ) ) {
						// TODO: Only if the password is actually updated
						self::remove_password_detection_usermeta( $user_id );
					}
				},
				10,
				2
			);
		}
	}

	/**
	 * Activate the account protection on module activation.
	 */
	public static function on_account_protection_activation() {
	}

	/**
	 * Deactivate the account protection on module deactivation.
	 */
	public static function on_account_protection_deactivation() {
		// Remove user meta on deactivation
		$users = get_users();
		foreach ( $users as $user ) {
			self::remove_password_detection_usermeta( $user->ID );
			// TODO: Remove usermeta on plugin deactivation as well
		}
	}

	/**
	 * Determines if the account protection module is enabled on the site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return ( new Modules() )->is_active( 'account-protection' );
	}

	/**
	 * Enables the account protection module.
	 *
	 * @return bool
	 */
	public static function enable() {
		// Return true if already enabled.
		if ( self::is_enabled() ) {
			return true;
		}
		return ( new Modules() )->activate( 'account-protection', false, false );
	}

	/**
	 * Disables the account protection module.
	 *
	 * @return bool
	 */
	public static function disable() {
		// Return true if already disabled.
		if ( ! self::is_enabled() ) {
			return true;
		}
		return ( new Modules() )->deactivate( 'account-protection' );
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
			update_user_meta( $user->ID, 'jetpack_account_protection_password_status', 'unsafe' );

			// Redirect to the password detection page
			add_filter( 'login_redirect', __CLASS__ . '::password_detection_redirect', 10, 3 );
		} else {
			update_user_meta( $user->ID, 'jetpack_account_protection_password_status', 'safe' );
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
		$user_password_status = get_user_meta( $current_user->ID, 'jetpack_account_protection_password_status', true );

		// Restrict direct access to users with unsafe passwords
		if ( ! $user_password_status || 'safe' === $user_password_status ) {
			wp_redirect( admin_url() );
			exit;
		}

		if ( isset( $_POST['reset'] ) ) {
			$email = $current_user->user_email;

			// Send reset email to the user - only initially and on resend, not refresh
			$email_sent = self::send_password_reset_email( $current_user, $email );
			if ( ! $email_sent ) {
				// TODO: Handle email sending errors
			}

			$header_title = 'Secure Your Account';
			$page_title   = "Let's secure your account";
			$content      = '
			<p>Your current password was found in a public leak, which means your account might be at risk.</p>
			<p>Don\'t worry - To keep your account safe, we\'ve sent a verification email to a ' . self::mask_email_address( $email ) . '. After that, we\'ll guide you through updating your password.</p>
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
		// TODO: Update to use custom password validation method when available.
		return $password ? false : true;
	}

	/**
	 * Redirect to the password detection page.
	 *
	 * @return string The URL to redirect to.
	 */
	public static function password_detection_redirect() {
		return home_url( '/wp-login.php?action=password-detection' );
	}

	/**
	 * Mask an email address like d*****@g*****.com.
	 *
	 * @param string $email The email address to mask.
	 * @return string The masked email address.
	 */
	public static function mask_email_address( $email ) {
		$parts  = explode( '@', $email );
		$name   = $parts[0];
		$domain = $parts[1];

		// Mask the name part (first letter + asterisks)
		$masked_name = substr( $name, 0, 1 ) . str_repeat( '*', strlen( $name ) - 1 );

		// Mask the domain part (first letter + asterisks + domain extension)
		$domain_parts  = explode( '.', $domain );
		$masked_domain = substr( $domain_parts[0], 0, 1 ) . str_repeat( '*', strlen( $domain_parts[0] ) - 1 ) . '.' . $domain_parts[1];

		return $masked_name . '@' . $masked_domain;
	}

	/**
	 * Send password reset email.
	 *
	 * @param WP_User $user The user object.
	 * @param string  $email The user email.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	public static function send_password_reset_email( $user, $email ) {
		$site_url    = home_url();
		$parsed_url  = parse_url( $site_url );
		$domain_name = $parsed_url['host'];
		$username    = $user->user_login;

		$key                 = get_password_reset_key( $user );
		$locale              = get_user_locale( $user );
		$password_reset_link = network_site_url( 'wp-login.php?login=' . rawurlencode( $username ) . "&key=$key&action=rp", 'login' ) . '&wp_lang=' . $locale;

		// TODO: Update to use custom email method when available, passing $domain_name, $email, $username, and $password_reset_link
		return true;
	}

	/**
	 * Remove the password detection usermeta.
	 *
	 * @param int $user_id The user ID.
	 */
	public static function remove_password_detection_usermeta( $user_id ) {
		delete_user_meta( $user_id, 'jetpack_account_protection_password_status' );
	}

	// TODO: Move password detection methods to a dedicated class
	// TODO: Add killswitch define and is support env checks here
}
