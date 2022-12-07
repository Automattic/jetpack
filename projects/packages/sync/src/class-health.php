<?php
/**
 * Health class.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Health class.
 */
class Health {

	/**
	 * Prefix of the blog lock transient.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_OPTION = 'sync_health_status';

	/**
	 * Status key in option array.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const OPTION_STATUS_KEY = 'status';

	/**
	 * Timestamp key in option array.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_KEY = 'timestamp';

	/**
	 * Unknown status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_UNKNOWN = 'unknown';

	/**
	 * Disabled status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_DISABLED = 'disabled';

	/**
	 * Out of sync status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_OUT_OF_SYNC = 'out_of_sync';

	/**
	 * In sync status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_IN_SYNC = 'in_sync';

	/**
	 * If sync is active, Health-related hooks will be initialized after plugins are loaded.
	 */
	public static function init() {
		add_action( 'jetpack_full_sync_end', array( __ClASS__, 'full_sync_end_update_status' ), 10, 2 );
	}

	/**
	 * Gets health status code.
	 *
	 * @return string Sync Health Status
	 */
	public static function get_status() {
		$status = \Jetpack_Options::get_option( self::STATUS_OPTION );

		if ( false === $status || ! is_array( $status ) || empty( $status[ self::OPTION_STATUS_KEY ] ) ) {
			return self::STATUS_UNKNOWN;
		}

		switch ( $status[ self::OPTION_STATUS_KEY ] ) {
			case self::STATUS_DISABLED:
			case self::STATUS_OUT_OF_SYNC:
			case self::STATUS_IN_SYNC:
				return $status[ self::OPTION_STATUS_KEY ];
			default:
				return self::STATUS_UNKNOWN;
		}

	}

	/**
	 * When the Jetpack plugin is upgraded, set status to disabled if sync is not enabled,
	 * or to unknown, if the status has never been set before.
	 */
	public static function on_jetpack_upgraded() {
		if ( ! Settings::is_sync_enabled() ) {
			self::update_status( self::STATUS_DISABLED );
			return;
		}
		if ( false === self::is_status_defined() ) {
			self::update_status( self::STATUS_UNKNOWN );
		}
	}

	/**
	 * When the Jetpack plugin is activated, set status to disabled if sync is not enabled,
	 * or to unknown.
	 */
	public static function on_jetpack_activated() {
		if ( ! Settings::is_sync_enabled() ) {
			self::update_status( self::STATUS_DISABLED );
			return;
		}
		self::update_status( self::STATUS_UNKNOWN );
	}

	/**
	 * Updates sync health status with either a valid status, or an unknown status.
	 *
	 * @param string $status Sync Status.
	 *
	 * @return bool True if an update occoured, or false if the status didn't change.
	 */
	public static function update_status( $status ) {
		if ( self::get_status() === $status ) {
			return false;
		}
		// Default Status Option.
		$new_status = array(
			self::OPTION_STATUS_KEY    => self::STATUS_UNKNOWN,
			self::OPTION_TIMESTAMP_KEY => microtime( true ),
		);

		switch ( $status ) {
			case self::STATUS_DISABLED:
			case self::STATUS_OUT_OF_SYNC:
			case self::STATUS_IN_SYNC:
				$new_status[ self::OPTION_STATUS_KEY ] = $status;
				break;
		}

		\Jetpack_Options::update_option( self::STATUS_OPTION, $new_status );
		return true;
	}

