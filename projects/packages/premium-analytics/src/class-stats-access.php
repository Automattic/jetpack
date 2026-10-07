<?php
/**
 * Who may read the Stats reports.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * The Stats reports' capability rule.
 *
 * A class of its own rather than a method on Capabilities: an older copy of the package may have
 * loaded its Capabilities class first, but never this one, so the autoloader always serves it.
 *
 * @since $$next-version$$
 */
class Stats_Access {

	/**
	 * Whether the current user may read the Stats reports.
	 *
	 * "Stats reports" is everything the proxy serves under `view_stats`, mirroring what
	 * {@see \Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller} enforces there (pinned by Capabilities_Test).
	 *
	 * @return bool
	 */
	public static function current_user_can_view() {
		// `view_stats` alone would track Stats more closely, but it only works once Stats hooks its own
		// `map_meta_cap` — which Analytics::init_wpcom_simple() never does, locking out administrators too.
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}
}
