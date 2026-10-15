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
 * Configures the first-visit record and its script data.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_dashboard_first_visit() {
	add_action( 'admin_init', __NAMESPACE__ . '\\record_dashboard_first_visit' );
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_first_visit_script_data', 20 );
}

/**
 * Stores the time of the first dashboard load, once per site.
 *
 * @since $$next-version$$
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
 * Injects the first-visit time into JetpackScriptData.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_dashboard_first_visit_script_data( array $data ): array {
	if ( ! Analytics::is_dashboard_request() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['first_visit'] = (int) get_option( DASHBOARD_FIRST_VISIT_OPTION, time() );

	return $data;
}
