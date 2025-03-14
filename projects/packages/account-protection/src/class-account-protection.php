<?php
/**
 * Class used to define Account Protection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Class Account_Protection
 */
class Account_Protection {
	const PACKAGE_VERSION                = '0.1.0-alpha';
	const ACCOUNT_PROTECTION_MODULE_NAME = 'account-protection';

	/**
	 * Flag to track if hooks have been registered.
	 *
	 * @var bool
	 */
	private static $hooks_registered = false;

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
	 * Initializes the configurations needed for the account protection module.
	 *
	 * @return void
	 */
	public function init(): void {
		// Register REST routes
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );

		if ( self::$hooks_registered ) {
			return;
		}

		$this->register_hooks();

		if ( $this->is_enabled() ) {
			$this->register_runtime_hooks();
		}

		self::$hooks_registered = true;
	}

	/**
	 * Register hooks for module activation and environment validation.
	 *
	 * @return void
	 */
	protected function register_hooks(): void {
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
		$config = ( new Settings( $this ) )->get_config();

		if ( $config[ Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME ] ) {
			// Validate password after successful login
			add_action( 'wp_authenticate_user', array( $this->password_detection, 'login_form_password_detection' ), 10, 2 );

			// Handle password detection login failure
			add_action( 'wp_login_failed', array( $this->password_detection, 'handle_password_detection_validation_error' ), 10, 2 );

			// Add password detection flow
			add_action( 'login_form_password-detection', array( $this->password_detection, 'render_page' ), 10, 2 );
			add_action( 'wp_enqueue_scripts', array( $this->password_detection, 'enqueue_styles' ) );
		}

		if ( $config[ Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME ] ) {
			// Add password validation
			add_action( 'user_profile_update_errors', array( $this->password_manager, 'validate_profile_update' ), 10, 3 );
			add_action( 'validate_password_reset', array( $this->password_manager, 'validate_password_reset' ), 10, 2 );

			// Update recent passwords list
			add_action( 'profile_update', array( $this->password_manager, 'on_profile_update' ), 10, 2 );
			add_action( 'after_password_reset', array( $this->password_manager, 'on_password_reset' ), 10, 1 );

			// Enqueue password strength meter scripts
			add_action( 'admin_enqueue_scripts', array( $this->password_strength_meter, 'enqueue_jetpack_password_strength_meter_profile_script' ) );
			add_action( 'login_enqueue_scripts', array( $this->password_strength_meter, 'enqueue_jetpack_password_strength_meter_reset_script' ) );

			// AJAX endpoint for password validation
			add_action( 'wp_ajax_validate_password_ajax', array( $this->password_strength_meter, 'validate_password_ajax' ) );
			add_action( 'wp_ajax_nopriv_validate_password_ajax', array( $this->password_strength_meter, 'validate_password_ajax' ) );
		}
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
	 * Wrapper function for the killswitch constant.
	 *
	 * @return bool
	 */
	public function is_killswitch_enabled(): bool {
		return defined( 'DISABLE_JETPACK_ACCOUNT_PROTECTION' ) && DISABLE_JETPACK_ACCOUNT_PROTECTION;
	}

	/**
	 * Wrapper function for the Host::is_wpcom_simple() method
	 *
	 * @return bool
	 */
	public function is_wpcom_simple(): bool {
		return ( new Host() )->is_wpcom_simple();
	}

	/**
	 * Determines if Account Protection is supported in the current environment.
	 *
	 * @return bool
	 */
	public function is_supported_environment(): bool {
		// Do not run when killswitch is enabled
		if ( $this->is_killswitch_enabled() ) {
			return false;
		}

		// Do not run for WordPress.com Simple sites
		if ( $this->is_wpcom_simple() ) {
			return false;
		}

		return true;
	}

	/**
	 * Wrapper function for the advanced options constant.
	 *
	 * @return bool
	 */
	public function is_advanced_options_constant_defined(): bool {
		return defined( 'ADVANCED_JETPACK_ACCOUNT_PROTECTION' ) && ADVANCED_JETPACK_ACCOUNT_PROTECTION;
	}

	/**
	 * Wrapper function for the pressable constant.
	 *
	 * @return bool
	 */
	public function is_pressable(): bool {
		return defined( 'IS_PRESSABLE' ) && IS_PRESSABLE;
	}

	/**
	 * Determines if the environment supports advanced options.
	 *
	 * @return bool
	 */
	public function environment_supports_advanced_options(): bool {
		if ( $this->is_advanced_options_constant_defined() ) {
			return true;
		}

		// Includes environments that do not support auto activation
		if ( $this->is_pressable() ) {
			return true;
		}

		return false;
	}

	/**
	 * Wrapper function for the Jetpack version constant.
	 *
	 * @return bool
	 */
	public function is_jetpack_version_defined(): bool {
		return defined( 'JETPACK__VERSION' );
	}

	/**
	 * Wrapper function for returning the Jetpack version.
	 *
	 * @return string
	 */
	public function get_jetpack_version(): string {
		return JETPACK__VERSION;
	}

	/**
	 * Determines if the current Jetpack version is supported.
	 *
	 * @return bool
	 */
	public function has_unsupported_jetpack_version(): bool {
		// Do not run when Jetpack version is less than 14.5
		if ( $this->is_jetpack_version_defined() ) {
			$jetpack_version = $this->get_jetpack_version();

			if ( is_string( $jetpack_version ) && version_compare( $jetpack_version, '14.5', '<' ) ) {
				return true;
			}
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
