<?php
/**
 * Dashboard policy: the composition feature flag and its script-data bridge.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Name of the feature flag that offers adding, removing and resetting widgets.
 */
const DASHBOARD_COMPOSITION_FLAG = 'premium-analytics-dashboard-composition';

/**
 * Registers the dashboard feature flags.
 *
 * Runs on every request so the flag stays discoverable wherever flags are read or
 * toggled: REST, WP-CLI and the WordPress.com control screen included.
 *
 * @return void
 */
function register_dashboard_feature_flags() {
	Feature_Flags::register(
		DASHBOARD_COMPOSITION_FLAG,
		array(
			'default'     => false,
			'description' => 'Offer adding, removing and resetting widgets on the analytics dashboard, on top of moving and resizing them.',
			'owner'       => 'jetpack-premium-analytics',
		)
	);
}

/**
 * Whether the dashboard offers adding, removing and resetting widgets.
 *
 * @return bool
 */
function is_dashboard_composition_enabled() {
	return Feature_Flags::is_enabled( DASHBOARD_COMPOSITION_FLAG );
}

/**
 * Configures the dashboard policy script data.
 *
 * @return void
 */
function configure_dashboard_policy() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
}

/**
 * Injects the flag's answer into JetpackScriptData for the dashboard policy.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_dashboard_policy_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['dashboard_composition_enabled'] = is_dashboard_composition_enabled();

	return $data;
}
