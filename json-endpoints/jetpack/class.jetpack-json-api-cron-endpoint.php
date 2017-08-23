<?php

// GET /sites/%s/cron
class Jetpack_JSON_API_Cron_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'manage_options';

	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		return parent::validate_call( $_blog_id, $capability, false );
	}

	protected function result() {
		return array(
			'cron_array' => _get_cron_array(),
			'current_timestamp' => time()
		);
	}

	protected function sanitize_hook( $hook ) {
		return preg_replace( '/[^A-Za-z0-9-_]/', '', $hook );
	}

	protected function resolve_arguments() {
		$args = $this->input();
		return  isset( $args['arguments'] ) ? json_decode( $args['arguments'] ) : array();
	}

	protected function is_cron_locked( $gmt_time ) {
		// The cron lock: a unix timestamp from when the cron was spawned.
		$doing_cron_transient = $this->get_cron_lock();
		if ( $doing_cron_transient && ( $doing_cron_transient + WP_CRON_LOCK_TIMEOUT > $gmt_time )  ) {
			return new WP_Error( 'cron-is-locked', 'Current there is a cron already happening.', 403 );
		}
		return $doing_cron_transient;
	}

	protected function maybe_unlock_cron( $doing_wp_cron ) {
		if ( $this->get_cron_lock() == $doing_wp_cron ) {
			delete_transient( 'doing_cron' );
		}
	}

	protected function lock_cron() {
		$lock = sprintf( '%.22F', microtime( true ) );
		set_transient( 'doing_cron', $lock );
		return $lock;
	}

	protected function get_schedules( $hook, $args ) {
		$crons = _get_cron_array();
		$key = md5(serialize($args));
		if ( empty( $crons ) )
			return array();
		$found = array();
		foreach ( $crons as $timestamp => $cron ) {
			if ( isset( $cron[$hook][$key] ) )
				$found[] = $timestamp;
		}

		return $found;
	}

	/**
	 * This function is based on the one found in wp-cron.php with a similar name
	 * @return int
	 */
	protected function get_cron_lock() {
		global $wpdb;

		$value = 0;
		if ( wp_using_ext_object_cache() ) {
			/*
			 * Skip local cache and force re-fetch of doing_cron transient
			 * in case another process updated the cache.
			 */
			$value = wp_cache_get( 'doing_cron', 'transient', true );
		} else {
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1", '_transient_doing_cron' ) );
			if ( is_object( $row ) ) {
				$value = $row->option_value;
			}
		}
		return $value;
	}
}

// POST /sites/%s/cron
class Jetpack_JSON_API_Cron_Post_Endpoint extends Jetpack_JSON_API_Cron_Endpoint {

	protected function result() {
		define( 'DOING_CRON', true );
		set_time_limit( 0 );
		$args = $this->input();

		if ( false === $crons = _get_cron_array() ) {
			return new WP_Error( 'no-cron-event', 'Currently there are no cron events', 400 );
		}

		$timestamps_to_run = array_keys( $crons );
		$gmt_time = microtime( true );

		if ( isset( $timestamps_to_run[0] ) && $timestamps_to_run[0] > $gmt_time ) {
			return new WP_Error( 'no-cron-event', 'Currently there are no cron events ready to be run', 400 );
		}

		$locked = $this->is_cron_locked( $gmt_time );
		if ( is_wp_error( $locked ) ) {
			return $locked;
		}

		$lock = $this->lock_cron();
		$processed_events = array();

		foreach ( $crons as $timestamp => $cronhooks ) {
			if ( $timestamp > $gmt_time && ! isset( $args[ 'hook' ] ) ) {
				break;
			}

			foreach ( $cronhooks as $hook => $hook_data ) {
				if ( isset( $args[ 'hook' ] ) && ! in_array( $hook, $args['hook'] ) ) {
					continue;
				}

				foreach ( $hook_data as $hash => $hook_item ) {

					$schedule = $hook_item['schedule'];
					$arguments = $hook_item['args'];

					if ( $schedule != false ) {
						wp_reschedule_event( $timestamp, $schedule, $hook, $arguments );
					}

					wp_unschedule_event( $timestamp, $hook, $arguments );

					do_action_ref_array( $hook, $arguments );
					$processed_events[] = array( $hook => $arguments );

					// If the hook ran too long and another cron process stole the lock,
					// or if we things are taking longer then 20 seconds then quit.
					if ( ( $this->get_cron_lock() != $lock ) || ( $gmt_time + 20 > microtime( true ) ) ) {
						$this->maybe_unlock_cron( $lock );
						return array( 'success' => $processed_events );
					}

				}
			}
		}

		$this->maybe_unlock_cron( $lock );
		return array( 'success' => $processed_events );
	}
}

