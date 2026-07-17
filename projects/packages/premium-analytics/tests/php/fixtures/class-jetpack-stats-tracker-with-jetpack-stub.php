<?php
/**
 * Jetpack Stats tracker test stub.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Simulates the Jetpack plugin owning the Stats module setting.
 */
class Jetpack_Stats_Tracker_With_Jetpack_Stub extends Jetpack_Stats_Tracker {

	/**
	 * Simulate an active Jetpack plugin.
	 *
	 * @return bool
	 */
	protected static function is_jetpack_plugin_active() {
		return true;
	}
}
