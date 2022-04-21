<?php // phpcs:ignore WordPress.Files.FileName

/**
 * Just stores a buffer of received events
 */
class Jetpack_Sync_Server_Eventstore {
	private $events      = array();
	private $action_name = null;

	public function init() {
		add_action( 'jetpack_sync_remote_action', array( $this, 'handle_remote_action' ), 10, 9 );
	}

	public function handle_remote_action( $action_name, $args, $user_id, $silent, $timestamp, $sent_timestamp, $queue_id, $queue_size ) {
		$this->events[ get_current_blog_id() ][] = (object) array(
			'action'         => $action_name,
			'args'           => $args,
			'user_id'        => $user_id,
			'silent'         => $silent,
			'timestamp'      => $timestamp,
			'sent_timestamp' => $sent_timestamp,
			'queue'          => $queue_id,
			'queue_size'     => $queue_size,
		);
	}

	public function get_all_events( $action_name = null, $blog_id = null ) {
		$blog_id = isset( $blog_id ) ? $blog_id : get_current_blog_id();

		if ( ! isset( $this->events, $this->events[ $blog_id ] ) ) {
			return array();
		}

		if ( $action_name ) {
			$events = array();

			foreach ( $this->events[ $blog_id ] as $event ) {
				if ( $event->action === $action_name ) {
					$events[] = $event;
				}
			}

			return $events;
		}

		return $this->events[ $blog_id ];
	}

	public function get_most_recent_event( $action_name = null, $blog_id = null ) {
		$events_list = $this->get_all_events( $action_name, $blog_id );

		if ( count( $events_list ) > 0 ) {
			return $events_list[ count( $events_list ) - 1 ];
		}

		return false;
	}

	public function reset() {
		$this->events[ get_current_blog_id() ] = array();
	}
}
