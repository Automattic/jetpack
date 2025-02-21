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
	 *
	 * @return bool True if the cronjob was scheduled, false if it was already scheduled.
	 */
	public static function schedule_singleton_network_cron( int $timestamp, string $recurrence, string $hook, array $args = array() ) {
		if ( false === wp_next_scheduled( 'jetpack_boost_network_cron', array( $hook, $args ) ) ) {
			// We save the recurrence to the site option so we don't need it when unscheduling the specific cron event.
			update_site_option( "{$hook}_network_cron_recurrence", $recurrence );

			self::subscribe_to_network_cron( $hook );

			wp_schedule_event( $timestamp, $recurrence, 'jetpack_boost_network_cron', array( $hook, $args ) );
			return true;
		}
		return false;
	}

	/**
	 * Unschedule a singleton network cronjob.
	 *
	 * @param string $hook The hook to unschedule the cronjob for.
	 * @param array  $args The arguments to pass to the action.
	 */
	public static function unschedule_singleton_network_cron( string $hook, array $args = array() ) {
		// Unschedule the network cron event
		wp_clear_scheduled_hook( 'jetpack_boost_network_cron', array( $hook, $args ) );

		if ( empty( self::unsubscribe_from_network_cron( $hook ) ) ) {
			// Remove the site options used to track the last run time and recurrence if this was the last blog subscribed to the network cron.
			delete_site_option( "{$hook}_network_cron_ran" );
			delete_site_option( "{$hook}_network_cron_recurrence" );
			delete_site_option( "{$hook}_network_cron_blogs_subscribed" );
		}
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

	/**
	 * Subscribes the current blog to the network cron.
	 *
	 * @param string $hook The hook to subscribe to.
	 */
	private static function subscribe_to_network_cron( string $hook ) {
		$blogs_subscribed                          = get_site_option( "{$hook}_network_cron_blogs_subscribed", array() );
		$blogs_subscribed[ get_current_blog_id() ] = true;
		update_site_option( "{$hook}_network_cron_blogs_subscribed", $blogs_subscribed );
	}

	/**
	 * Unsubscribes the current blog from the network cron.
	 *
	 * @param string $hook The hook to unsubscribe from.
	 *
	 * @return array The list of blogs that are *still* subscribed to the network cron after unsubscribing the current blog.
	 */
	private static function unsubscribe_from_network_cron( string $hook ) {
		$blogs_subscribed = get_site_option( "{$hook}_network_cron_blogs_subscribed", array() );
		unset( $blogs_subscribed[ get_current_blog_id() ] );
		update_site_option( "{$hook}_network_cron_blogs_subscribed", $blogs_subscribed );

		return array_keys( $blogs_subscribed );
	}
}
