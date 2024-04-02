<?php
/**
 * Scheduled Updates Logs
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

use WP_Error;

/**
 * Scheduled_Update_Logs class
 *
 * This class provides a static methods to log/retrieve logs for scheduled updates.
 */
class Scheduled_Updates_Logs {
	/**
	 * The name of the WordPress option where the logs are stored.
	 */
	const OPTION_NAME = 'jetpack_scheduled_update_logs';

	/**
	 * The maximum number of runs to keep per schedule_id.
	 */
	const MAX_RUNS_PER_SCHEDULE = 2;

	/**
	 * Action constant representing the different kind of log message.
	 */
	const PLUGIN_UPDATES_START                    = 'PLUGIN_UPDATES_START';
	const PLUGIN_UPDATE_SUCCESS                   = 'PLUGIN_UPDATE_SUCCESS';
	const PLUGIN_UPDATE_FAILURE_AND_ROLLBACK      = 'PLUGIN_UPDATE_FAILURE_AND_ROLLBACK';
	const PLUGIN_UPDATE_FAILURE_AND_ROLLBACK_FAIL = 'PLUGIN_UPDATE_FAILURE_AND_ROLLBACK_FAIL';
	const PLUGIN_UPDATES_COMPLETE                 = 'PLUGIN_UPDATES_COMPLETE';

	/**
	 * Logs a scheduled update event.
	 *
	 * @param string $schedule_id The ID of the schedule.
	 * @param string $action      The action constant representing the event.
	 * @param string $message     Optional. The message associated with the event.
	 * @param mixed  $context     Optional. Additional context data associated with the event.
	 *
	 * @return WP_Error|null
	 */
	public static function log( $schedule_id, $action, $message = null, $context = null ) {
		$timestamp = wp_date( 'U' );
		$log_entry = array(
			'timestamp' => $timestamp,
			'action'    => $action,
			'message'   => $message,
			'context'   => $context,
		);

		$logs = get_option( self::OPTION_NAME, array() );

		if ( ! self::is_valid_schedule( $schedule_id ) ) {
			return new WP_Error( 'invalid_schedule_id', 'Invalid schedule ID' );
		}

		if ( ! isset( $logs[ $schedule_id ] ) ) {
			$logs[ $schedule_id ] = array();
		}

		$logs[ $schedule_id ][] = $log_entry;

		// Keep only the logs for the last MAX_RUNS_PER_SCHEDULE runs per schedule_id
		$start_count   = 0;
		$last_two_runs = array();
		for ( $i = count( $logs[ $schedule_id ] ) - 1; $i >= 0; $i-- ) {
			if ( self::PLUGIN_UPDATES_START === $logs[ $schedule_id ][ $i ]['action'] ) {
				++$start_count;
			}
			$last_two_runs[] = $logs[ $schedule_id ][ $i ];
			if ( self::MAX_RUNS_PER_SCHEDULE === $start_count ) {
				break;
			}
		}
		$last_two_runs        = array_reverse( $last_two_runs );
		$logs[ $schedule_id ] = $last_two_runs;

		update_option( self::OPTION_NAME, $logs );
	}

	/**
	 * Retrieves the logs for a specific schedule_id or all logs if no schedule_id is provided.
	 *
	 * @param string|null $schedule_id Optional. The ID of the schedule. If not provided, all logs will be returned.
	 *
	 * @return array|WP_Error
	 *              An array containing the logs, split by run.
	 *               If a schedule_id is provided, the logs for that specific schedule are returned.
	 *               If no schedule_id is provided, all logs are returned, with each schedule_id as a key in the array.
	 *               Each run is an array of log entries, where each log entry is an associative array
	 *               containing the following keys:
	 *               - 'timestamp' (int): The Unix timestamp of the log entry.
	 *               - 'action' (string): The action constant representing the event.
	 *               - 'message' (string|null): The message associated with the event, if available.
	 *               - 'context' (mixed|null): Additional context data associated with the event, if available.
	 */
	public static function get( $schedule_id = null ) {
		$logs = get_option( self::OPTION_NAME, array() );

		if ( null === $schedule_id ) {
			// Return all logs if no schedule_id is provided
			$all_logs = array();
			foreach ( $logs as $schedule_id => $schedule_logs ) {
				$all_logs[ $schedule_id ] = self::split_logs_into_runs( $schedule_logs );
			}
			return $all_logs;
		}

		if ( ! self::is_valid_schedule( $schedule_id ) ) {
			return new WP_Error( 'invalid_schedule_id', 'Invalid schedule ID' );
		}

		if ( ! isset( $logs[ $schedule_id ] ) ) {
			return array();
		}

		$schedule_logs = $logs[ $schedule_id ];
		return self::split_logs_into_runs( $schedule_logs );
	}

	/**
	 * Clears the logs for a specific schedule_id or all logs if no schedule_id is provided.
	 *
	 * @param string|null $schedule_id Optional. The ID of the schedule. If not provided, all logs will be cleared.
	 *
	 * @return WP_Error|null
	 */
	public static function clear( string $schedule_id = null ) {
		$logs = get_option( self::OPTION_NAME, array() );

		if ( null === $schedule_id ) {
			// Clear all logs if no schedule_id is provided
			$logs = array();
		} else {
			if ( ! self::is_valid_schedule( $schedule_id ) ) {
				return new WP_Error( 'invalid_schedule_id', 'Invalid schedule ID' );
			}

			if ( isset( $logs[ $schedule_id ] ) ) {
				// Clear the logs for the specific schedule_id
				unset( $logs[ $schedule_id ] );
			}
		}

		update_option( self::OPTION_NAME, $logs );
	}

	/**
	 * Splits the logs into runs based on the PLUGIN_UPDATES_START action.
	 *
	 * @param array $logs The logs to split into runs.
	 *
	 * @return array An array containing the logs split into runs.
	 */
	private static function split_logs_into_runs( $logs ) {
		$runs        = array();
		$current_run = array();

		foreach ( $logs as $log_entry ) {
			if ( self::PLUGIN_UPDATES_START === $log_entry['action'] ) {
				if ( ! empty( $current_run ) ) {
					$runs[] = $current_run;
				}
				$current_run = array();
			}
			$current_run[] = $log_entry;
		}

		if ( ! empty( $current_run ) ) {
			$runs[] = $current_run;
		}

		return $runs;
	}

	/**
	 * Returns whether a schedule_id is valid.
	 *
	 * @param string $schedule_id The schedule id.
	 * @return bool
	 */
	private static function is_valid_schedule( $schedule_id ) {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		if ( ! isset( $events[ $schedule_id ] ) ) {
			return false;
		}

		return true;
	}
}
