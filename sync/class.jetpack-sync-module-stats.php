<?php

class Jetpack_Sync_Module_Stats extends Jetpack_Sync_Module {

	function name() {
		return 'stats';
	}

	function init_listeners( $callback ) {
		add_action( 'jetpack_heartbeat', $callback );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_heartbeat', array( $this, 'add_stats' ) );
	}

	public function add_stats() {
		return array( Jetpack::get_stat_data( false ) );
	}
}
