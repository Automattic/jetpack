<?php
/**
 * Scheduled Updates Logs
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

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
	const PLUGIN_UPDATES_SUCCESS                  = 'PLUGIN_UPDATES_SUCCESS';
	const PLUGIN_UPDATES_FAILURE                  = 'PLUGIN_UPDATES_FAILURE';
	const PLUGIN_UPDATE_SUCCESS                   = 'PLUGIN_UPDATE_SUCCESS';
	const PLUGIN_UPDATE_FAILURE                   = 'PLUGIN_UPDATE_FAILURE';
	const PLUGIN_SITE_HEALTH_CHECK_SUCCESS        = 'PLUGIN_SITE_HEALTH_CHECK_SUCCESS';
	const PLUGIN_SITE_HEALTH_CHECK_FAILURE        = 'PLUGIN_SITE_HEALTH_CHECK_FAILURE';
	const PLUGIN_UPDATE_FAILURE_AND_ROLLBACK      = 'PLUGIN_UPDATE_FAILURE_AND_ROLLBACK';
	const PLUGIN_UPDATE_FAILURE_AND_ROLLBACK_FAIL = 'PLUGIN_UPDATE_FAILURE_AND_ROLLBACK_FAIL';

	const ENUM_ACTIONS = array(
		self::PLUGIN_UPDATES_START,
		self::PLUGIN_UPDATES_SUCCESS,
		self::PLUGIN_UPDATES_FAILURE,
		self::PLUGIN_UPDATE_SUCCESS,
		self::PLUGIN_UPDATE_FAILURE,
		self::PLUGIN_SITE_HEALTH_CHECK_SUCCESS,
		self::PLUGIN_SITE_HEALTH_CHECK_FAILURE,
		self::PLUGIN_UPDATE_FAILURE_AND_ROLLBACK,
		self::PLUGIN_UPDATE_FAILURE_AND_ROLLBACK_FAIL,
	);

	/**
	 * Logs a scheduled update event.
	 *
	 * @param string $schedule_id The ID of the schedule.
	 * @param string $action      The action constant representing the event.
	 * @param string $message     Optional. The message associated with the event.
	 * @param mixed  $context     Optional. Additional context data associated with the event.
	 * @param int    $timestamp   Optional. The Unix timestamp of the log entry. Default is the current time.
	 * @return bool True if the log was successfully saved, false otherwise.
	 */
	public static function log( $schedule_id, $action, $message = null, $context = null, $timestamp = null ) {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		if ( ! isset( $events[ $schedule_id ] ) ) {
			return false;
		}

		if ( null === $timestamp ) {
			$timestamp = wp_date( 'U' );
		}

		$log_entry = array(
			'timestamp' => intval( $timestamp ),
			'action'    => $action,
			'message'   => $message,
			'context'   => $context,
		);

		$logs = get_option( self::OPTION_NAME, array() );

		if ( ! isset( $logs[ $schedule_id ] ) ) {
			$logs[ $schedule_id ] = array();
		}

		$logs[ $schedule_id ][] = $log_entry;

		// Keep only the logs for the last MAX_RUNS_PER_SCHEDULE runs per schedule_id.
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

		return update_option( self::OPTION_NAME, $logs );
	}

	/**
	 * Retrieves the logs for a specific schedule_id or all logs if no schedule_id is provided.
	 *
	 * If a schedule_id is provided, the logs for that specific schedule are returned.
	 * If no schedule_id is provided, all logs are returned, with each schedule_id as a key in the array.
	 *
	 * @param string|null $schedule_id Optional. The ID of the schedule. If not provided, all logs will be returned.
	 * @return array {
	 *      An array containing the logs, split by run.
	 *      Each run is an array of log entries, where each log entry is an associative array containing the following keys:
	 *
	 *      @type int         $timestamp The Unix timestamp of the log entry.
	 *      @type string      $action    The action constant representing the event.
	 *      @type string|null $message   The message associated with the event, if available.
	 *      @type mixed|null  $context   Additional context data associated with the event, if available.
	 * }
	 */
	public static function get( $schedule_id = null ) {
		$logs = get_option( self::OPTION_NAME, array() );

		if ( null === $schedule_id ) {
			// Return all logs if no schedule_id is provided.
			$all_logs = array();
			foreach ( $logs as $schedule_id => $schedule_logs ) {
				$all_logs[ $schedule_id ] = self::split_logs_into_runs( $schedule_logs );
			}
			return $all_logs;
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
	 */
	public static function clear( ?string $schedule_id = null ) {
		$logs = get_option( self::OPTION_NAME, array() );

		if ( null === $schedule_id ) {
			// Clear all logs if no schedule_id is provided.
			$logs = array();
		} else {
			// Clear the logs for the specific schedule_id.
			unset( $logs[ $schedule_id ] );
		}

		update_option( self::OPTION_NAME, $logs );
	}

	/**
	 * Infers the status of a plugin update schedule from its logs.
	 *
	 * @param string $schedule_id The ID of the plugin update schedule.
	 *
	 * @return array|false An array containing the last run timestamp and status, or false if no logs are found.
	 *                     The array has the following keys:
	 *                     - 'last_run_timestamp': The timestamp of the last run, or null if the status is 'in-progress'.
	 *                     - 'last_run_status': The status of the last run, which can be one of the following:
	 *                       - 'in-progress': The update is currently in progress.
	 *                       - 'success': The update was successful.
	 *                       - 'failure': The update failed.
	 *                       - 'failure-and-rollback': The update failed and a rollback was performed.
	 *                       - 'failure-and-rollback-fail': The update failed and the rollback also failed.
	 */
	public static function infer_status_from_logs( $schedule_id ) {
		$logs = self::get( $schedule_id );
		if ( empty( $logs ) ) {
			return false;
		}

		$last_run = end( $logs );

		$status    = 'in-progress';
		$timestamp = time();

		foreach ( $last_run as $log_entry ) {
			$timestamp = $log_entry['timestamp'];

			if ( self::PLUGIN_UPDATES_SUCCESS === $log_entry['action'] ) {
				$status = 'success';
				break;
			}
			if ( self::PLUGIN_UPDATES_FAILURE === $log_entry['action'] ) {
				$status = 'failure';
				break;
			}
			if ( self::PLUGIN_UPDATE_FAILURE_AND_ROLLBACK === $log_entry['action'] ) {
				$status = 'failure-and-rollback';
				break;
			}
			if ( self::PLUGIN_UPDATE_FAILURE_AND_ROLLBACK_FAIL === $log_entry['action'] ) {
				$status = 'failure-and-rollback-fail';
				break;
			}
		}

		return array(
			'last_run_timestamp' => 'in-progress' === $status ? null : $timestamp,
			'last_run_status'    => $status,
		);
	}

	/**
	 * Replaces the logs with the old schedule ID with new ones.
	 *
	 * @param string $old_schedule_id The old schedule ID.
	 * @param string $new_schedule_id The new schedule ID.
	 */
	public static function replace_logs_schedule_id( $old_schedule_id, $new_schedule_id ) {
		if ( $old_schedule_id === $new_schedule_id ) {
			return;
		}

		$logs = get_option( self::OPTION_NAME, array() );

		if ( isset( $logs[ $old_schedule_id ] ) ) {
			// Replace the logs with the old schedule ID with new ones.
			$logs[ $new_schedule_id ] = $logs[ $old_schedule_id ];
			unset( $logs[ $old_schedule_id ] );

			update_option( self::OPTION_NAME, $logs );
		}
	}

	/**
	 * Deletes the logs for a schedule ID when the current request is a DELETE request.
	 *
	 * @param string           $schedule_id The ID of the schedule to delete.
	 * @param object           $event       The deleted event object.
	 * @param \WP_REST_Request $request     The request object.
	 */
	public static function delete_logs_schedule_id( $schedule_id, $event, $request ) {
		if ( $request->get_method() === \WP_REST_Server::DELETABLE ) {
			self::clear( $schedule_id );
		}
	}

	/**
	 * Registers the last_run_timestamp field for the update-schedule REST API.
	 */
	public static function add_log_fields() {
		register_rest_field(
			'update-schedule',
			'last_run_timestamp',
			array(
				/**
				 * Populates the last_run_timestamp field.
				 *
				 * @param array $item Prepared response array.
				 * @return int|null
				 */
				'get_callback' => function ( $item ) {
					$status = static::infer_status_from_logs( $item['schedule_id'] );

					return $status['last_run_timestamp'] ?? null;
				},
				'schema'       => array(
					'description' => 'Unix timestamp (UTC) for when the last run occurred.',
					'type'        => 'integer',
				),
			)
		);

		register_rest_field(
			'update-schedule',
			'last_run_status',
			array(
				/**
				 * Populates the last_run_status field.
				 *
				 * @param array $item Prepared response array.
				 * @return string|null
				 */
				'get_callback' => function ( $item ) {
					$status = static::infer_status_from_logs( $item['schedule_id'] );

					return $status['last_run_status'] ?? null;
				},
				'schema'       => array(
					'description' => 'Status of last run.',
					'type'        => 'string',
					'enum'        => array( 'success', 'failure-and-rollback', 'failure-and-rollback-fail' ),
				),
			)
		);
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
}
