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

	function get_all_events( $action_name = null ) {
		if ( $action_name ) {
			return array_values( array_filter( $this->events, function( $event ) use ( $action_name ) { 
				return $event->action === $action_name; 
			} ) );
		}
		return $this->events;
	}

	function get_most_recent_event( $action_name = null ) {
		$events_list = $this->get_all_events( $action_name );

		if( count( $events_list ) > 0 ) {
			return $events_list[ count( $events_list ) - 1 ];
		}
		
		return false;
	}
}
