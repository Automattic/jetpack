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

	const PACKAGE_VERSION                = '1.0.0-alpha';
	const ACCOUNT_PROTECTION_MODULE_NAME = 'account-protection';
	const STRICT_MODE_OPTION_NAME        = 'jetpack_account_protection_strict_mode';

	/**
	 * Initializes the configurations needed for the account protection module.
	 */
	public function init() {
		// Account protection activation/deactivation hooks
		add_action( 'jetpack_activate_module_account-protection', array( $this, 'on_account_protection_activation' ) );
		add_action( 'jetpack_deactivate_module_account-protection', array( $this, 'on_account_protection_deactivation' ) );

		// Do not run in unsupported environments
		add_action( 'jetpack_get_available_modules', array( $this, 'remove_module_on_unsupported_environments' ) );
		add_action( 'jetpack_get_available_standalone_modules', array( $this, 'remove_standalone_module_on_unsupported_environments' ) );

		// Register REST routes
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );

		if ( $this->is_enabled() ) {
			// Validate password after successful login
			add_action( 'wp_authenticate_user', array( new Password_Detection(), 'login_form_password_detection' ), 10, 2 );

			// Add password detection flow for users with unsafe passwords
			add_action(
				'login_form_password-detection',
				array( new Password_Detection(), 'render_password_detection_page' ),
				10,
				2
			);

			// Register AJAX resend password reset email action
			add_action( 'wp_ajax_resend_password_reset', array( new Password_Detection(), 'ajax_resend_password_reset_email' ) );

			// Remove password detection usermeta on password reset
			add_action(
				'after_password_reset',
				function ( $user ) {
					( new Password_Detection() )->remove_password_detection_usermeta( $user->ID );
				},
				10,
				2
			);

			// Remove password detection usermeta on profile password update
			add_action(
				'profile_update',
				function ( $user_id ) {
					if (
						! empty( $_POST['_wpnonce'] ) &&
						wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'update-user_' . $user_id )
					) {
							// Profile updates should include validation, but we should reset user meta to be safe
						if ( isset( $_POST['pass1'] ) && ! empty( $_POST['pass1'] ) ) {
							( new Password_Detection() )->remove_password_detection_usermeta( $user_id );
						}
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
	public function on_account_protection_activation() {
	}

	/**
	 * Deactivate the account protection on module deactivation.
	 */
	public function on_account_protection_deactivation() {
		// Remove user meta on deactivation
		$users = get_users();
		foreach ( $users as $user ) {
			( new Password_Detection() )->remove_password_detection_usermeta( $user->ID );
			// TODO: Remove usermeta on plugin deactivation
		}
	}

	/**
	 * Determines if the account protection module is enabled on the site.
	 *
	 * @return bool
	 */
	public function is_enabled() {
		return ( new Modules() )->is_active( 'account-protection' );
	}

	/**
	 * Enables the account protection module.
	 *
	 * @return bool
	 */
	public function enable() {
		// Return true if already enabled.
		if ( $this->is_enabled() ) {
			return true;
		}
		return ( new Modules() )->activate( 'account-protection', false, false );
	}

	/**
	 * Disables the account protection module.
	 *
	 * @return bool
	 */
	public function disable() {
		// Return true if already disabled.
		if ( ! $this->is_enabled() ) {
			return true;
		}
		return ( new Modules() )->deactivate( 'account-protection' );
	}

	/**
	 * Determines if Account Protection is supported in the current environment.
	 *
	 * @return bool
	 */
	public function is_supported_environment() {
		// Do not run when killswitch is enabled
		if ( defined( 'DISABLE_JETPACK_ACCOUNT_PROTECTION' ) && DISABLE_JETPACK_ACCOUNT_PROTECTION ) {
			return false;
		}

		return true;
	}

	/**
	 * Disables the Account Protection module when on an unsupported platform in Jetpack.
	 *
	 * @param array $modules Filterable value for `jetpack_get_available_modules`.
	 *
	 * @return array Array of module slugs.
	 */
	public function remove_module_on_unsupported_environments( $modules ) {
		if ( ! $this->is_supported_environment() ) {
			// Account protection should never be available on unsupported platforms.
			unset( $modules['account-protection'] );
		}

		return $modules;
	}

	/**
	 * Disables the Account Protection module when on an unsupported platform in a standalone plugin.
	 *
	 * @param array $modules Filterable value for `jetpack_get_available_standalone_modules`.
	 *
	 * @return array Array of module slugs.
	 */
	public function remove_standalone_module_on_unsupported_environments( $modules ) {
		if ( ! $this->is_supported_environment() ) {
			// Account Protection should never be available on unsupported platforms.
			$modules = array_filter(
				$modules,
				function ( $module ) {
					return $module !== 'account-protection';
				}
			);

		}

		return $modules;
	}

	/**
	 * Get the account protection settings.
	 *
	 * @return array
	 */
	public function get_settings() {
		$settings = array(
			self::STRICT_MODE_OPTION_NAME => get_option( self::STRICT_MODE_OPTION_NAME, false ),
		);

		return $settings;
	}
}
