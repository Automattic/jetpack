<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;

class Garbage_Collection {
	const ACTION        = 'jetpack_boost_cache_garbage_collection';
	const INTERVAL_NAME = 'jetpack_boost_cache_gc_interval';

	/**
	 * Register hooks.
	 */
	public static function setup() {
		add_action( self::ACTION, array( self::class, 'garbage_collect' ) );
		add_action( self::ACTION, array( Logger::class, 'delete_old_logs' ) );
	}

	public static function schedule_single_garbage_collection() {
		wp_schedule_single_event( time(), self::ACTION, array( 'created_before' => time() ) );
	}

	public static function garbage_collect( $created_before = null ) {
		$cache = new Boost_Cache();
		$cache->get_storage()->garbage_collect( $created_before );
	}

	/**
	 * Setup the garbage collection cron job.
	 */
	public static function activate() {
		self::setup();

		if ( ! wp_next_scheduled( self::ACTION ) ) {
			wp_schedule_event( time(), 'hourly', self::ACTION );
		}
	}

	/**
	 * Remove the garbage collection cron job.
	 */
	public static function deactivate() {
		wp_clear_scheduled_hook( self::ACTION );
	}
}
