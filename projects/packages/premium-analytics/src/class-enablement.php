<?php
/**
 * The rule that decides whether Stats v2 boots on a connected site.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Modules;

/**
 * Whether Stats v2 should boot on a connected site, where {@see Enablement_Setting} is only the stored opt-in.
 *
 * WordPress.com Simple decides on its own and only answers the filter below.
 *
 * @since $$next-version$$
 */
final class Enablement {

	/**
	 * Whether Stats v2 should boot. It reads what the Stats module collects, so it stays off while the module is.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		if ( ! ( new Modules() )->is_active( 'stats' ) ) {
			return false;
		}

		/**
		 * Filters whether the bundled Premium Analytics dashboard is enabled.
		 *
		 * Read on `plugins_loaded`, and only while the Stats module is active. Register this from a
		 * mu-plugin or a plugin's main file: a callback added on `plugins_loaded` or later runs too late.
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
