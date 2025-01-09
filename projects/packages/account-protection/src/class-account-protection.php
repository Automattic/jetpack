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
	}

	/**
	 * Activate the account protection on module activation.
	 */
	public static function on_account_protection_activation() {
		// Account protection activated
	}

	/**
	 * Deactivate the account protection on module activation.
	 */
	public static function on_account_protection_deactivation() {
		// Account protection deactivated
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
