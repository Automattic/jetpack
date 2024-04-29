<?php
/**
 * Functions.
 *
 * @package automattic/scheduled-updates
 */

if ( ! function_exists( 'wp_get_scheduled_events' ) ) {
	/**
	 * Retrieves scheduled events.
	 *
	 * Retrieves all the events that have been scheduled for the hook provided.
	 *
	 * This should really be in Core, and until it is, we'll define it here in a forward-compatible way.
	 *
	 * @param string $hook Action hook of the event.
	 * @return object[]|array {
	 *     Array of event objects. Empty array if no events exist for the hook.
	 *
	 *     @type string       $hook      Action hook to execute when the event is run.
	 *     @type int          $timestamp Unix timestamp (UTC) for when to next run the event.
	 *     @type string|false $schedule  How often the event should subsequently recur.
	 *     @type array        $args      Array containing each separate argument to pass to the hook's callback function.
	 *     @type int          $interval  Optional. The interval time in seconds for the schedule. Only present for recurring events.
	 * }
	 */
	function wp_get_scheduled_events( $hook ) {
		/**
		 * Filter to override retrieving scheduled events.
		 *
		 * Returning a non-null value will short-circuit the normal process,
		 * returning the filtered value instead.
		 *
		 * Return false if the event does not exist, otherwise an event object
		 * should be returned.
		 *
		 * @param null|false|object $pre  Value to return instead. Default null to continue retrieving the event.
		 * @param string            $hook Action hook of the event.
		 */
		$pre = apply_filters( 'pre_get_scheduled_events', null, $hook );

		if ( null !== $pre ) {
			return $pre;
		}

		$crons = _get_cron_array();
		if ( empty( $crons ) ) {
			return array();
		}

		$events = array();
		foreach ( $crons as $timestamp => $cron ) {
			if ( isset( $cron[ $hook ] ) ) {
				$key             = key( $cron[ $hook ] );
				$scheduled_event = array_pop( $cron[ $hook ] );

				$event = (object) array(
					'hook'      => $hook,
					'timestamp' => $timestamp,
					'schedule'  => $scheduled_event['schedule'],
					'args'      => $scheduled_event['args'],
				);
				if ( isset( $scheduled_event['interval'] ) ) {
					$event->interval = $scheduled_event['interval'];
				}

				$events[ $key ] = $event;
			}
		}

		return $events;
	}
}
