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

	/**
	 * Returns all Sync events of a certain action type, of a certain blog, and filtered if necessary.
	 *
	 * @param String   $action_name Sync action slug, e.g. jetpack_sync_save_post.
	 * @param Integer  $blog_id Blog ID filter - only return events for a given blog ID, defaults to current blog.
	 * @param Callable $filter a custom callable to pass the event object to to be filtered.
	 **/
	public function get_all_events( $action_name = null, $blog_id = null, $filter = null ) {
		$blog_id = isset( $blog_id ) ? $blog_id : get_current_blog_id();

		if ( ! isset( $this->events[ $blog_id ] ) ) {
			return array();
		}

		$events = array();

		if ( $action_name ) {
			foreach ( $this->events[ $blog_id ] as $event ) {
				if ( $event->action === $action_name ) {
					$events[] = $event;
				}
			}
		} else {
			$events = $this->events[ $blog_id ];
		}

		if ( is_callable( $filter ) ) {
			$events = array_values( array_filter( $events, $filter ) );
		}

		return $events;
	}

	/**
	 * Returns a most recent event of a certain action type, of a certain blog, and filtered if necessary.
	 *
	 * @param String   $action_name Sync action slug, e.g. jetpack_sync_save_post.
	 * @param Integer  $blog_id Blog ID filter - only return events for a given blog ID, defaults to current blog.
	 * @param Callable $filter a custom callable to pass the event object to to be filtered.
	 **/
	public function get_most_recent_event( $action_name = null, $blog_id = null, $filter = null ) {
		$events_list = $this->get_all_events( $action_name, $blog_id, $filter );

		if ( count( $events_list ) > 0 ) {
			return $events_list[ count( $events_list ) - 1 ];
		}

		return false;
	}

	public function reset() {
		$this->events[ get_current_blog_id() ] = array();
	}
}
