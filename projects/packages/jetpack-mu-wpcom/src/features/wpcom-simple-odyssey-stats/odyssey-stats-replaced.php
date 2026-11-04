<?php
/**
 * When Stats v2 takes the Odyssey Stats page's place on WordPress.com Simple.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\PremiumAnalytics\Analytics;
use Automattic\Jetpack\PremiumAnalytics\Classic_Stats;

if ( ! function_exists( 'wpcom_simple_odyssey_stats_is_replaced' ) ) {
	/**
	 * Whether Stats v2 takes over `admin.php?page=stats`: classic Stats is retired and Stats v2 booted in this request.
	 *
	 * @return bool
	 */
	function wpcom_simple_odyssey_stats_is_replaced() {
		// An older Premium Analytics copy predates the retirement flag.
		if ( ! is_callable( array( Classic_Stats::class, 'is_retired' ) ) ) {
			return false;
		}

		return Classic_Stats::is_retired() && Analytics::is_initialized();
	}
}
