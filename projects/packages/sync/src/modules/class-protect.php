<?php
/**
 * Protect sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Constants as Jetpack_Constants;
use Automattic\Jetpack\Waf\Waf_Compatibility;
use Jetpack_Protect_Module;

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
	 * Maybe log a failed login attempt.
	 *
	 * @access public
	 *
	 * @param array $failed_attempt Failed attempt data.
	 */
	public function maybe_log_failed_login_attempt( $failed_attempt ) {
		if ( ! isset( $failed_attempt['has_login_ability'] ) && Waf_Compatibility::is_brute_force_running_in_jetpack() ) {
			$protect                             = Jetpack_Protect_Module::instance();
			$failed_attempt['has_login_ability'] = $protect->has_login_ability();
		}

		if ( $failed_attempt['has_login_ability'] && ! Jetpack_Constants::is_true( 'XMLRPC_REQUEST' ) ) {
			do_action( 'jetpack_valid_failed_login_attempt', $failed_attempt );
		}
	}
}
