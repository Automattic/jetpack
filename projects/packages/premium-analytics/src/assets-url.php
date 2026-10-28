<?php
/**
 * Where the dashboard loads its image files from.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Assets;

/**
 * Configures the assets URL script data.
 *
 * @since 0.14.0
 *
 * @return void
 */
function configure_assets_url() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_assets_url_script_data', 20 );
}

/**
 * Injects the URL of the copied `build/images/` directory into JetpackScriptData.
 *
 * @since 0.14.0
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_assets_url_script_data( array $data ): array {
	if ( ! Analytics::is_dashboard_request() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['assets_url'] = trailingslashit( Assets::normalize_path( plugins_url( '../build/images/', __FILE__ ) ) );

	return $data;
}
