<?php

namespace Automattic\Jetpack_Boost\Lib;

class Super_Cache_Tracking {
	public static function setup() {
		add_action( 'jb_cache_moved_to_wpsc', array( __CLASS__, 'track_move_to_wpsc' ) );
	}

	/**
	 * Track when site owner moves cache to WPSC.
	 */
	public static function track_move_to_wpsc() {
		Analytics::record_user_event( 'moved_cache_to_wpsc' );
	}
}
