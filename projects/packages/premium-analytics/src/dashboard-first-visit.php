<?php
/**
 * When the site first opened the dashboard, so notices can wait until the site has been on it a while.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Option holding the Unix time of the site's first dashboard load.
 *
 * @var string
 */
const DASHBOARD_FIRST_VISIT_OPTION = 'jetpack_premium_analytics_first_visit';

/**
 * Configures the first-visit record.
 *
 * @since 0.14.0
 *
 * @return void
 */
function configure_dashboard_first_visit() {
	add_action( 'admin_init', __NAMESPACE__ . '\\record_dashboard_first_visit' );
}

/**
 * Stores the time of the first dashboard load, once per site.
 *
 * @since 0.14.0
 *
 * @return void
 */
function record_dashboard_first_visit() {
	if ( ! Analytics::is_dashboard_request() ) {
		return;
	}

	// add_option() is a no-op once the option exists.
	add_option( DASHBOARD_FIRST_VISIT_OPTION, time(), '', false );
}

/**
 * The Unix time of the site's first dashboard load.
 *
 * @since 0.14.0
 *
 * @return int|null Null until the dashboard has loaded once.
 */
function get_dashboard_first_visit() {
	$first_visit = (int) get_option( DASHBOARD_FIRST_VISIT_OPTION );

	return $first_visit > 0 ? $first_visit : null;
}
