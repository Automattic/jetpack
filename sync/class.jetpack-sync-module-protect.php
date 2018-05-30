<?php

/**
 * logs bruteprotect failed logins via sync
 */
class Jetpack_Sync_Module_Protect extends Jetpack_Sync_Module {

	function name() {
		return 'protect';
	}

	function init_listeners( $callback ) {
		add_action( 'jpp_log_failed_attempt', array( $this, 'maybe_log_failed_login_attempt' ) );
		add_action( 'jetpack_valid_failed_login_attempt', $callback );
	}

	function maybe_log_failed_login_attempt( $failed_attempt ) {
		$protect = Jetpack_Protect_Module::instance();
		if ( $protect->has_login_ability() ) {
			do_action( 'jetpack_valid_failed_login_attempt', $failed_attempt );
		}
	}
}
