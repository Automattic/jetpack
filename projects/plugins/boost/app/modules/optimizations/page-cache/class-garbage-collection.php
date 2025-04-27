<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;

class Garbage_Collection {
	const ACTION = 'jetpack_boost_cache_garbage_collection';

	/**
	 * Register hooks.
	 */
	public static function setup() {
		add_action( self::ACTION, array( self::class, 'garbage_collect' ) );

		// Clear old log files when garbage collection is run. Do not pass the $older_than parameter to the method as it's not supported.
		add_action( self::ACTION, array( Logger::class, 'delete_old_logs' ), 10, 0 );
	}

	public static function schedule_single_garbage_collection() {
		$older_than = time();
		wp_schedule_single_event( $older_than, self::ACTION, array( 'older_than' => $older_than ) );
	}

	/**
	 * Garbage collect expired files.
	 *
	 * @param int|null $older_than The timestamp before which files should be deleted. If not provided, the files older than default cache duration will be deleted.
	 */
	public static function garbage_collect( $older_than = null ) {
		$cache_ttl = JETPACK_BOOST_CACHE_DURATION;

		/*
		 * If an $older_than value is specified, use it to calculate the cache TTL.
		 * By specifying $older_than, you can instruct garbage collection to apply on files created before a certain point in time.
		 * This ensures garbage collection is not clearing files that were created after the request was made. Useful to avoid race conditions.
		 */
		if ( $older_than !== null ) {
			$cache_ttl = time() - $older_than;
		}

		$cache = new Boost_Cache();
		$cache->get_storage()->garbage_collect( $cache_ttl );
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