	/**
	 * Check if Status has been previously set.
	 *
	 * @return bool is a Status defined
	 */
	public static function is_status_defined() {
		$status = \Jetpack_Options::get_option( self::STATUS_OPTION );

		if ( false === $status || ! is_array( $status ) || empty( $status[ self::OPTION_STATUS_KEY ] ) ) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Update Sync Status if Full Sync ended of Posts
	 *
	 * @param string $checksum The checksum that's currently being processed.
	 * @param array  $range The ranges of object types being processed.
	 */
	public static function full_sync_end_update_status( $checksum, $range ) {
		if ( isset( $range['posts'] ) ) {
			self::update_status( self::STATUS_IN_SYNC );
		}
	}

	/**
	 * Check if we need to self-heal and attempt self-healing if we detect a failure state.
	 *
	 * @param string $queue_name The queue that's currently active.
	 *
	 * @return bool
	 */
	public static function maybe_selfheal( $queue_name = '' ) {
		if ( ! $queue_name ) {
			return false;
		}

		// TODO see if this is needed somewhere in the flow
		static $has_the_check_completed = false;

		if ( $has_the_check_completed ) {
			return false;
		}

		$has_the_check_completed = true;

		// TODO extract this block as class constants or configurable in settings
		$transient_queue_lock_name = 'jetpack_sync_selfheal_check_' . $queue_name;

		$queue_lag_threshold            = 600;
		$successful_sync_time_threshold = 600;

		$time_between_selfheal_checks = 5 * MINUTE_IN_SECONDS;

		// TODO last check transient to make configurable timeout

		$last_check_time = get_transient( $transient_queue_lock_name );

		/**
		 * Make sure that we only account for the transient if it's set and it has been less than 5 minutes since the last check.
		 *
		 * Doing this check, because some sites have trouble clearing out transients (and options) properly.
		 * Better safe than sorry.
		 */
		if ( $last_check_time && $last_check_time < $time_between_selfheal_checks ) {
			return false;
		}

		// Update the transient to contain the current time.
		set_transient( $transient_queue_lock_name, time(), $time_between_selfheal_checks );

		// Hold the debug information that we are going to report if needed in the end.
		$debug_information = array();

		/**
		 * Check when was the last time we successfully sent something from the queue.
		 *
		 * This block will early return with `true` if we're in a "success" state - we're sending things
		 * before the threshold has been reached. Otherwise, we'll continue with the checks to see if
		 * we need to take any further action.
		 */
		$last_successful_queue_send_time = get_option( Actions::LAST_SUCCESS_PREFIX . $queue_name, null );

		$debug_information['last_queue_send_time'] = $last_successful_queue_send_time;

		// Try to see if we're successfully sending things. If we are, we don't need to do further checks.
		if ( $last_successful_queue_send_time ) {
			$time_since_last_succesful_send = time() - $last_successful_queue_send_time;

			$debug_information['last_queue_send_time_delta'] = $time_since_last_succesful_send;

			// We're successfully sending stuff in the allotted time frame.
			if ( $time_since_last_succesful_send <= $successful_sync_time_threshold ) {
				return true;
			}
		}

		/**
		 * We're not successfully sending data in the allotted time. Let's see if it's because of the queue
		 * not going as it should or maybe the queue itself is empty.
		 *
		 * If the queue is empty or the queue lag has not reached a specified threshold, we'll do an early exit, as
		 * this is considered a "success" state.
		 */

		// Initialize the queue, so we can check some of its properties.
		$queue      = new Queue( $queue_name );
		$queue_lag  = $queue->lag();
		$queue_size = $queue->size();

		if ( $queue_size === 0 || $queue_lag < $queue_lag_threshold ) {
			// The queue is either empty, or the queue lag is still not in the dangerous zone.
			return true;
		}

		$debug_information['queue_lag']  = $queue_lag;
		$debug_information['queue_size'] = $queue_size;

		/**
		 * Queue lag has reached the threshold levels, which means we're having trouble sending events from the queue.
		 * Let's try to remedy those issues and hope it fixes itself.
		 */

		$debug_information['before_reset'] = Actions::get_debug_details();

		// Reset locks
		Actions::reset_sync_locks( true );

		/**
		 * Dedicated Sync has some issues here and there, let's try to disable it to see if we can fix the issue.
		 */
		if ( Settings::is_dedicated_sync_enabled() ) {
			// Attempt to spawn dedicated sync if it is enabled and last successful send time is way too old.
			// Record the dedicated attempt

			// Disable dedicated sync
			Dedicated_Sender::on_dedicated_sync_lag_not_sending_threshold_reached();
		}

		$debug_information['after_reset'] = Actions::get_debug_details();

		/**
		 * Inform that we had performed self-healing to gather some data and identify failure cases that
		 * we can use to investigate more nuanced issues that come from specific setups.
		 */
		$data = array(
			'timestamp'      => microtime( true ),

			// Send the flow type that was attempted.
			'sync_flow_type' => 'dedicated',
			'debug_details'  => $debug_information,
		);

		$sender = Sender::get_instance();

		$sender->send_action( 'jetpack_sync_selfheal_attempt', $data );

		return false;
	}
}
