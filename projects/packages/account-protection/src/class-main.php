<?php
/**
 * Class used to define Main.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Class Main
 */
class Main {
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
	 * Password manager instance
	 *
	 * @var Password_Manager
	 */
	private $password_manager;

	/**
	 * Password_Strength_Meter instance
	 *
	 * @var Password_Strength_Meter
	 */
	private $password_strength_meter;

	/**
	 * Initializes the configurations needed for the account protection module.
	 *
	 * @return void
	 */
	public function initialize(): void {
		$this->register_hooks();

		if ( $this->is_enabled() ) {
			$this->register_runtime_hooks();
		}
	}

	/**
	 * Account_Protection constructor.
	 *
	 * @param ?Modules                 $modules            Modules instance.
	 * @param ?Password_Detection      $password_detection Password detection instance.
	 * @param ?Password_Manager        $password_manager Password manager instance.
	 * @param ?Password_Strength_Meter $password_strength_meter Password strength meter instance.
	 */
	public function __construct( ?Modules $modules = null, ?Password_Detection $password_detection = null, ?Password_Manager $password_manager = null, ?Password_Strength_Meter $password_strength_meter = null ) {
		$this->modules                 = $modules ?? new Modules();
		$this->password_detection      = $password_detection ?? new Password_Detection();
		$this->password_manager        = $password_manager ?? new Password_Manager();
		$this->password_strength_meter = $password_strength_meter ?? new Password_Strength_Meter();
	}

	/**
	 * Register hooks for module activation and environment validation.
	 *
	 * @return void
	 */
	protected function register_hooks(): void {
		// Account protection deactivation hooks
		add_action( 'jetpack_deactivate_module_' . self::ACCOUNT_PROTECTION_MODULE_NAME, array( $this, 'on_account_protection_deactivation' ) );

		// Do not run in unsupported environments
		add_filter( 'jetpack_get_available_modules', array( $this, 'remove_module_on_unsupported_environments' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'remove_standalone_module_on_unsupported_environments' ) );
	}

	/**
	 * Register hooks for runtime operations.
	 *
	 * @return void
	 */
	protected function register_runtime_hooks(): void {
		$this->register_password_detection_hooks();
		$this->register_strong_passwords_hooks();
	}

	/**
	 * Register hooks for password detection.
	 *
	 * @return void
	 */
	public function register_password_detection_hooks(): void {
		add_action( 'wp_authenticate_user', array( $this->password_detection, 'login_form_password_detection' ), 10, 2 );
		add_action( 'wp_login_failed', array( $this->password_detection, 'handle_password_detection_validation_error' ), 10, 2 );
		add_action( 'login_form_password-detection', array( $this->password_detection, 'render_page' ), 10, 2 );
		add_action( 'wp_enqueue_scripts', array( $this->password_detection, 'enqueue_styles' ) );
	}

	/**
	 * Register hooks for password manager.
	 *
	 * @return void
	 */
	public function register_password_manager_hooks(): void {
		add_action( 'user_profile_update_errors', array( $this->password_manager, 'validate_profile_update' ), 10, 3 );
		add_action( 'validate_password_reset', array( $this->password_manager, 'validate_password_reset' ), 10, 2 );
		add_action( 'profile_update', array( $this->password_manager, 'on_profile_update' ), 10, 2 );
		add_action( 'after_password_reset', array( $this->password_manager, 'on_password_reset' ), 10, 1 );
	}

	/**
	 * Register hooks for password strength meter.
	 *
	 * @return void
	 */
	public function register_password_strength_meter_hooks(): void {
		add_action( 'admin_enqueue_scripts', array( $this->password_strength_meter, 'enqueue_jetpack_password_strength_meter_profile_script' ) );
		add_action( 'login_enqueue_scripts', array( $this->password_strength_meter, 'enqueue_jetpack_password_strength_meter_reset_script' ) );
		add_action( 'wp_ajax_validate_password_ajax', array( $this->password_strength_meter, 'validate_password_ajax' ) );
		add_action( 'wp_ajax_nopriv_validate_password_ajax', array( $this->password_strength_meter, 'validate_password_ajax' ) );
	}

