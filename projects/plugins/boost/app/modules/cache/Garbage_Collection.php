<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Logger;

class Garbage_Collection {
	const ACTION        = 'jetpack_boost_cache_garbage_collection';
	const INTERVAL_NAME = 'jetpack_boost_cache_gc_interval';

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_filter( 'cron_schedules', array( self::class, 'add_cron_interval' ) );

		$cache = new Boost_Cache();
		add_action( self::ACTION, array( $cache->get_storage(), 'garbage_collect' ) );
		add_action( self::ACTION, array( Logger::class, 'delete_old_logs' ) );
	}

	/**
	 * Setup the garbage collection cron job.
	 */
	public static function install() {
		self::init();

		if ( ! wp_next_scheduled( self::ACTION ) ) {
			wp_schedule_event( time(), self::INTERVAL_NAME, self::ACTION );
		}
	}

	/**
	 * Remove the garbage collection cron job.
	 */
	public static function uninstall() {
		wp_clear_scheduled_hook( self::ACTION );
	}

	/**
	 * Register a custom interval for garbage collection cron jobs.
	 */
	public static function add_cron_interval( $schedules ) {
		$schedules[ self::INTERVAL_NAME ] = array(
			'interval' => 900,
			'display'  => __( 'Every 15 minutes', 'jetpack-boost' ),
		);

		return $schedules;
	}
}
