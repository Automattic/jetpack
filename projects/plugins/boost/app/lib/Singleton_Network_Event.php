<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;

/**
 * Handles network-wide cron events that should only run once per network instead of per site.
 * This class is compatible with both multisite and single-site installations.
 *
 * In a multisite environment, this class ensures that any registered events are only executed
 * once per network with respect to the schedule's recurrence.
 * This prevents duplicate executions across subsites. For single-site
 * installations, it behaves like a regular scheduled event.
 *
 * @since $$next-version$$
 * @package Automattic\Jetpack_Boost\Lib
 *
 * @see wp_schedule_event()      For WordPress scheduling functionality
 * @see wp_next_scheduled()      For checking scheduled events
 * @see wp_unschedule_event()    For removing scheduled events
 */
class Singleton_Network_Event implements Has_Setup {
	/**
	 * Option name for storing the timestamp for when the cron should run next.
	 * Stores an array of hook => timestamp pairs.
	 * Default value for each hook is 0 (never executed).
	 */
	const OPTION_CRON_TO_EXECUTE = 'jetpack_boost_network_cron_to_execute';

	private static $is_filtering = false;

	/**
	 * Setup the scheduled event that is needed for the network cron to work.
	 */
	public function setup() {
		add_action( 'jetpack_boost_network_cron', array( $this, 'execute' ), 10, 2 );
		add_filter( 'pre_get_ready_cron_jobs', array( $this, 'filter_cron_jobs' ) );
	}

	/**
	 * Filters the list of ready cron jobs before they are processed.
	 *
	 * This method ensures that network-wide cron jobs are synchronized across the network.
	 * It compares the blog's cron schedule with the network-wide schedule and makes adjustments
	 * to the blog's cron schedule to ensure it runs at the appropriate time across the network.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $crons Array of cron jobs to be processed, where keys are timestamps and values are arrays of hooks scheduled for those times.
	 * @return array Modified array of cron jobs.
	 */
	public function filter_cron_jobs( $crons ) {
		if ( self::$is_filtering ) {
			return $crons;
		}

		// Prevent infinite loop as wp_get_ready_cron_jobs() calls this filter.
		self::$is_filtering = true;
		// If $crons is empty, get the cron jobs from the database.
		$crons              = empty( $crons ) ? wp_get_ready_cron_jobs() : $crons;
		self::$is_filtering = false;

		if ( empty( $crons ) ) {
			return $crons;
		}

		$crons_to_execute = get_site_option( self::OPTION_CRON_TO_EXECUTE, array() );
		if ( empty( $crons_to_execute ) ) {
			return $crons;
		}

		$now = time();

		$update_crons_to_execute = false;
		// $crons is an array of arrays, where the first level key is the timestamp, and the second level key is the hook.
		foreach ( $crons as $blog_timestamp_to_execute => $cronhooks ) {
			foreach ( $cronhooks as $hook => $hook_refs ) {
				if ( empty( $crons_to_execute[ $hook ] ) ) {
					// This cron is due but not a network cron, skip it.
					continue;
				}

				if ( $blog_timestamp_to_execute < DAY_IN_SECONDS ) {
					// If WordPress is indicating that the cron is due within a day of Unix, we assume this cron should be ran.
					// Plugins such as WP Crontrol may set the event as due within a day of Unix, to ensure it's ran.
					continue;
				}

				$hook_ref = current( $hook_refs );
				if ( $crons_to_execute[ $hook ] > $now ) {
					// Reschedule the blog's cronjob to run at the timestamp that was stored in the option.
					wp_unschedule_event( $blog_timestamp_to_execute, $hook, $hook_ref['args'] );
					wp_schedule_event( $crons_to_execute[ $hook ], $hook_ref['schedule'], $hook, $hook_ref['args'] );

					unset( $crons[ $blog_timestamp_to_execute ][ $hook ] );

					if ( empty( $crons[ $blog_timestamp_to_execute ] ) ) {
						// If this was the only cronjob for this timestamp, remove the timestamp key.
						unset( $crons[ $blog_timestamp_to_execute ] );
					}
				} else {
					// The blog's cronjob will run, update the timestamp to the next time it should run.
					$crons_to_execute[ $hook ] = $now + $hook_ref['interval'];
					$update_crons_to_execute   = true;
				}
			}
		}
		if ( $update_crons_to_execute ) {
			update_site_option( self::OPTION_CRON_TO_EXECUTE, $crons_to_execute );
		}

		return $crons;
	}

	/**
	 * Set the timestamp of the last time the cron was executed.
	 *
	 * @param string $hook The hook to set the cron executed timestamp for.
	 * @param int    $blog_timestamp_to_execute The timestamp to set the cron executed timestamp to.
	 *
	 * @return bool True if the cron executed timestamp was set, false if it was already set.
	 */
	public static function set_cron_to_execute( string $hook, int $blog_timestamp_to_execute ) {
		$cron_to_execute          = get_site_option( self::OPTION_CRON_TO_EXECUTE, array() );
		$cron_to_execute[ $hook ] = $blog_timestamp_to_execute;

		return update_site_option( self::OPTION_CRON_TO_EXECUTE, $cron_to_execute );
	}

	/**
	 * Helper function that schedules a network-wide cronjob if not already scheduled.
	 *
	 * @param int    $blog_timestamp_to_execute The timestamp to schedule the cronjob at.
	 * @param string $recurrence The recurrence of the cronjob.
	 * @param string $hook The hook to schedule the cronjob for.
	 * @param array  $args The arguments to pass to the action.
	 *
	 * @return bool True if the cronjob was scheduled, false if it was already scheduled.
	 */
	public static function schedule( int $blog_timestamp_to_execute, string $recurrence, string $hook, array $args = array() ) {
		if ( false === wp_next_scheduled( $recurrence, $args ) ) {
			self::set_cron_to_execute( $hook, $blog_timestamp_to_execute );

			wp_schedule_event( $blog_timestamp_to_execute, $recurrence, $hook, $args );
			return true;
		}
		return false;
	}

	/**
	 * Unschedules the network cron event for the specific blog.
	 *
	 * @param string $hook The hook to unschedule the cronjob for.
	 * @param array  $args The arguments to pass to the action.
	 */
	public static function unschedule( string $hook, array $args = array() ) {
		wp_clear_scheduled_hook( 'jetpack_boost_network_cron', array( $hook, $args ) );
	}

	/**
	 * Unschedules all network cron events.
	 */
	public static function clean_up() {
		// We can safely delete the site options here because we know no network crons will be scheduled after this.
		delete_site_option( self::OPTION_CRON_TO_EXECUTE );
	}
}
