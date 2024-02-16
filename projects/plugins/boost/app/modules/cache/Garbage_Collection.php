<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache;

class Garbage_Collection {
	const GARBAGE_COLLECTION_ACTION   = 'jetpack_boost_cache_garbage_collection';
	const GARBAGE_COLLECTION_INTERVAL = 'jetpack_boost_cache_gc_interval';

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_filter( 'cron_schedules', array( self::class, 'add_cron_interval' ) );

		$cache = new Boost_Cache();
		add_action( self::GARBAGE_COLLECTION_ACTION, array( $cache->get_storage(), 'garbage_collect' ) );
	}

	/**
	 * Setup the garbage collection cron job.
	 */
	public static function install() {
		self::init();

		if ( ! wp_next_scheduled( 'jetpack_boost_garbage_collection' ) ) {
			wp_schedule_event( time(), 'daily', 'jetpack_boost_garbage_collection' );
		}
	}

	/**
	 * Remove the garbage collection cron job.
	 */
	public static function uninstall() {
		wp_clear_scheduled_hook( 'jetpack_boost_garbage_collection' );
	}

	/**
	 * Register a custom interval for garbage collection cron jobs.
	 */
	public static function add_cron_interval( $schedules ) {
		$schedules[ self::GARBAGE_COLLECTION_INTERVAL ] = array(
			'interval' => 900,
			'display'  => __( 'Every 15 minutes', 'jetpack-boost' ),
		);

		return $schedules;
	}
}
