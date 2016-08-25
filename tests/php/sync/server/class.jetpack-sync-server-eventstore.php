<?php

/**
 * Just stores a buffer of received events
 */
class Jetpack_Sync_Server_Eventstore {
	private $events = array();
	private $action_name = null;

	function init() {
		add_action( 'jetpack_sync_remote_action', array( $this, 'handle_remote_action' ), 10, 8 );
	}

	function handle_remote_action( $action_name, $args, $user_id, $silent, $timestamp, $sent_timestamp, $queue_id ) {
		$this->events[] = (object) array(
			'action'         => $action_name,
			'args'           => $args,
			'user_id'        => $user_id,
			'silent'         => $silent,
			'timestamp'      => $timestamp,
			'sent_timestamp' => $sent_timestamp,
			'queue'          => $queue_id,
		);
	}

	function get_all_events( $action_name = null ) {
		$this->action_name = $action_name;
		if ( $this->action_name ) {
			return array_values( array_filter( $this->events, array( $this, 'filter_actions' ) ) );
		}

		return $this->events;
	}

	function filter_actions( $event ) {
		return $event->action === $this->action_name;
	}

	function get_most_recent_event( $action_name = null ) {
		$events_list = $this->get_all_events( $action_name );

		if ( count( $events_list ) > 0 ) {
			return $events_list[ count( $events_list ) - 1 ];
		}

		return false;
	}

	function reset() {
		$this->events = array();
	}
}
