<?php
/**
 * Single-report page API: registry helpers, the default-layout filter and the script data.
 *
 * The package's own pages register through this API from default-single-report-pages.php,
 * the way other plugins do.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-grammar.php';
require_once __DIR__ . '/class-single-report-page.php';
require_once __DIR__ . '/class-single-report-page-registry.php';

// Guarded on a symbol the file declares, so a second copy of the package can't redeclare it.
if ( ! function_exists( __NAMESPACE__ . '\\get_dashboard_default_widget_instance' ) ) {
	require_once __DIR__ . '/dashboard-layout.php';
}

// A page icon is a widget icon: the same registered-name grammar, the same sanitizer.
if ( ! function_exists( __NAMESPACE__ . '\\sanitize_widget_icon' ) ) {
	require_once __DIR__ . '/widget-types.php';
}

require_once __DIR__ . '/rest-namespace.php';

/**
 * Filter run over a single-report page's default layout, with the page id, the inner section slug and the page.
 */
const SINGLE_REPORT_PAGE_DEFAULT_LAYOUT_FILTER = 'jetpack_premium_analytics_single_report_page_default_layout';

// The same policies a section's default layout gets: former names resolved, then unsupported types dropped.
add_filter( SINGLE_REPORT_PAGE_DEFAULT_LAYOUT_FILTER, __NAMESPACE__ . '\\resolve_former_widget_types_in_default_layout', 99 );
add_filter( SINGLE_REPORT_PAGE_DEFAULT_LAYOUT_FILTER, __NAMESPACE__ . '\\remove_unsupported_default_layout_items', 100 );

/**
 * Registers a single-report page.
 *
 * @since $$next-version$$
 *
 * @param string $dashboard_name Dashboard identifier.
 * @param string $id             Page identifier, namespaced.
 * @param array  $args           Optional. Page arguments.
 * @return Single_Report_Page|false The registered page on success, or false on failure.
 */
function register_single_report_page( $dashboard_name, $id, $args = array() ) {
	return Single_Report_Page_Registry::get_instance()->register( $dashboard_name, $id, $args );
}

/**
 * A registered single-report page.
 *
 * @since $$next-version$$
 *
 * @param string $dashboard_name Dashboard identifier.
 * @param string $id             Page identifier.
 * @return Single_Report_Page|null
 */
function get_registered_single_report_page( $dashboard_name, $id ) {
	return Single_Report_Page_Registry::get_instance()->get_registered( $dashboard_name, $id );
}

/**
 * The single-report pages available to the current reader.
 *
 * @since $$next-version$$
 *
 * @param string $dashboard_name Dashboard identifier.
 * @return Single_Report_Page[]
 */
function get_available_single_report_pages( $dashboard_name ) {
	return Single_Report_Page_Registry::get_instance()->get_available_pages( $dashboard_name );
}

/**
 * The records of the available pages of the dashboard, or null while nothing is registered.
 *
 * @return array[]|null
 */
function get_available_single_report_page_records() {
	$registry = Single_Report_Page_Registry::get_instance();

	if ( empty( $registry->get_all_registered( DASHBOARD_NAME ) ) ) {
		return null;
	}

	return array_map(
		static function ( Single_Report_Page $page ) {
			return $page->to_array();
		},
		$registry->get_available_pages( DASHBOARD_NAME )
	);
}

/**
 * Publishes the available pages to the client.
 */
function configure_single_report_pages_script_data() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_single_report_pages_script_data', 20 );
}

/**
 * Adds `premium_analytics.single_report_pages` to the dashboard's script data; other admin screens get nothing.
 *
 * @param array $data Script data.
 * @return array
 */
function inject_single_report_pages_script_data( array $data ): array {
	if ( ! Analytics::is_dashboard_request() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$pages = get_available_single_report_page_records();

	if ( null !== $pages ) {
		$data['premium_analytics']['single_report_pages'] = $pages;
	}

	return $data;
}

/**
 * Permission callback of the single-report pages route: the dashboard capability.
 *
 * @return bool
 */
function check_single_report_pages_permission() {
	return Capabilities::current_user_can_view_analytics();
}

/**
 * The REST schema of a page's or a section's controls: DataViews field declarations.
 *
 * @return array
 */
function get_single_report_page_controls_schema() {
	return array(
		'type'  => array( 'array', 'null' ),
		'items' => array(
			'type'       => 'object',
			'properties' => array(
				'id'       => array( 'type' => 'string' ),
				'type'     => array( 'type' => 'string' ),
				'label'    => array( 'type' => 'string' ),
				'elements' => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'value' => array( 'type' => array( 'string', 'number', 'boolean', 'null' ) ),
							'label' => array( 'type' => 'string' ),
						),
					),
				),
			),
		),
	);
}

/**
 * The REST schema of a single-report page record.
 *
 * @return array
 */
function get_single_report_page_schema() {
	return array(
		'$schema'    => 'http://json-schema.org/draft-04/schema#',
		'title'      => 'jetpack-premium-analytics-single-report-page',
		'type'       => 'object',
		'properties' => array(
			'id'                => array( 'type' => 'string' ),
			'path'              => array( 'type' => 'string' ),
			'label'             => array( 'type' => 'string' ),
			'dashboard_section' => array( 'type' => array( 'string', 'null' ) ),
			'feature'           => array( 'type' => array( 'string', 'null' ) ),
			'scope_param'       => array( 'type' => 'string' ),
			'id_pattern'        => array( 'type' => 'string' ),
			'icon'              => array( 'type' => array( 'string', 'null' ) ),
			'controls'          => get_single_report_page_controls_schema(),
			'reports_page'      => array( 'type' => array( 'string', 'null' ) ),
			'preferences_scope' => array( 'type' => 'string' ),
			'default_layout'    => array(
				'type'  => 'array',
				'items' => array( 'type' => 'object' ),
			),
			'sections'          => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'slug'           => array( 'type' => 'string' ),
						'label'          => array( 'type' => 'string' ),
						'default_layout' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'object' ),
						),
						'controls'       => get_single_report_page_controls_schema(),
					),
				),
			),
		),
	);
}

/**
 * The single-report pages available to the reader, for `GET …/dashboards/{name}/single-report-pages`.
 *
 * @param \WP_REST_Request $request The request.
 * @return \WP_REST_Response
 */
function get_single_report_pages_response( $request ) {
	$pages = array_map(
		static function ( Single_Report_Page $page ) {
			return $page->to_array();
		},
		get_available_single_report_pages( $request['name'] )
	);

	return rest_ensure_response( $pages );
}

/**
 * Registers the single-report pages route under the dashboard REST namespace.
 */
function register_single_report_pages_rest_routes() {
	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/dashboards/(?P<name>' . get_dashboard_name_pattern() . ')/single-report-pages',
		array(
			array(
				// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- register_rest_route()'s own signature mixes a numerically keyed endpoint list with a route-level `schema` key.
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __NAMESPACE__ . '\\get_single_report_pages_response',
				'permission_callback' => __NAMESPACE__ . '\\check_single_report_pages_permission',
				'args'                => array(
					'name' => array(
						'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'jetpack-premium-analytics-pkg' ),
						'type'        => 'string',
					),
				),
			),
			'schema' => __NAMESPACE__ . '\\get_single_report_page_schema',
		)
	);
}
