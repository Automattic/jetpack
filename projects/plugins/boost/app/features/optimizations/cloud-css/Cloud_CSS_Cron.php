<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

class Cloud_CSS_Cron {

	const SCHEDULER_HOOK     = 'jetpack_boost_check_cloud_css';
	const SCHEDULER_INTERVAL = 'hourly';

	/**
	 * Initiate the scheduler
	 *
	 * Whenever Cloud CSS module is setup, it will call this method.
	 *
	 * @return void
	 */
	public static function init() {
		$cron = new self();

		/*
		 * If the cron-job is not scheduled, schedule it.
		 */
		$cron->install();

		/*
		 * Run the scheduled job
		 */
		add_action( self::SCHEDULER_HOOK, array( $cron, 'run' ) );
	}

	/**
	 * Run the cron job.
	 */
	public function run() {
		$state = new Critical_CSS_State( 'cloud' );

		if ( $state->is_fatal_error() ) {
			$client    = new Cloud_CSS_Request();
			$providers = $state->get_provider_urls_with_args();
			$client->request_generate( $providers );
		}
	}

	/**
	 * Add a cron-job to maintain cloud CSS
	 *
	 * @return void
	 */
	public function install() {
		if ( ! wp_next_scheduled( self::SCHEDULER_HOOK ) ) {
			wp_schedule_event( time(), self::SCHEDULER_INTERVAL, self::SCHEDULER_HOOK );
		}
	}

	/**
	 * Remove the cron-job
	 */
	public static function uninstall() {
		wp_clear_scheduled_hook( self::SCHEDULER_HOOK );
	}
}
