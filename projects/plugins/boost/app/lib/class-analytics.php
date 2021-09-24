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
	 * Initialize tracking.
	 */
	public function init() {
		$tracks = self::get_tracking();

		// For tracking events via js/ajax.
		add_action( 'admin_enqueue_scripts', array( $tracks, 'enqueue_tracks_scripts' ) );

		// Universal ajax callback for all tracking events triggered via js.
		add_action( 'wp_ajax_jetpack_tracks', array( $tracks, 'ajax_tracks' ) );
	}

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
