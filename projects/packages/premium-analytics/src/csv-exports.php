<?php
/**
 * CSV export script-data wiring.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Filter controlling whether experimental CSV export controls are shown.
 *
 * @var string
 */
const CSV_EXPORTS_ENABLED_FILTER = 'jetpack_premium_analytics_csv_exports_enabled';

/**
 * Configures CSV export script data.
 *
 * @return void
 */
function configure_csv_exports() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_csv_exports_script_data', 20 );
}

/**
 * Injects the CSV export flag into JetpackScriptData.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_csv_exports_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	/**
	 * Filters whether Premium Analytics widgets should show experimental CSV
	 * export controls.
	 *
	 * The default is off so the proof-of-concept UI stays opt-in while
	 * reviewers test and iterate on the placement/design.
	 *
	 * @param bool $enabled Whether to show CSV export controls.
	 */
	$data['premium_analytics']['csv_exports_enabled'] = (bool) apply_filters( CSV_EXPORTS_ENABLED_FILTER, false );

	return $data;
}
