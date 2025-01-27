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
	const PACKAGE_VERSION                = '0.1.0-alpha';
	const ACCOUNT_PROTECTION_MODULE_NAME = 'account-protection';

	/**
	 * Modules instance.
	 *
	 * @var Modules
	 */
	private $modules;

	/**
	 * Password detection instance.
	 *
	 * @var Password_Detection
	 */
	private $password_detection;

	/**
	 * Account_Protection constructor.
	 *
	 * @param ?Modules            $modules            Modules instance.
	 * @param ?Password_Detection $password_detection Password detection instance.
	 */
	public function __construct( ?Modules $modules = null, ?Password_Detection $password_detection = null ) {
		$this->modules            = $modules ?? new Modules();
		$this->password_detection = $password_detection ?? new Password_Detection();
	}

	/**
	 * Initializes the configurations needed for the account protection module.
	 */
	public function init(): void {
		$this->register_hooks();

		if ( $this->is_enabled() ) {
			$this->register_runtime_hooks();
		}
	}

	/**
	 * Register hooks for module activation and environment validation.
	 */
	private function register_hooks(): void {
		// Account protection activation/deactivation hooks
		add_action( 'jetpack_activate_module_' . self::ACCOUNT_PROTECTION_MODULE_NAME, array( $this, 'on_account_protection_activation' ) );
		add_action( 'jetpack_deactivate_module_' . self::ACCOUNT_PROTECTION_MODULE_NAME, array( $this, 'on_account_protection_deactivation' ) );

		// Do not run in unsupported environments
		add_action( 'jetpack_get_available_modules', array( $this, 'remove_module_on_unsupported_environments' ) );
		add_action( 'jetpack_get_available_standalone_modules', array( $this, 'remove_standalone_module_on_unsupported_environments' ) );
	}

	/**
	 * Register hooks for runtime operations.
	 */
	private function register_runtime_hooks(): void {
		// Validate password after successful login
		add_action( 'wp_authenticate_user', array( $this->password_detection, 'login_form_password_detection' ), 10, 2 );

		// Add password detection flow
		add_action( 'login_form_password-detection', array( $this->password_detection, 'render_page' ), 10, 2 );

		// Remove password detection usermeta after password reset and on profile password update
		add_action( 'after_password_reset', array( $this->password_detection, 'delete_usermeta_after_password_reset' ), 10, 2 );
		add_action( 'profile_update', array( $this->password_detection, 'delete_usermeta_on_profile_update' ), 10, 2 );

		// Register AJAX resend two factor auth email action
		add_action( 'wp_ajax_resend_two_factor_auth', array( $this->password_detection, 'ajax_resend_two_factor_auth_email' ) );
	}

	/**
	 * Activate the account protection on module activation.
	 */
	public function on_account_protection_activation(): void {
		// Activation logic can be added here
	}

	/**
	 * Deactivate the account protection on module deactivation.
	 */
	public function on_account_protection_deactivation(): void {
		// Remove password detection user meta on deactivation
		// TODO: Run on Jetpack and Protect deactivation
		$this->password_detection->delete_all_usermeta();
	}

	/**
	 * Determines if the account protection module is enabled on the site.
	 *
	 * @return bool
	 */
	public function is_enabled() {
		return $this->modules->is_active( self::ACCOUNT_PROTECTION_MODULE_NAME );
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
		return $this->modules->activate( self::ACCOUNT_PROTECTION_MODULE_NAME, false, false );
	}

	/**
	 * Disables the account protection module.
	 *
	 * @return bool
	 */
	public function disable(): bool {
		// Return true if already disabled.
		if ( ! $this->is_enabled() ) {
			return true;
		}
		return $this->modules->deactivate( self::ACCOUNT_PROTECTION_MODULE_NAME );
	}

	/**
	 * Determines if Account Protection is supported in the current environment.
	 *
	 * @return bool
	 */
	public function is_supported_environment(): bool {
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
	public function remove_module_on_unsupported_environments( array $modules ): array {
		if ( ! $this->is_supported_environment() ) {
			// Account protection should never be available on unsupported platforms.
			unset( $modules[ self::ACCOUNT_PROTECTION_MODULE_NAME ] );
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
	public function remove_standalone_module_on_unsupported_environments( array $modules ): array {
		if ( ! $this->is_supported_environment() ) {
			// Account Protection should never be available on unsupported platforms.
			$modules = array_filter(
				$modules,
				function ( $module ) {
					return $module !== self::ACCOUNT_PROTECTION_MODULE_NAME;
				}
			);

		}

		return $modules;
	}
}
