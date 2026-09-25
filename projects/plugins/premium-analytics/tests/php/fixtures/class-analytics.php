<?php
/**
 * Analytics initializer test double.
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Records calls to the package initializer.
 */
class Analytics {
	/**
	 * Record an initialization call.
	 *
	 * @return void
	 */
	public static function init() {
		++$GLOBALS['jpa_test_analytics_init_calls'];
	}
}
