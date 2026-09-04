<?php
/**
 * Dashboard policy script-data wiring.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
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
 * Whether the request is served by a sandbox.
 *
 * A WordPress.com Simple site served by a developer sandbox, or a Jetpack site whose
 * WordPress.com traffic is sandboxed through `JETPACK__SANDBOX_DOMAIN`.
 *
 * @return bool
 */
function is_sandboxed_request() {
	return Constants::is_true( 'WPCOM_SANDBOXED' ) || (bool) Constants::get_constant( 'JETPACK__SANDBOX_DOMAIN' );
}

/**
 * Injects the two facts the dashboard policy reads into JetpackScriptData.
 *
 * Whether the user is an Automattician (WordPress.com Simple, or the a8c proxy on WoA) and
 * whether the request is sandboxed. Reporting signals rather than authorization: the policy
 * only decides what the UI offers.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_dashboard_policy_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['is_automattician'] = ( new Visitor() )->is_tracking_automattician();
	$data['premium_analytics']['is_sandboxed']     = is_sandboxed_request();

	return $data;
}
