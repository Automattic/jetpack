<?php
/**
 * Dashboard policy script-data wiring.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Status\Visitor;

/**
 * Configures the dashboard policy script data.
 *
 * @return void
 */
function configure_dashboard_policy() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
}

/**
 * Injects whether the current user is an Automattician into JetpackScriptData.
 *
 * Identified on WordPress.com Simple, and through the a8c proxy on WoA. A reporting
 * signal rather than authorization: the dashboard policy only decides what the UI offers.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_dashboard_policy_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['is_automattician'] = ( new Visitor() )->is_tracking_automattician();

	return $data;
}
