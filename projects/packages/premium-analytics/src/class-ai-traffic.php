<?php
/**
 * Whether a site gets the AI and bot traffic surfaces of Stats.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status\Host;

/**
 * Owns the AI tab's flag and the one check every AI and bot traffic surface reads.
 *
 * @since 0.19.0
 */
final class AI_Traffic {

	const FLAG = 'jetpack-stats-ai-tab';

	/**
	 * Filter through which the availability of the AI and bot traffic surfaces is resolved.
	 */
	const AVAILABLE_FILTER = 'jetpack_premium_analytics_ai_traffic_available';

	/**
	 * Register the flag, so feature-flag tooling lists it.
	 *
	 * @return void
	 */
	public static function register_feature_flag() {
		Feature_Flags::register(
			self::FLAG,
			array(
				'default'     => false,
				'description' => 'Show the AI tab in Stats, with the AI and bot traffic widgets, on sites that have edge request data.',
				'owner'       => 'jetpack-stats',
			)
		);
	}

	/**
	 * Whether the site has edge request data, which only VIP sites do so far.
	 *
	 * @return bool
	 */
	private static function site_has_edge_data() {
		return ( new Host() )->is_vip_site();
	}

	/**
	 * Whether the reader gets the AI and bot traffic surfaces.
	 *
	 * @return bool
	 */
	public static function is_available() {
		// Outside the filter, which answers only whether the site has the data.
		if ( ! Capabilities::current_user_can_view_stats() || ! Feature_Flags::is_enabled( self::FLAG ) ) {
			return false;
		}

		$is_available = self::site_has_edge_data();

		/**
		 * Filters whether the AI and bot traffic surfaces of Stats are available.
		 *
		 * @since 0.19.0
		 *
		 * @param bool $is_available Whether the site has edge request data.
		 */
		return (bool) apply_filters( self::AVAILABLE_FILTER, $is_available );
	}
}
