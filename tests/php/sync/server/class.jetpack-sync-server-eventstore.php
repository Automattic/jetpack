<?php

/**
 * Just stores a buffer of received events
 */
class Jetpack_Sync_Server_Eventstore {
	private $events = array();

	function init() {
		add_action( "jetpack_sync_remote_action", array( $this, 'handle_remote_action' ), 10, 2 );
	}

	function handle_remote_action( $action_name, $args ) {
		$this->events[] = (object) array( 'action' => $action_name, 'args' => $args );
	}

	function get_all_events() {
		return $this->events;
	}

	function get_most_recent_event() {
		if( count( $this->events ) > 0 ) 
			return $this->events[ count( $this->events ) - 1 ];
		else 
			return false;
	}
}
