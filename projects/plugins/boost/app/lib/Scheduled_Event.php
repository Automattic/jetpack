<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;

class Scheduled_Event implements Has_Setup {
	/**
	 * Setup the scheduled event that is needed for the network cron to work.
	 */
	public function setup() {
		add_action( 'jetpack_boost_network_cron', array( $this, 'execute_network_cron' ), 10, 2 );
	}

	/**
	 * Schedules a network-wide cronjob if not already scheduled.
	 *
	 * @param int    $timestamp The timestamp to schedule the cronjob at.
	 * @param string $recurrence The recurrence of the cronjob.
	 * @param string $hook The hook to schedule the cronjob for.
	 * @param array  $args The arguments to pass to the action.
	 */
	public static function schedule_singleton_network_cron( int $timestamp, string $recurrence, string $hook, array $args = array() ) {
		if ( false === wp_next_scheduled( $hook, $args ) ) {
			// We save the recurrence to the site option so we don't need it when unscheduling the specific cron event.
			update_site_option( "{$hook}_network_cron_recurrence", $recurrence );

			wp_schedule_event( $timestamp, $recurrence, 'jetpack_boost_network_cron', array( $hook, $args ) );
		}
	}

	/**
	 * Unschedule a singleton network cronjob.
	 *
	 * @param string $hook The hook to unschedule the cronjob for.
	 * @param array  $args The arguments to pass to the action.
	 */
	public static function unschedule_singleton_network_cron( string $hook, array $args = array() ) {
		// Remove the site options used to track the last run time and recurrence.
		delete_site_option( "{$hook}_network_cron_ran" );
		delete_site_option( "{$hook}_network_cron_recurrence" );

		// Unschedule the network cron event
		wp_clear_scheduled_hook( 'jetpack_boost_network_cron', array( $hook, $args ) );
	}

	/**
	 * Schedules a network-wide cronjob that is only ran once per network instead of per site.
	 * Also is compatible with non multisite installs.
	 * Schedule_Event::schedule_singleton_network_cron should be used to call this.
	 *
	 * @param string $action The action to schedule.
	 * @param array  $args The arguments to pass to the action.
	 */
	public static function execute_network_cron( string $action, array $args = array() ) {
		$recurrence          = get_site_option( "{$action}_network_cron_recurrence", 'daily' );
		$schedule            = wp_get_schedules();
		$schedule_recurrence = $schedule[ $recurrence ] ?? array( 'interval' => 0 );
		$interval            = $schedule_recurrence['interval'];
		$current_time        = time();

		$tester_ran = (int) get_site_option( "{$action}_network_cron_ran", 0 );
		// If the cronjob has already run within the last $interval seconds, bail.
		if ( $tester_ran + $interval > $current_time ) {
			return;
		}

		update_site_option( "{$action}_network_cron_ran", $current_time );

		do_action( $action, ...$args );
	}
}