	/**
	 * Register hooks for strong passwords.
	 *
	 * @return void
	 */
	public function register_strong_passwords_hooks(): void {
		$this->register_password_manager_hooks();
		$this->register_password_strength_meter_hooks();
	}

	/**
	 * Unregister hooks for password detection.
	 *
	 * @return void
	 */
	public function unregister_password_detection_hooks(): void {
		if ( isset( $this->password_detection ) ) {
			remove_action( 'wp_authenticate_user', array( $this->password_detection, 'login_form_password_detection' ) );
			remove_action( 'wp_login_failed', array( $this->password_detection, 'handle_password_detection_validation_error' ) );
			remove_action( 'login_form_password-detection', array( $this->password_detection, 'render_page' ) );
			remove_action( 'wp_enqueue_scripts', array( $this->password_detection, 'enqueue_styles' ) );
		}
	}

	/**
	 * Unregister hooks for password manager.
	 *
	 * @return void
	 */
	public function unregister_password_manager_hooks(): void {
		if ( isset( $this->password_manager ) ) {
			remove_action( 'user_profile_update_errors', array( $this->password_manager, 'validate_profile_update' ) );
			remove_action( 'validate_password_reset', array( $this->password_manager, 'validate_password_reset' ) );
			remove_action( 'profile_update', array( $this->password_manager, 'on_profile_update' ) );
			remove_action( 'after_password_reset', array( $this->password_manager, 'on_password_reset' ) );
		}
	}

	/**
	 * Unregister hooks for password strength meter.
	 *
	 * @return void
	 */
	public function unregister_password_strength_meter_hooks(): void {
		if ( isset( $this->password_strength_meter ) ) {
			remove_action( 'admin_enqueue_scripts', array( $this->password_strength_meter, 'enqueue_jetpack_password_strength_meter_profile_script' ) );
			remove_action( 'login_enqueue_scripts', array( $this->password_strength_meter, 'enqueue_jetpack_password_strength_meter_reset_script' ) );
			remove_action( 'wp_ajax_validate_password_ajax', array( $this->password_strength_meter, 'validate_password_ajax' ) );
			remove_action( 'wp_ajax_nopriv_validate_password_ajax', array( $this->password_strength_meter, 'validate_password_ajax' ) );
		}
	}

	/**
	 * Unregister hooks for strong passwords.
	 *
	 * @return void
	 */
	public function unregister_strong_passwords_hooks(): void {
		$this->unregister_password_manager_hooks();
		$this->unregister_password_strength_meter_hooks();
	}

	/**
	 * Deactivate the account protection on module deactivation.
	 *
	 * @return void
	 */
	public function on_account_protection_deactivation(): void {
		$this->unregister_password_detection_hooks();
		$this->unregister_strong_passwords_hooks();
	}

	/**
	 * Determines if the account protection module is enabled on the site.
	 *
	 * @return bool
	 */
	public function is_enabled(): bool {
		return $this->modules->is_active( self::ACCOUNT_PROTECTION_MODULE_NAME );
	}

	/**
	 * Enables the account protection module.
	 *
	 * @return bool
	 */
	public function enable(): bool {
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

		// Do not run for WordPress.com Simple sites
		if ( ( new Host() )->is_wpcom_simple() ) {
			return false;
		}

		return true;
	}

	/**
	 * Determines if the current Jetpack version is supported.
	 *
	 * @return bool
	 */
	public function has_unsupported_jetpack_version(): bool {
		// Do not run when Jetpack version is less than 14.5
		$jetpack_version = Constants::get_constant( 'JETPACK__VERSION' );
		if ( $jetpack_version && version_compare( $jetpack_version, '14.5', '<' ) ) {
			return true;
		}

		return false;
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
