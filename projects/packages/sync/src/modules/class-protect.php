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
		if ( class_exists( 'Brute_Force_Protection' ) ) {
			$brute_force_protection = Brute_Force_Protection::instance();
			return $brute_force_protection->has_login_ability();
		}

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
		$has_login_ability = apply_filters( 'jpp_has_login_ability', $this->has_login_ability_fallback() );

		if ( $has_login_ability && ! Jetpack_Constants::is_true( 'XMLRPC_REQUEST' ) ) {
			do_action( 'jetpack_valid_failed_login_attempt', $failed_attempt );
		}
	}
}
