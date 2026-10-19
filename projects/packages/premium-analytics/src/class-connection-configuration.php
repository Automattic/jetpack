<?php
/**
 * Jetpack Connection configuration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Plugin_Storage;

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

		self::maybe_refresh_stored_slug();
	}

	/**
	 * Ask the Connection package to rewrite its stored list of active connected plugins on the next POST.
	 *
	 * WordPress.com reads that synced list to decide whether to process WooCommerce Analytics data,
	 * and the Connection package only rewrites it after a plugin is activated or deactivated.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function refresh_stored_slugs() {
		if ( method_exists( Plugin_Storage::class, 'set_flag_to_refresh_active_connected_plugins' ) ) {
			Plugin_Storage::set_flag_to_refresh_active_connected_plugins();
		}
	}

	/**
	 * Request a refresh while the stored list lacks our slug, which enabling Premium Analytics inside Jetpack never adds.
	 *
	 * @return void
	 */
	private static function maybe_refresh_stored_slug() {
		$stored = get_option( Plugin_Storage::ACTIVE_PLUGINS_OPTION_NAME, array() );

		if ( is_array( $stored ) && array_key_exists( self::get_jetpack_connection_config()['slug'], $stored ) ) {
			return;
		}

		// Already pending: skip the write, since this runs on every request until a POST consumes it.
		if ( get_transient( Plugin_Storage::ACTIVE_PLUGINS_REFRESH_FLAG ) ) {
			return;
		}

		self::refresh_stored_slugs();
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
