<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * A collection of helper functions used in the SSO module.
 *
 * @deprecated 13.5 Use Automattic\Jetpack\Connection\Manager\SSO instead.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\SSO\Notices;

if ( ! class_exists( 'Jetpack_SSO_Notices' ) ) :

	/**
	 * A collection of helper functions used in the SSO module.
	 *
	 * @deprecated 13.5
	 *
	 * @since 4.4.0
	 */
	class Jetpack_SSO_Notices {
		/**
		 * Error message displayed on the login form when two step is required and
		 * the user's account on WordPress.com does not have two step enabled.
		 *
		 * @since 2.7
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error message.
		 * @return string
		 **/
		public static function error_msg_enable_two_step( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::error_msg_enable_two_step' );

			return Notices::error_msg_enable_two_step( $message );
		}

		/**
		 * Error message displayed when the user tries to SSO, but match by email
		 * is off and they already have an account with their email address on
		 * this site.
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error message.
		 * @return string
		 */
		public static function error_msg_email_already_exists( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::error_msg_email_already_exists' );

			return Notices::error_msg_email_already_exists( $message );
		}

		/**
		 * Error message that is displayed when the current site is in an identity crisis and SSO can not be used.
		 *
		 * @since 4.3.2
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error Message.
		 *
		 * @return string
		 */
		public static function error_msg_identity_crisis( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::error_msg_identity_crisis' );

			return Notices::error_msg_identity_crisis( $message );
		}

		/**
		 * Error message that is displayed when we are not able to verify the SSO nonce due to an XML error or
		 * failed validation. In either case, we prompt the user to try again or log in with username and password.
		 *
		 * @since 4.3.2
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error message.
		 *
		 * @return string
		 */
		public static function error_invalid_response_data( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::error_invalid_response_data' );

			return Notices::error_invalid_response_data( $message );
		}

		/**
		 * Error message that is displayed when we were not able to automatically create an account for a user
		 * after a user has logged in via SSO. By default, this message is triggered after trying to create an account 5 times.
		 *
		 * @since 4.3.2
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error message.
		 *
		 * @return string
		 */
		public static function error_unable_to_create_user( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::error_unable_to_create_user' );

			return Notices::error_unable_to_create_user( $message );
		}

		/**
		 * When the default login form is hidden, this method is called on the 'authenticate' filter with a priority of 30.
		 * This method disables the ability to submit the default login form.
		 *
		 * @deprecated 13.5
		 *
		 * @param WP_User|WP_Error $user Either the user attempting to login or an existing authentication failure.
		 *
		 * @return WP_Error
		 */
		public static function disable_default_login_form( $user ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::disable_default_login_form' );

			return Notices::disable_default_login_form( $user );
		}

		/**
		 * Message displayed when the site admin has disabled the default WordPress
		 * login form in Settings > General > Secure Sign On
		 *
		 * @since 2.7
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error message.
		 *
		 * @return string
		 **/
		public static function msg_login_by_jetpack( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::msg_login_by_jetpack' );

			return Notices::msg_login_by_jetpack( $message );
		}

		/**
		 * Get the message for SSO required.
		 *
		 * @deprecated 13.5
		 *
		 * @return string
		 */
		public static function get_sso_required_message() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::get_sso_required_message' );

			return Notices::get_sso_required_message();
		}

		/**
		 * Message displayed when the user can not be found after approving the SSO process on WordPress.com
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error message.
		 *
		 * @return string
		 */
		public static function cant_find_user( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::cant_find_user' );

			return Notices::cant_find_user( $message );
		}

		/**
		 * Error message that is displayed when the current site is in an identity crisis and SSO can not be used.
		 *
		 * @since 4.4.0
		 *
		 * @deprecated 13.5
		 *
		 * @param string $message Error message.
		 *
		 * @return string
		 */
		public static function sso_not_allowed_in_staging( $message ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Notices::sso_not_allowed_in_staging' );
			// @phan-suppress-next-line PhanDeprecatedFunction
			return Notices::sso_not_allowed_in_staging( $message );
		}
	}

endif;
