<?php
/**
 * Jetpack Stats front-end tracking configuration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Stats\Main as Stats_Main;

/**
 * Configures the existing Jetpack Stats front-end tracking pipeline.
 */
class Jetpack_Stats_Tracker {

	/**
	 * Whether the tracker has been configured.
	 *
	 * @var bool
	 */
	private static $configured = false;

	/**
	 * Initialize Stats tracking and its standalone module lifecycle.
	 *
	 * @return void
	 */
	public static function configure() {
		if ( self::$configured ) {
			return;
		}

		self::$configured = true;

		add_filter( 'jetpack_get_available_standalone_modules', array( static::class, 'add_stats_module' ) );
		add_action( 'jetpack_site_registered', array( static::class, 'activate_stats_module' ) );

		if ( did_action( 'plugins_loaded' ) ) {
			Stats_Main::init();
			self::activate_stats_module_if_connected();
		} else {
			$config = new Config();
			$config->ensure( 'stats' );
			add_action( 'plugins_loaded', array( static::class, 'activate_stats_module_if_connected' ) );
		}
	}

	/**
	 * Make Stats available to the module controller when Jetpack is not installed.
	 *
	 * @param array $modules Available standalone module slugs.
	 * @return array
	 */
	public static function add_stats_module( $modules ) {
		$modules[] = 'stats';

		return array_values( array_unique( $modules ) );
	}

	/**
	 * Activate Stats for a connected standalone Premium Analytics site.
	 *
	 * @return void
	 */
	public static function activate_stats_module_if_connected() {
		if ( ( new Connection_Manager() )->is_connected() ) {
			self::activate_stats_module();
		}
	}

	/**
	 * Activate Stats in standalone mode without redirecting or ending the request.
	 *
	 * @return void
	 */
	public static function activate_stats_module() {
		// When Jetpack is active, respect its Stats module setting.
		if ( static::is_jetpack_plugin_active() ) {
			return;
		}

		( new Modules() )->activate( 'stats', false, false );
	}

	/**
	 * Whether the Jetpack plugin is active and owns the Stats module setting.
	 *
	 * @return bool
	 */
	protected static function is_jetpack_plugin_active() {
		return class_exists( 'Jetpack' );
	}
}
