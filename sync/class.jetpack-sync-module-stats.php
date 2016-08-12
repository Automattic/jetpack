<?php

class Jetpack_Sync_Module_Stats extends Jetpack_Sync_Module {

	function name() {
		return 'stats';
	}

	function init_listeners( $callback ) {
		add_action( 'jetpack_heartbeat', array( $this, 'run_action' ) );
		add_action( 'jetpack_sync_site_stats', $callback );
	}

	function run_action() {
		do_action( 'jetpack_sync_site_stats' );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_sync_add_stats', array( $this, 'add_stats' ) );
	}

	public function add_stats() {
		return Jetpack::get_stat_data();
	}
}
