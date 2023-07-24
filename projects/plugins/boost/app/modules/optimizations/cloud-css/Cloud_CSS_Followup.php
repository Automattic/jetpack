<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

class Cloud_CSS_Followup {

	const SCHEDULER_HOOK = 'jetpack_boost_cloud_css_followup';

	/**
	 * Initiate the scheduler
	 *
	 * Whenever Cloud CSS module is setup, it will call this method.
	 *
	 * @return void
	 */
	public static function init() {
		/*
		 * Run the scheduled job
		 */
		add_action( self::SCHEDULER_HOOK, array( self::class, 'run' ) );
	}

	/**
	 * Run the cron job.
	 */
	public static function run() {
		$state = new Critical_CSS_State();
		if ( $state->has_errors() ) {
			$cloud_css = new Cloud_CSS();
			$cloud_css->regenerate_cloud_css();
		}
	}

	/**
	 * Add a cron-job to maintain cloud CSS
	 *
	 * @param int $when Timestamp of when to schedule the event.
	 *
	 * @return void
	 */
	public static function schedule() {
		// Remove any existing schedule
		self::unschedule();
		wp_schedule_single_event( time() + HOUR_IN_SECONDS, self::SCHEDULER_HOOK );
	}

	/**
	 * Remove the cron-job
	 */
	public static function unschedule() {
		wp_clear_scheduled_hook( self::SCHEDULER_HOOK );
	}
}
