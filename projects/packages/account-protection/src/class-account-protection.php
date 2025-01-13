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
			// Validate password post successful login
			add_action( 'wp_authenticate_user', __CLASS__ . '::custom_post_login_password_check', 10, 2 );

			// Add custom validation flow for users with unsafe passwords
			add_action(
				'login_form_password-detection',
				function () {
					// Restrict access for logged-out users
					if ( ! is_user_logged_in() ) {
						wp_redirect( wp_login_url() );
						exit;
					}

					$current_user = wp_get_current_user();
					// TODO: Are we confident we always have a user here? How to handle it otherwise...
					$password_status = get_user_meta( $current_user->ID, 'jetpack_account_protection_password_status', true );

					// Restrict access for logged in users with secure or unevaluated passwords to the admin
					if ( ! $password_status || 'safe' === $password_status ) {
						wp_redirect( admin_url() );
						exit;
					}

					if ( isset( $_POST['reset'] ) ) {
						$site_url     = home_url();
						$parsed_url   = parse_url( $site_url );
						$domain_name  = $parsed_url['host'];
						$username     = $current_user->user_login;
						$email        = $current_user->user_email;
						$masked_email = self::mask_email_address( $email );

						$key                 = get_password_reset_key( $current_user );
						$locale              = get_user_locale( $current_user );
						$password_reset_link = network_site_url( 'wp-login.php?login=' . rawurlencode( $current_user->user_login ) . "&key=$key&action=rp", 'login' ) . '&wp_lang=' . $locale;

						// Send reset email to user - only initially and on resend, not refresh
						self::send_custom_reset_email( $domain_name, $username, $email, $password_reset_link );

						$header_title = 'Secure Your Account';
						$page_title   = "Let's secure your account";
						$content      = '
						<p>Your current password was found in a public leak, which means your account might be at risk.</p>
						<p>Don\'t worry - To keep your account safe, we\'ve sent a verification email to a ' . $masked_email . '. After that, we\'ll guide you through updating your password.</p>
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

					// Include the template
					include plugin_dir_path( __FILE__ ) . 'templates/password-detection-template.php';
					exit;
				}
			);

			// Ensure jetpack_account_protection_password_status user meta is removed on password change
			// TODO: Is there potentially another hook for storing old password after reset?
			// Or we can store old passwords by hash and use wp_check_password to validate
			add_action(
				'after_password_reset',
				function ( $user, $new_pass ) {
					delete_user_meta( $user->ID, 'jetpack_account_protection_password_status' );

					// Add old password hash to user meta
					// $password_hash_history = get_user_meta( $user->ID, 'jetpack_account_protection_password_hash_history', true ) ?: [];
					// $password_hash_history[] = $user->user_pass;
					// update_user_meta( $user->ID, 'jetpack_account_protection_password_hash_history', $password_hash_history );
				},
				10,
				2
			);

			// Ensure jetpack_account_protection_password_status user meta is removed when user updates password via profile updates
			add_action(
				'profile_update',
				function ( $user_id, $old_user_data ) {
					// Profile updates should include validation, but we should reset user meta to be safe
					if ( isset( $_POST['pass1'] ) && ! empty( $_POST['pass1'] ) ) {
						// TODO: Only if the password is actually updated
						delete_user_meta( $user_id, 'jetpack_account_protection_password_status' );

						// // Add old password hash to user meta
						// $password_hash_history = get_user_meta( $user_id, 'jetpack_account_protection_password_hash_history', true ) ?: [];
						// // Add the current password hash to the array
						// $password_hash_history[] = $old_user_data->user_pass;
						// update_user_meta( $user_id, 'jetpack_account_protection_password_hash_history', $password_hash_history );
					}
				},
				10,
				2
			);

			// TODO: Action/cron for clearing out old password hashes?

		}
	}

	/**
	 * Custom login validation.
	 */
	public static function custom_post_login_password_check( $user, $password ) {
		if ( ! self::custom_password_check( $password ) ) {
			error_log( 'Password check failed' );
			// TODO: Are there any potential issues with using this, eg if somehow the pass is updated before this is corrected?
			update_user_meta( $user->ID, 'jetpack_account_protection_password_status', 'unsafe' );

			// Log the user in but customize the redirect
			add_filter( 'login_redirect', __CLASS__ . '::custom_login_redirect', 10, 3 );
		} else {
			update_user_meta( $user->ID, 'user', 'safe' );
		}

		return $user;
	}

	/**
	 * Custom post login password check.
	 */
	public static function custom_password_check( $password ) {
		// TESTING BGN
		// TODO: This belongs in the set/update validation
		// current test wont work here because we wouldn't reach this part because core validation would error out the login process...
		// This would work somewhere...
		// error_log( var_export( wp_check_password( 'wordpress', $old_hash ), true ) );

		// $user = wp_get_current_user();
		// $user_id = $user->ID;

		// // Retrieve old hashes
		// $old_hashes = get_user_meta( $user_id, 'old_password_hashes', true ) ?: [];

		// // Check against each old hash
		// foreach ( $old_hashes as $old_hash ) {
		// if ( wp_check_password( $password, $old_hash ) ) {
		// error_log( var_export( 'Password found in old hashes ' . $password, true ) );
		// }
		// }
		// Once we have the reset_link we can test this...
		// TESTING STOP

		// TODO: The validation here is less extension then when setting a password, for example, no need to include a historic check
		return $password ? false : true;
	}

	public static function custom_login_redirect() {
		return home_url( '/wp-login.php?action=password-detection' );
	}

	public static function send_custom_reset_email( $domain_name, $username, $email, $password_reset_link ) {
		error_log( 'Site: ' . $domain_name );
		error_log( 'Username: ' . $username );
		error_log( 'Sending custom reset email to ' . $email );
		error_log( 'Password reset link: ' . $password_reset_link );
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
			delete_user_meta( $user->ID, 'jetpack_account_protection_password_status' );
			// TODO: Do we want to clear password hash history only on deactivation?
			// TODO: Ensure this happens on plugin deactivation as well?
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
}
