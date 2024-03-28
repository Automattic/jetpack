<?php
/**
 * Force Jetpack 2FA Functionality
 *
 * Ported from original repo at https://github.com/automattic/jetpack-force-2fa
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\SSO;

use Automattic\Jetpack\Connection\SSO;
use Automattic\Jetpack\Modules;
use WP_Error;

/**
 * Force users to use two factor authentication.
 */
class Force_2FA {
	/**
	 * The role to force 2FA for.
	 *
	 * Defaults to manage_options via the plugins_loaded function.
	 * Can be modified with the jetpack_force_2fa_cap filter.
	 *
	 * @var string
	 */
	private $role;

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'after_setup_theme', array( $this, 'plugins_loaded' ) );
	}

	/**
	 * Load the plugin via the plugins_loaded hook.
	 */
	public function plugins_loaded() {
		/**
		 * Filter the role to force 2FA for.
		 * Defaults to manage_options.
		 *
		 * @param string $role The role to force 2FA for.
		 * @return string
		 * @since jetpack-12.7
		 * @module SSO
		 */
		$this->role = apply_filters( 'jetpack_force_2fa_cap', 'manage_options' );

		// Bail if Jetpack SSO is not active
		if (
			! class_exists( 'Jetpack' )
			|| ! ( new Modules() )->is_active( 'sso' )
		) {
			add_action( 'admin_notices', array( $this, 'admin_notice' ) );
			return;
		}

		$this->force_2fa();
	}

	/**
	 * Display an admin notice if Jetpack SSO is not active.
	 */
	public function admin_notice() {
		/**
		 * Filter if an admin notice is deplayed when Force 2FA is required, but SSO is not enabled.
		 * Defaults to true.
		 *
		 * @param bool $display_notice Whether to display the notice.
		 * @return bool
		 * @since jetpack-12.7
		 * @module SSO
		 */
		if ( apply_filters( 'jetpack_force_2fa_dependency_notice', true ) && current_user_can( $this->role ) ) {
			printf( '<div class="%1$s"><p>%2$s</p></div>', 'notice notice-warning', 'Jetpack Force 2FA requires Jetpack and the Jetpack SSO module.' );
		}
	}

	/**
	 * Force 2FA when using Jetpack SSO and force Jetpack SSO.
	 *
	 * @return void
	 */
	private function force_2fa() {
		// Allows WP.com login to a local account if it matches the local account.
		add_filter( 'jetpack_sso_match_by_email', '__return_true', 9999 );

		// multisite
		if ( is_multisite() ) {

			// Hide the login form
			add_filter( 'jetpack_remove_login_form', '__return_true', 9999 );
			add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true', 9999 );
			add_filter( 'jetpack_sso_display_disclaimer', '__return_false', 9999 );

			add_filter(
				'wp_authenticate_user',
				function () {
					return new WP_Error( 'wpcom-required', $this->get_login_error_message() ); },
				9999
			);

			add_filter( 'jetpack_sso_require_two_step', '__return_true' );

			add_filter( 'allow_password_reset', '__return_false' );
		} else {
			// Not multisite.

			// Completely disable the standard login form for admins.
			add_filter(
				'wp_authenticate_user',
				function ( $user ) {
					if ( is_wp_error( $user ) ) {
						return $user;
					}
					if ( $user->has_cap( $this->role ) ) {
						return new WP_Error( 'wpcom-required', $this->get_login_error_message(), $user->user_login );
					}
					return $user;
				},
				9999
			);

			add_filter(
				'allow_password_reset',
				function ( $allow, $user_id ) {
					if ( user_can( $user_id, $this->role ) ) {
						return false;
					}
					return $allow; },
				9999,
				2
			);

			add_action( 'jetpack_sso_pre_handle_login', array( $this, 'jetpack_set_two_step' ) );
		}
	}

	/**
	 * Specifically set the two step filter for Jetpack SSO.
	 *
	 * @param Object $user_data The user data from WordPress.com.
	 *
	 * @return void
	 */
	public function jetpack_set_two_step( $user_data ) {
		$user = SSO::get_user_by_wpcom_id( $user_data->ID );

		// Borrowed from Jetpack. Ignores the match_by_email setting.
		if ( empty( $user ) ) {
			$user = get_user_by( 'email', $user_data->email );
		}

		if ( $user && $user->has_cap( $this->role ) ) {
			add_filter( 'jetpack_sso_require_two_step', '__return_true' );
		}
	}

	/**
	 * Get the login error message.
	 *
	 * @return string
	 */
	private function get_login_error_message() {
		/**
		 * Filter the login error message.
		 * Defaults to a message that explains the user must use a WordPress.com account with 2FA enabled.
		 *
		 * @param string $message The login error message.
		 * @return string
		 * @since jetpack-12.7
		 * @module SSO
		 */
		return apply_filters(
			'jetpack_force_2fa_login_error_message',
			sprintf( 'For added security, please log in using your WordPress.com account.<br /><br />Note: Your account must have <a href="%1$s" target="_blank">Two Step Authentication</a> enabled, which can be configured from <a href="%2$s" target="_blank">Security Settings</a>.', 'https://support.wordpress.com/security/two-step-authentication/', 'https://wordpress.com/me/security/two-step' )
		);
	}
}
