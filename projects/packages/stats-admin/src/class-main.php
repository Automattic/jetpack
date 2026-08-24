<?php
/**
 * Stats Main
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status\Host;
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
	const VERSION = '0.33.0';

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
		add_action( 'rest_api_init', array( REST_Controller::class, 'register' ) );
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

		// Register stats-admin transient prefix for cleanup by the stats package.
		add_filter( 'jetpack_stats_transient_cleanup_prefixes', array( $this, 'register_transient_cleanup_prefix' ) );

		if ( self::needs_own_dashboard() ) {
			Dashboard::init();
		}
	}

	/**
	 * Whether the site can talk to WordPress.com.
	 *
	 * Simple sites always can, and hold no Jetpack blog token to check.
	 *
	 * @return bool
	 */
	public static function is_site_connected() {
		return ( new Host() )->is_wpcom_simple() || ( new Manager( 'jetpack' ) )->is_connected();
	}

	/**
	 * Whether Stats has to register its own dashboard because nothing else will.
	 *
	 * The Jetpack plugin registers the Stats menu from its stats module, and modules are not
	 * loaded until the site is connected. Registering the dashboard here keeps Stats reachable
	 * before that happens, where the app offers a plan and drives the connection itself.
	 *
	 * @return bool
	 */
	private static function needs_own_dashboard() {
		return ! self::is_site_connected();
	}

	/**
	 * Register the stats-admin transient prefix for cleanup.
	 *
	 * @param array $prefixes List of transient prefixes to clean up.
	 * @return array Modified list of prefixes.
	 */
	public function register_transient_cleanup_prefix( $prefixes ) {
		$prefixes[] = WPCOM_Client::CACHE_TRANSIENT_PREFIX;
		return $prefixes;
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
