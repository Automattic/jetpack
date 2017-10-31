<?php

/**
 * logs bruteprotect failed logins via sync
 */
class Jetpack_Sync_Module_Protect extends Jetpack_Sync_Module {

	function name() {
		return 'protect';
	}

	function init_listeners( $callback ) {
		if ( Jetpack::is_module_active( 'protect' ) ) {
			add_action( 'jpp_log_failed_attempt', array( $this, 'maybe_log_failed_login_attempt' ) );
			add_action( 'jpp_log_failed_attempt', $callback );
		}
	}

	function maybe_log_failed_login_attempt( $ip ) {
		if ( Jetpack_Protect_Module::check_login_ability() ) {
			do_action( 'jetpack_log_failed_login_attempt', $ip );
		}
	}
}
