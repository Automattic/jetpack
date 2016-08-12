<?php

class Jetpack_Sync_Module_Stats extends Jetpack_Sync_Module {

	function name() {
		return 'stats';
	}

	function init_listeners( $callback ) {
		add_action( 'jetpack_heartbeat', array( $this, 'sync_site_stats' ), 20 );
		add_action( 'jetpack_sync_heartbeat_stats', $callback );
	}
	/*
	 * This namespaces the action that we sync.
	 * So that we can differentiate it from future actions.
	 */
	public function sync_site_stats() {
		do_action( 'jetpack_sync_heartbeat_stats' );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_sync_heartbeat_stats', array( $this, 'add_stats' ) );
	}

	public function add_stats() {
		return array( Jetpack::get_stat_data( false ) );
	}
}
