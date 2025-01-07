<?php
/**
 * Stats Main
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Tracking;

/**
 * Stats Main class.
 *
 * Entrypoint for Stats.
 *
 * @since 0.1.0
 */
class Main {
	/**
	 * Stats version.
	 */
	const VERSION = '0.24.0';

	/**
	 * Singleton Main instance.
	 *
	 * @var Main
	 **/
	private static $instance = null;

	/**
	 * Initializer.
	 * Used to configure the stats package, eg when called via the Config package.
	 *
	 * @return object
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new Main();
		}

		return self::$instance;
	}

	/**
	 * Class constructor.
	 *
	 * @return void
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		// Disable JITM assets on the Stats page.
		// JITM is handled separately by Stats: https://github.com/Automattic/wp-calypso/pull/95273.
		add_filter(
			'jetpack_display_jitms_on_screen',
			function ( $show, $screen_id ) {
				if ( 'jetpack_page_stats' === $screen_id ) {
					return false;
				}
				return $show;
			},
			10,
			2
		);
	}

	/**
	 * Update New Stats status.
	 *
	 * @param bool $status true to enable or false to disable.
	 * @return bool
	 */
	public static function update_new_stats_status( $status ) {
		$status = (bool) $status;

		$stats_options = array(
			'enable_odyssey_stats'     => $status,
			'odyssey_stats_changed_at' => time(),
		);
		$updated       = Stats_Options::set_options( $stats_options );

		// Track the event.
		$event_name = 'calypso_stats_disabled';
		if ( $status ) {
			$event_name = 'calypso_stats_enabled';
		}
		$connection_manager = new Manager( 'jetpack' );
		$tracking           = new Tracking( 'jetpack', $connection_manager );
		$tracking->record_user_event( $event_name, array_merge( $stats_options, array( 'updated' => $updated ) ) );

		return $updated;
	}
}
