<?php
/**
 * The site-level half of the Store section's availability.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Whether the site offers the Store section, read by the dashboard and by sync.
 *
 * A class, not a function in dashboard-policy.php: the autoloader always loads the newest copy of a
 * class, while a second copy of the package can load an older function file first.
 */
final class Store_Section_Policy {

	/**
	 * Name of the feature flag that shows the Store section.
	 */
	const FLAG = 'premium-analytics-store-section';

	/**
	 * Whether the site offers the Store section, before any check on the reader.
	 *
	 * The site's own opt-in needs the Store flag; the blog sticker and the
	 * `jetpack_premium_analytics_enabled` filter leave the option off and keep every section.
	 *
	 * @return bool
	 */
	public static function is_offered() {
		if ( ! get_option( Enablement_Setting::ENABLED_OPTION ) ) {
			return true;
		}

		// Jetpack configures sync before Analytics::boot_shared_services() registers the flags, and an unregistered flag reads false.
		if ( null === Feature_Flags::get( self::FLAG ) ) {
			if ( ! function_exists( __NAMESPACE__ . '\\register_dashboard_feature_flags' ) ) {
				require_once __DIR__ . '/dashboard-policy.php';
			}
			register_dashboard_feature_flags();
		}

		return Feature_Flags::is_enabled( self::FLAG );
	}
}
