<?php
/**
 * Protect sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Constants as Jetpack_Constants;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;

/**
 * Class to handle sync for Protect.
 * Logs BruteProtect failed logins via sync.
 */
class Protect extends Module {
	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'protect';
	}

	/**
	 * Initialize Protect action listeners.
	 *
	 * @access public
	 *
	 * @param callable $callback Action handler callable.
	 */
	public function init_listeners( $callback ) {
		add_action( 'jpp_log_failed_attempt', array( $this, 'maybe_log_failed_login_attempt' ) );
		add_action( 'jetpack_valid_failed_login_attempt', $callback );
	}

	/**
	 * Provide a fallback value for has_login_ability.
	 *
	 * @access private
	 */
	private function has_login_ability_fallback() {
		// Fall back to the Brute Force Protection class if it is available.
		if ( class_exists( 'Brute_Force_Protection' ) ) {
			$brute_force_protection = Brute_Force_Protection::instance();
			return $brute_force_protection->has_login_ability();
		}

		// If the login ability can not be determined, the feature is not active,
		// or something is wrong, default to not syncing failed login attempts.
		return false;
	}

	/**
	 * Maybe log a failed login attempt.
	 *
	 * @access public
	 *
	 * @param array $failed_attempt Failed attempt data.
	 */
	public function maybe_log_failed_login_attempt( $failed_attempt ) {
		/**
		 * Filter which provides Jetpack's decision as to whether the current requestor can attempt logging in.
		 *
		 * Example: When Jetpack's Brute Force Login Protection is active, this filter will return false if the user is currently locked out.
		 *
		 * @since 3.5.1
		 *
		 * @package sync
		 *
		 * @return bool True if the user should be allowed to attempt logging in, false otherwise.
		 */
		$has_login_ability = apply_filters( 'jetpack_has_login_ability', $this->has_login_ability_fallback() );

		if ( $has_login_ability && ! Jetpack_Constants::is_true( 'XMLRPC_REQUEST' ) ) {
			do_action( 'jetpack_valid_failed_login_attempt', $failed_attempt );
		}
	}
}
