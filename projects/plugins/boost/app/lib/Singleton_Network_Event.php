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
	 * Setup the scheduled event that is needed for the network cron to work.
	 */
	public function setup() {
		add_action( 'jetpack_boost_network_cron', array( $this, 'execute' ), 10, 2 );
	}

	/**
	 * Schedules a network-wide cronjob if not already scheduled.
	 *
	 * @param int    $timestamp The timestamp to schedule the cronjob at.
	 * @param string $recurrence The recurrence of the cronjob.
	 * @param string $hook The hook to schedule the cronjob for.
	 * @param array  $args The arguments to pass to the action.
	 *
	 * @return bool True if the cronjob was scheduled, false if it was already scheduled.
	 */
	public static function schedule( int $timestamp, string $recurrence, string $hook, array $args = array() ) {
		if ( false === wp_next_scheduled( 'jetpack_boost_network_cron', array( $hook, $args ) ) ) {
			// We save the recurrence to the site option so we don't need it when unscheduling the specific cron event.
			update_site_option( "{$hook}_network_cron_recurrence", $recurrence );

			wp_schedule_event( $timestamp, $recurrence, 'jetpack_boost_network_cron', array( $hook, $args ) );
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
	public static function unschedule_all() {
		wp_unschedule_hook( 'jetpack_boost_network_cron' );
	}

	/**
	 * Schedules a network-wide cronjob that is only ran once per network instead of per site.
	 * Also is compatible with non multisite installs.
	 * Schedule_Event::schedule should be used to call this.
	 *
	 * @param string $action The action to schedule.
	 * @param array  $args The arguments to pass to the action.
	 */
	public static function execute( string $action, array $args = array() ) {
		$recurrence = get_site_option( "{$action}_network_cron_recurrence", 'daily' );

		// We need to fetch the interval of the schedule add it to the current time to see if the cronjob has already run within the last $interval seconds.
		$schedule            = wp_get_schedules();
		$schedule_recurrence = $schedule[ $recurrence ] ?? array( 'interval' => 0 );
		$interval            = $schedule_recurrence['interval'];

		$current_time = time();
		$tester_ran   = (int) get_site_option( "{$action}_network_cron_ran", 0 );
		// If the cronjob has already run within the last $interval seconds, bail.
		if ( $tester_ran + $interval > $current_time ) {
			return;
		}

		update_site_option( "{$action}_network_cron_ran", $current_time );

		do_action( $action, ...$args );
	}
}
