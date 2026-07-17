<?php
/**
 * Jetpack Connection configuration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Config;

/**
 * Registers Premium Analytics as a consumer of the shared Jetpack Connection.
 */
class Connection_Configuration {

	/**
	 * Configure the shared Jetpack Connection for Premium Analytics.
	 *
	 * @return void
	 */
	public static function configure() {
		$config = new Config();
		$config->ensure( 'connection', self::get_jetpack_connection_config() );
	}

	/**
	 * Get the Premium Analytics connection configuration.
	 *
	 * @return array Jetpack Connection config array.
	 */
	private static function get_jetpack_connection_config() {
		return array(
			'slug' => defined( 'JETPACK_PREMIUM_ANALYTICS_SLUG' ) ? JETPACK_PREMIUM_ANALYTICS_SLUG : 'jetpack-premium-analytics',
			'name' => defined( 'JETPACK_PREMIUM_ANALYTICS_NAME' ) ? JETPACK_PREMIUM_ANALYTICS_NAME : 'Premium Analytics',
		);
	}
}
