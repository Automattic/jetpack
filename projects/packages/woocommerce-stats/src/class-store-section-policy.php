<?php
/**
 * Whether the site offers the WooCommerce section.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\PremiumAnalytics\Enablement_Setting;
use function Automattic\Jetpack\PremiumAnalytics\is_woocommerce_dashboard_section_available_to_current_user;

/**
 * The WooCommerce section's flag and availability, read by the section and by sync.
 */
final class Store_Section_Policy {

	/**
	 * Name of the feature flag that shows the WooCommerce section.
	 */
	const FLAG = 'premium-analytics-store-section';

	/**
	 * Register the flag.
	 *
	 * Runs on every request so the flag stays discoverable wherever flags are read or toggled.
	 *
	 * @return void
	 */
	public static function register_flag() {
		Feature_Flags::register(
			self::FLAG,
			array(
				'default'     => false,
				'description' => 'Show the WooCommerce tab on the analytics dashboard of sites running WooCommerce.',
				'owner'       => 'jetpack-woocommerce-stats',
			)
		);
	}

	/**
	 * Whether the site offers the section, before any check on the reader.
	 *
	 * The site's own opt-in needs the flag; the blog sticker and the
	 * `jetpack_premium_analytics_enabled` filter leave the option off and keep every section.
	 *
	 * @return bool
	 */
	public static function is_offered() {
		return ! get_option( Enablement_Setting::ENABLED_OPTION ) || Feature_Flags::is_enabled( self::FLAG );
	}

	/**
	 * Whether the current reader is shown the section.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return self::is_offered() && is_woocommerce_dashboard_section_available_to_current_user();
	}
}