// POST /sites/%s/cron/schedule
class Jetpack_JSON_API_Cron_Schedule_Endpoint extends Jetpack_JSON_API_Cron_Endpoint {

	protected function result() {
		$args = $this->input();
		if ( ! isset( $args['timestamp'] ) ) {
			return new WP_Error( 'missing_argument', 'Please provide the timestamp argument', 400 );
		}

		if ( ! is_int( $args['timestamp'] ) || $args['timestamp'] < time() ) {
			return new WP_Error( 'timestamp-invalid', 'Please provide timestamp that is an integer and set in the future', 400 );
		}

		if ( ! isset( $args['hook'] ) ) {
			return new WP_Error( 'missing_argument', 'Please provide the hook argument', 400 );
		}

		$hook = $this->sanitize_hook( $args['hook'] );

		$locked = $this->is_cron_locked( microtime( true ) );
		if ( is_wp_error( $locked ) ) {
			return $locked;
		}

		$arguments = $this->resolve_arguments();
		$next_scheduled = $this->get_schedules( $hook, $arguments );

		if ( isset( $args['recurrence'] ) ) {
			$schedules = wp_get_schedules();
			if ( ! isset( $schedules[ $args['recurrence'] ] ) ) {
				return new WP_Error( 'invalid-recurrence', 'Please provide a valid recurrence argument', 400 );
			}

			if ( count( $next_scheduled ) > 0 ) {
				return new WP_Error( 'event-already-scheduled', 'This event is ready scheduled', 400 );
			}
			$lock = $this->lock_cron();
			wp_schedule_event( $args['timestamp'], $args['recurrence'], $hook, $arguments );
			$this->maybe_unlock_cron( $lock );
			return array( 'success' => true );
		}

		foreach( $next_scheduled as $scheduled_time ) {
			if ( abs( $scheduled_time - $args['timestamp'] ) <= 10 * MINUTE_IN_SECONDS ) {
				return new WP_Error( 'event-already-scheduled', 'This event is ready scheduled', 400 );
			}
		}
		$lock = $this->lock_cron();
		$next = wp_schedule_single_event( $args['timestamp'], $hook, $arguments );
		$this->maybe_unlock_cron( $lock );
		return array( 'success' => is_null( $next  ) ? true : false );
	}
}

// POST /sites/%s/cron/unschedule
class Jetpack_JSON_API_Cron_Unschedule_Endpoint extends Jetpack_JSON_API_Cron_Endpoint {

	protected function result() {
		$args = $this->input();

		if ( !isset( $args['hook'] ) ) {
			return new WP_Error( 'missing_argument', 'Please provide the hook argument', 400 );
		}

		$hook = $this->sanitize_hook( $args['hook'] );

		$locked = $this->is_cron_locked( microtime( true ) );
		if ( is_wp_error( $locked ) ) {
			return $locked;
		}

		$crons = _get_cron_array();
		if ( empty( $crons ) ) {
			return new WP_Error( 'cron-not-present', 'Unable to unschedule an event, no events in the cron', 400 );
		}

		$arguments = $this->resolve_arguments();

		if ( isset( $args['timestamp'] ) ) {
			$next_schedulded = $this->get_schedules( $hook, $arguments );
			if ( in_array( $args['timestamp'], $next_schedulded ) ) {
				return new WP_Error( 'event-not-present', 'Unable to unschedule the event, the event doesn\'t exist', 400 );
			}

			$lock = $this->lock_cron();
			wp_unschedule_event( $args['timestamp'], $hook, $arguments );
			$this->maybe_unlock_cron( $lock );
			return array( 'success' => true );
		}
		$lock = $this->lock_cron();
		wp_clear_scheduled_hook( $hook, $arguments );
		$this->maybe_unlock_cron( $lock );
		return array( 'success' => true );
	}
}
