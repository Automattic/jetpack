<?php
/**
 * Consent management for WP Consent API integration
 *
 * @package automattic/woocommerce-analytics
 */

namespace Automattic\Woocommerce_Analytics;

/**
 * Manages consent checking for WooCommerce Analytics
 */
class Consent_Manager {

	/**
	 * Consent type that we check for analytics tracking
	 */
	const WP_CONSENT_API_STATISTICS_TYPE = 'statistics';

	/**
	 * Check if user has consent for analytics tracking
	 *
	 * @return bool
	 */
	public static function has_analytics_consent() {
		if ( ! function_exists( 'wp_has_consent' ) ) {
			return true;
		}

		return \wp_has_consent( self::WP_CONSENT_API_STATISTICS_TYPE );
	}
}
