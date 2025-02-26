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
	 * Option name for storing the last execution timestamp for each cron hook.
	 * Stores an array of hook => timestamp pairs.
	 * Default value for each hook is 0 (never executed).
	 */
	const OPTION_CRON_EXECUTED = 'jetpack_boost_network_cron_executed';

	/**
	 * Option name for storing the recurrence setting for each cron hook.
	 * Stores an array of hook => recurrence pairs.
	 * Default value for each hook is 'daily'.
	 * Valid values are any registered WordPress cron schedule (e.g., 'hourly', 'daily', 'twicedaily').
	 */
	const OPTION_CRON_RECURRENCE = 'jetpack_boost_network_cron_recurrence';

	/**
	 * Setup the scheduled event that is needed for the network cron to work.
	 */
	public function setup() {
		add_action( 'jetpack_boost_network_cron', array( $this, 'execute' ), 10, 2 );
	}

	/**
	 * Get the timestamp of the last time the cron was executed.
	 *
	 * @param string $hook The hook to get the cron executed timestamp for.
	 *
	 * @return int The timestamp of the last time the cron was executed. Default 0 if never executed.
	 */
	public static function get_cron_executed( string $hook ) {
		$cron_executed = get_site_option( self::OPTION_CRON_EXECUTED, array() );
		return $cron_executed[ $hook ] ?? 0;
	}

	/**
	 * Get the recurrence of the cron.
	 *
	 * @param string $hook The hook to get the cron recurrence for.
	 *
	 * @return string The recurrence of the cron. Default 'daily' if never set.
	 */
	public static function get_cron_recurrence( string $hook ) {
		$cron_recurrence = get_site_option( self::OPTION_CRON_RECURRENCE, array() );
		return $cron_recurrence[ $hook ] ?? 'daily';
	}

	/**
	 * Get the interval of the cron recurrence.
	 *
	 * @param string $hook The hook to get the cron recurrence interval for.
	 *
	 * @return int The interval of the cron recurrence. Default 0 if never set.
	 */
	public static function get_cron_recurrence_interval( string $hook ) {
		$schedule            = wp_get_schedules();
		$recurrence          = self::get_cron_recurrence( $hook );
		$schedule_recurrence = $schedule[ $recurrence ] ?? array( 'interval' => 0 );
		return $schedule_recurrence['interval'] ?? 0;
	}

	/**
	 * Set the timestamp of the last time the cron was executed.
	 *
	 * @param string $hook The hook to set the cron executed timestamp for.
	 * @param int    $timestamp The timestamp to set the cron executed timestamp to.
	 *
	 * @return bool True if the cron executed timestamp was set, false if it was already set.
	 */
	public static function set_cron_executed( string $hook, int $timestamp ) {
		$cron_executed          = get_site_option( self::OPTION_CRON_EXECUTED, array() );
		$cron_executed[ $hook ] = $timestamp;

		return update_site_option( self::OPTION_CRON_EXECUTED, $cron_executed );
	}

	/**
	 * Validates if the given recurrence schedule is valid.
	 *
	 * @param string $recurrence The recurrence schedule to validate.
	 * @return bool True if the recurrence is valid, false otherwise.
	 */
	private static function is_valid_recurrence( string $recurrence ) {
		$schedules = wp_get_schedules();
		return isset( $schedules[ $recurrence ] );
	}

	/**
	 * Set the recurrence of the cron.
	 *
	 * @param string $hook The hook to set the cron recurrence for.
	 * @param string $recurrence The recurrence to set. Must be a valid WordPress cron schedule
	 *                          (e.g., 'hourly', 'daily', 'twicedaily').
	 *                          Invalid values will fall back to 'daily'.
	 *
	 * @return bool True if the cron recurrence was set, false if it was already set or invalid.
	 */
	public static function set_cron_recurrence( string $hook, string $recurrence ) {
		if ( ! self::is_valid_recurrence( $recurrence ) ) {
			$recurrence = 'daily';
		}

		$cron_recurrence          = get_site_option( self::OPTION_CRON_RECURRENCE, array() );
		$cron_recurrence[ $hook ] = $recurrence;

		return update_site_option( self::OPTION_CRON_RECURRENCE, $cron_recurrence );
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
			self::set_cron_recurrence( $hook, $recurrence );

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

		// We can safely delete the site options here because we know no network crons will be scheduled after this.
		delete_site_option( self::OPTION_CRON_EXECUTED );
		delete_site_option( self::OPTION_CRON_RECURRENCE );
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
		// We need to fetch the interval of the schedule add it to the current time to see if the cronjob has already run within the last $interval seconds.
		$interval = self::get_cron_recurrence_interval( $action );

		$current_time = time();
		$tester_ran   = self::get_cron_executed( $action );
		// If the cronjob has already run within the last $interval seconds, bail.
		if ( $tester_ran + $interval > $current_time ) {
			return;
		}

		self::set_cron_executed( $action, $current_time );

		do_action( $action, ...$args );
	}
}
