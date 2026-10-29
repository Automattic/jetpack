<?php
/**
 * Dashboard policy: the dashboard feature flags and the shims older copies of the package call.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Registers the dashboard feature flags: none today.
 *
 * Kept as the symbol the policy file is guarded on, and for older copies of the package that
 * call it.
 *
 * @return void
 */
function register_dashboard_feature_flags() {
}

/**
 * No-op kept for older copies of the package, whose dashboard-sections.php calls it after
 * skipping its include of this file.
 *
 * @deprecated 0.10.0 The preview scope it opened is gone.
 *
 * @return bool
 */
function is_dashboard_unlocked_for_a11n() {
	return false;
}

/**
 * Kept for older copies of the package, whose class-analytics.php calls it and whose client
 * offers adding and removing widgets only while the script data says so.
 *
 * @deprecated 0.13.0 Adding and removing widgets is always offered.
 *
 * @return void
 */
function configure_dashboard_policy() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
}

/**
 * Tells an older copy's client that adding and removing widgets is offered.
 *
 * @deprecated 0.13.0 Adding and removing widgets is always offered.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_dashboard_policy_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['dashboard_composition_enabled'] = true;

	return $data;
}
