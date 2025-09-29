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
	 * Check if WP Consent API is available
	 *
	 * @return bool
	 */
	public static function is_wp_consent_api_available() {
		return function_exists( 'wp_has_consent' );
	}

	/**
	 * Check if user has consent for statistics tracking
	 *
	 * @return bool
	 */
	public static function has_statistics_consent() {
		// If WP Consent API is not available, default to true for backward compatibility
		if ( ! self::is_wp_consent_api_available() ) {
			return true;
		}

		return \wp_has_consent( self::WP_CONSENT_API_STATISTICS_TYPE );
	}
}
