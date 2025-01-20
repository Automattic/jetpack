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
	const STRICT_MODE_OPTION_NAME        = 'jetpack_account_protection_strict_mode';

	/**
	 * Modules dependency.
	 *
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @param Modules|null $modules Modules dependency.
	 */
	public function __construct( Modules $modules = null ) {
		$this->modules = $modules ?? new Modules();
	}

	/**
	 * Initializes the configurations needed for the account protection module.
	 */
	public function init() {
		// Account protection activation/deactivation hooks
		add_action( 'jetpack_activate_module_' . self::ACCOUNT_PROTECTION_MODULE_NAME, array( $this, 'on_account_protection_activation' ) );
		add_action( 'jetpack_deactivate_module_' . self::ACCOUNT_PROTECTION_MODULE_NAME, array( $this, 'on_account_protection_deactivation' ) );

		// Register REST routes
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
	}

	/**
	 * Activate the account protection on module activation.
	 */
	public function on_account_protection_activation() {
		// Account protection activated
	}

	/**
	 * Deactivate the account protection on module activation.
	 */
	public function on_account_protection_deactivation() {
		// Account protection deactivated
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
	public function disable() {
		// Return true if already disabled.
		if ( ! $this->is_enabled() ) {
			return true;
		}
		return $this->modules->deactivate( self::ACCOUNT_PROTECTION_MODULE_NAME );
	}
}
