<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * A collection of helper functions used in the SSO module.
 *
 * @deprecated 13.5 Use Automattic\Jetpack\Connection\Manager\SSO instead.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\SSO\Helpers;
use Automattic\Jetpack\Connection\Utils;

if ( ! class_exists( 'Jetpack_SSO_Helpers' ) ) :

	/**
	 * A collection of helper functions used in the SSO module.
	 *
	 * @deprecated 13.5
	 *
	 * @since 4.1.0
	 */
	class Jetpack_SSO_Helpers {
		/**
		 * Determine if the login form should be hidden or not
		 *
		 * @deprecated 13.5
		 *
		 * @return bool
		 **/
		public static function should_hide_login_form() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::should_hide_login_form' );

			return Helpers::should_hide_login_form();
		}

		/**
		 * Returns a boolean value for whether logging in by matching the WordPress.com user email to a
		 * Jetpack site user's email is allowed.
		 *
		 * @deprecated 13.5
		 *
		 * @return bool
		 */
		public static function match_by_email() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::match_by_email' );

			return Helpers::match_by_email();
		}

		/**
		 * Returns a boolean for whether users are allowed to register on the Jetpack site with SSO,
		 * even though the site disallows normal registrations.
		 *
		 * @deprecated 13.5
		 *
		 * @param object|null $user_data WordPress.com user information.
		 * @return bool
		 */
		public static function new_user_override( $user_data = null ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::new_user_override' );

			return Helpers::new_user_override( $user_data );
		}

		/**
		 * Returns a boolean value for whether two-step authentication is required for SSO.
		 *
		 * @since 4.1.0
		 *
		 * @deprecated 13.5
		 *
		 * @return bool
		 */
		public static function is_two_step_required() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::is_two_step_required' );

			return Helpers::is_two_step_required();
		}

		/**
		 * Returns a boolean for whether a user that is attempting to log in will be automatically
		 * redirected to WordPress.com to begin the SSO flow.
		 *
		 * @deprecated 13.5
		 *
		 * @return bool
		 */
		public static function bypass_login_forward_wpcom() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::bypass_login_forward_wpcom' );

			return Helpers::bypass_login_forward_wpcom();
		}

		/**
		 * Returns a boolean for whether the SSO login form should be displayed as the default
		 * when both the default and SSO login form allowed.
		 *
		 * @since 4.1.0
		 *
		 * @deprecated 13.5
		 *
		 * @return bool
		 */
		public static function show_sso_login() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::show_sso_login' );

			return Helpers::show_sso_login();
		}

		/**
		 * Returns a boolean for whether the two step required checkbox, displayed on the Jetpack admin page, should be disabled.
		 *
		 * @since 4.1.0
		 *
		 * @deprecated 13.5
		 *
		 * @return bool
		 */
		public static function is_require_two_step_checkbox_disabled() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::is_require_two_step_checkbox_disabled' );

			return Helpers::is_require_two_step_checkbox_disabled();
		}

		/**
		 * Returns a boolean for whether the match by email checkbox, displayed on the Jetpack admin page, should be disabled.
		 *
		 * @since 4.1.0
		 *
		 * @deprecated 13.5
		 *
		 * @return bool
		 */
		public static function is_match_by_email_checkbox_disabled() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::is_match_by_email_checkbox_disabled' );

			return Helpers::is_match_by_email_checkbox_disabled();
		}

		/**
		 * Returns an array of hosts that SSO will redirect to.
		 *
		 * Instead of accessing JETPACK__API_BASE within the method directly, we set it as the
		 * default for $api_base due to restrictions with testing constants in our tests.
		 *
		 * @since 4.3.0
		 * @since 4.6.0 Added public-api.wordpress.com as an allowed redirect
		 *
		 * @deprecated 13.5
		 *
		 * @param array  $hosts Allowed redirect hosts.
		 * @param string $api_base Base API URL.
		 *
		 * @return array
		 */
		public static function allowed_redirect_hosts( $hosts, $api_base = JETPACK__API_BASE ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::allowed_redirect_hosts' );

			return Helpers::allowed_redirect_hosts( $hosts, $api_base );
		}

		/**
		 * Generate a new user from a SSO attempt.
		 *
		 * @deprecated 13.5
		 *
		 * @param object $user_data WordPress.com user information.
		 */
		public static function generate_user( $user_data ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Utils::generate_user' );

			return Utils::generate_user( $user_data );
		}

		/**
		 * Determines how long the auth cookie is valid for when a user logs in with SSO.
		 *
		 * @deprecated 13.5
		 *
		 * @return int result of the jetpack_sso_auth_cookie_expiration filter.
		 */
		public static function extend_auth_cookie_expiration_for_sso() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::extend_auth_cookie_expiration_for_sso' );

			return Helpers::extend_auth_cookie_expiration_for_sso();
		}

		/**
		 * Determines if the SSO form should be displayed for the current action.
		 *
		 * @since 4.6.0
		 *
		 * @deprecated 13.5
		 *
		 * @param string $action SSO action being performed.
		 *
		 * @return bool  Is SSO allowed for the current action?
		 */
		public static function display_sso_form_for_action( $action ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::display_sso_form_for_action' );

			return Helpers::display_sso_form_for_action( $action );
		}

		/**
		 * This method returns an environment array that is meant to simulate `$_REQUEST` when the initial
		 * JSON API auth request was made.
		 *
		 * @since 4.6.0
		 *
		 * @deprecated 13.5
		 *
		 * @return array|bool
		 */
		public static function get_json_api_auth_environment() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::get_json_api_auth_environment' );

			return Helpers::get_json_api_auth_environment();
		}

		/**
		 * Check if the site has a custom login page URL, and return it.
		 * If default login page URL is used (`wp-login.php`), `null` will be returned.
		 *
		 * @deprecated 13.5
		 *
		 * @return string|null
		 */
		public static function get_custom_login_url() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::get_custom_login_url' );

			return Helpers::get_custom_login_url();
		}

		/**
		 * Clear the cookies that store the profile information for the last
		 * WPCOM user to connect.
		 *
		 * @deprecated 13.5
		 */
		public static function clear_wpcom_profile_cookies() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::clear_wpcom_profile_cookies' );

			return Helpers::clear_wpcom_profile_cookies();
		}

		/**
		 * Remove an SSO connection for a user.
		 *
		 * @deprecated 13.5
		 *
		 * @param int $user_id The local user id.
		 */
		public static function delete_connection_for_user( $user_id ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\Helpers::delete_connection_for_user' );

			return Helpers::delete_connection_for_user( $user_id );
		}

		/**
		 * Check if a local user is already connected to WordPress.com.
		 *
		 * @since 13.3
		 *
		 * @deprecated 13.5
		 *
		 * @param int $user_id Local User information.
		 */
		public static function is_user_connected( $user_id = 0 ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager->is_user_connected' );

			return ( new Manager() )->is_user_connected( $user_id );
		}
	}

endif;
