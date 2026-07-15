<?php
/**
 * Client-side CSV export script-data wiring.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Filter controlling whether experimental client-side CSV export controls
 * are shown in Premium Analytics widgets.
 *
 * @var string
 */
const CLIENT_SIDE_CSV_EXPORTS_ENABLED_FILTER = 'jetpack_premium_analytics_client_side_csv_exports_enabled';

/**
 * Configures client-side CSV export script data.
 *
 * @return void
 */
function configure_client_side_csv_exports() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_client_side_csv_exports_script_data', 20 );
}

/**
 * Injects the client-side CSV export flag into JetpackScriptData.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_client_side_csv_exports_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	/**
	 * Filters whether Premium Analytics widgets should show experimental
	 * client-side CSV export controls.
	 *
	 * The default is off so the proof-of-concept UI stays opt-in while
	 * reviewers test and iterate on the placement/design.
	 *
	 * @param bool $enabled Whether to show client-side CSV export controls.
	 */
	$data['premium_analytics']['client_side_csv_exports_enabled'] = (bool) apply_filters( CLIENT_SIDE_CSV_EXPORTS_ENABLED_FILTER, false );

	return $data;
}
