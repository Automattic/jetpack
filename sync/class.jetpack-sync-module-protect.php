<?php

/**
 * logs bruteprotect failed logins via sync
 */
class Jetpack_Sync_Module_Protect extends Jetpack_Sync_Module {

	function name() {
		return 'protect';
	}

	function init_listeners( $callback ) {
		add_action( 'jpp_log_failed_attempt', $callback );
	}
}
