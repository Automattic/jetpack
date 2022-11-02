<?php
/**
 * Stats Main
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\StatsAdmin;

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
	 * Mostly needed for backwards compatibility.
	 */
	const STATS_VERSION = '9';

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
		// These shouldn't be initialized with the main API, just to be easier for the PoC.
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		( new Dashboard() )->init_hooks();
	}
}
