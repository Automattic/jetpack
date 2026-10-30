<?php
/**
 * The rule that decides whether Stats v2 boots on a Jetpack site.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;

/**
 * Whether Stats v2 should boot on a Jetpack site, where {@see Enablement_Setting} is only the stored opt-in.
 *
 * WordPress.com Simple decides on its own and only answers the filter below.
 *
 * @since $$next-version$$
 */
final class Enablement {

	/**
	 * Whether Stats v2 should boot. It reads what the Stats module collects, so it stays off while the module is.
	 *
	 * Once classic Stats is retired, a site with no connection boots it anyway: the module turns on only with the connection, which Stats v2 then offers.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$replaces_pre_connection_page = Classic_Stats::is_retired() && ! ( new Connection_Manager() )->is_connected();
		if ( ! $replaces_pre_connection_page && ! ( new Modules() )->is_active( 'stats' ) ) {
			return false;
		}

		/**
		 * Filters whether the bundled Premium Analytics dashboard is enabled.
		 *
		 * Read on `plugins_loaded`, while the Stats module is active or a site with no connection has
		 * retired classic Stats. Register this from a mu-plugin or a plugin's main file: a callback
		 * added on `plugins_loaded` or later runs too late.
		 *
		 * @since jetpack-16.1
		 *
		 * @param bool $enabled Defaults to the `jetpack_premium_analytics_enabled` option (false), or true once the classic Stats page is retired.
		 */
		return (bool) apply_filters(
			'jetpack_premium_analytics_enabled',
			// A site that once switched Stats v2 off would otherwise be left with no Stats page.
			Classic_Stats::is_retired() || (bool) get_option( Enablement_Setting::ENABLED_OPTION )
		);
	}
}
