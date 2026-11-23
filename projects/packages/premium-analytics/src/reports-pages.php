<?php
/**
 * Reports page API: the registration helper and the script data.
 *
 * The package's own pages register through this API from default-reports-pages.php,
 * the way other plugins do.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

// The record, its layout filter and the widget instance helper are the single-report page's.
require_once __DIR__ . '/single-report-pages.php';
require_once __DIR__ . '/class-reports-page-registry.php';

/**
 * Registers a reports page.
 *
 * @since $$next-version$$
 *
 * @param string $dashboard_name Dashboard identifier.
 * @param string $id             Page identifier, namespaced.
 * @param array  $args           Optional. Page arguments.
 * @return Reports_Page|false The registered page on success, or false on failure.
 */
function register_reports_page( $dashboard_name, $id, $args = array() ) {
	return Reports_Page_Registry::get_instance()->register( $dashboard_name, $id, $args );
}

/**
 * The records of the available reports pages of the dashboard.
 *
 * @return array[]
 */
function get_available_reports_page_records() {
	return array_map(
		static function ( Reports_Page $page ) {
			return $page->to_array();
		},
		Reports_Page_Registry::get_instance()->get_available_pages( DASHBOARD_NAME )
	);
}

/**
 * Publishes the available reports pages to the client.
 */
function configure_reports_pages_script_data() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_reports_pages_script_data', 20 );
}

/**
 * Adds `premium_analytics.reports_pages` to the dashboard's script data; other admin screens get nothing.
 *
 * @param array $data Script data.
 * @return array
 */
function inject_reports_pages_script_data( array $data ): array {
	if ( ! Analytics::renders_dashboard() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['reports_pages'] = get_available_reports_page_records();

	return $data;
}
