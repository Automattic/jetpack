<?php
/**
 * Simple wrapper for Tracks library
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Tracking;

/**
 * Class Analytics
 */
class Analytics {
	/**
	 * Get the tracking and manager objects for Boost.
	 */
	public static function get_tracking() {
		return new Tracking( 'jetpack_boost', new Manager( 'jetpack-boost' ) );
	}

	/**
	 * Record a user event.
	 *
	 * @param string $slug The event slug.
	 * @param array  $data Optional event data.
	 */
	public static function record_user_event( $slug, $data = array() ) {
		return self::get_tracking()->record_user_event( $slug, $data );
	}
}
