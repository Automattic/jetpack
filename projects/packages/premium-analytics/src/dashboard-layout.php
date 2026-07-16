<?php
/**
 * Dashboard Layout: Premium Analytics server-side defaults.
 *
 * Premium Analytics owns its dashboard, so it ships its own default layout
 * rather than relying on the core dashboard endpoint (which is Gutenberg-only
 * and returns the core dashboard's widgets). Mirrors the two mechanisms the
 * core experiment uses:
 *   1. a `get_user_metadata` injection that surfaces the default through the
 *      `@wordpress/preferences` store on first load, and
 *   2. a REST route the client's "reset to default" action reads.
 *
 * The scope, key, dashboard name, and REST namespace are constants so they can
 * be renamed in one place — e.g. to fully isolate the stored preference from
 * the core dashboard's. These must match `routes/dashboard/hooks/constants.ts`.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-grammar.php';

/**
 * Preferences scope under which the dashboard layout is stored. Mirrors the
 * scope read by the dashboard's JS hooks.
 */
const DASHBOARD_LAYOUT_SCOPE = 'jetpack-premium-analytics/dashboard';

/**
 * Preferences key under DASHBOARD_LAYOUT_SCOPE that holds the layout array.
 */
const DASHBOARD_LAYOUT_KEY = 'dashboardLayout';

/**
 * Preferences key under DASHBOARD_LAYOUT_SCOPE that holds per-section layouts.
 */
const DASHBOARD_SECTION_LAYOUTS_KEY = 'dashboardSectionLayouts';

/**
 * Identifier of the Premium Analytics dashboard, formatted as `<plugin>_<page>`
 * to match the underscore form produced by the wp-build pipeline. Used as the
 * `{name}` segment of the REST route and as the seed filter's target.
 */
const DASHBOARD_NAME = 'jetpack-premium-analytics_dashboard';

/**
 * REST namespace that exposes the dashboard's default layout.
 */
const DASHBOARD_REST_NAMESPACE = 'jetpack/v4';

/**
 * Filter through which the default layout for a dashboard is resolved.
 */
const DASHBOARD_DEFAULT_LAYOUT_FILTER = 'jetpack_premium_analytics_dashboard_default_layout';

/**
 * Preference keys used by the dashboard route's tabbed sections.
 */
const DASHBOARD_TRAFFIC_SECTION_ID     = 'traffic';
const DASHBOARD_INSIGHTS_SECTION_ID    = 'insights';
const DASHBOARD_SUBSCRIBERS_SECTION_ID = 'subscribers';
const DASHBOARD_STORE_SECTION_ID       = 'store';

/**
 * Injects the registered default dashboard layout into the user's
 * `persisted_preferences` read when the stored layout is empty.
 *
 * Hooks into `get_user_metadata` so the default propagates through the same
 * persistence layer the dashboard's JS layer reads from. The JS side stays
 * oblivious: a default and a user-saved layout look identical at the
 * preferences-store boundary.
 *
 * @global \wpdb $wpdb WordPress database abstraction object.
 *
 * @param mixed  $value    The pre-fetched value, or null to let the meta API
 *                         resolve normally.
 * @param int    $user_id  User ID.
 * @param string $meta_key Meta key being read.
 * @return mixed The original value, or a single-element array containing the
 *               extended persisted preferences.
 */
function inject_dashboard_default_layout( $value, $user_id, $meta_key ) {
	global $wpdb;

	$expected_key = $wpdb->get_blog_prefix() . 'persisted_preferences';
	if ( $meta_key !== $expected_key ) {
		return $value;
	}

	// Avoid recursion when reading the user meta.
	remove_filter( 'get_user_metadata', __FUNCTION__, 99 );
	$base = get_user_meta( $user_id, $meta_key, true );
	add_filter( 'get_user_metadata', __FUNCTION__, 99, 3 );

	if ( ! is_array( $base ) ) {
		$base = array();
	}

	$committed = $base[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_LAYOUT_KEY ] ?? array();
	$updated   = false;

	if ( ! isset( $base[ DASHBOARD_LAYOUT_SCOPE ] ) || ! is_array( $base[ DASHBOARD_LAYOUT_SCOPE ] ) ) {
		$base[ DASHBOARD_LAYOUT_SCOPE ] = array();
	}

	if ( empty( $committed ) ) {
		$default = get_dashboard_default_layout_for( DASHBOARD_NAME );

		if ( ! empty( $default ) ) {
			$base[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_LAYOUT_KEY ] = $default;
			$updated = true;
		}
	}

	$section_layouts = $base[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] ?? array();

	if ( ! is_array( $section_layouts ) ) {
		$section_layouts = array();
	}

	foreach ( array_keys( get_dashboard_default_section_layouts() ) as $section_id ) {
		if ( array_key_exists( $section_id, $section_layouts ) ) {
			continue;
		}

		$section_default = get_dashboard_default_layout_for( $section_id );

		if ( ! empty( $section_default ) ) {
			$section_layouts[ $section_id ] = $section_default;
			$updated                        = true;
		}
	}

	if ( $updated ) {
		$base[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] = $section_layouts;

		return array( $base );
	}

	return $value;
}
add_filter( 'get_user_metadata', __NAMESPACE__ . '\\inject_dashboard_default_layout', 99, 3 );

/**
 * Resolves the default layout registered for a dashboard.
 *
 * Returns a fresh evaluation of the filter chain each call, so callers always
 * see the current code default rather than a hydrated copy.
 *
 * @param string $dashboard_name Identifier of the dashboard or dashboard section.
 * @return array Array of widget instances (possibly empty).
 */
function get_dashboard_default_layout_for( $dashboard_name ) {
	/**
	 * Filters the default dashboard layout served to users who have not
	 * customized theirs.
	 *
	 * Each entry should match the dashboard's widget instance shape: `uuid`,
	 * `type`, optional `attributes`, optional `placement`.
	 *
	 * @param array  $default_layout Default array of widget instances.
	 * @param string $dashboard_name Identifier of the dashboard or dashboard
	 *                               section receiving the default. Callbacks
	 *                               targeting a specific default should switch
	 *                               on this value.
	 */
	$default = apply_filters( DASHBOARD_DEFAULT_LAYOUT_FILTER, array(), $dashboard_name );

	return is_array( $default ) ? array_values( $default ) : array();
}

/**
 * REST callback returning the default layout for the requested dashboard.
 *
 * @param \WP_REST_Request $request REST request carrying the dashboard name.
 * @return \WP_REST_Response Response wrapping the default layout array.
 */
function get_dashboard_default_layout_response( $request ) {
	return rest_ensure_response( get_dashboard_default_layout_for( $request['name'] ) );
}

/**
 * Registers the REST route that exposes per-dashboard default layouts.
 *
 * @return void
 */
function register_dashboard_default_layout_route() {
	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/dashboards/(?P<name>' . get_dashboard_name_pattern() . ')/default-layout',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_dashboard_default_layout_response',
			'permission_callback' => static function () {
				return current_user_can( 'manage_options' );
			},
			'args'                => array(
				'name' => array(
					'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'jetpack-premium-analytics' ),
					'type'        => 'string',
				),
			),
		)
	);
}
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_dashboard_default_layout_route' );

/**
 * Builds a widget instance for bundled dashboard defaults.
 *
 * @param string $uuid       Widget instance UUID.
 * @param string $type       Widget type.
 * @param int    $order      Widget placement order.
 * @param int    $width      Widget placement width.
 * @param int    $height     Widget placement height.
 * @param array  $attributes Optional widget attributes.
 * @return array Widget instance.
 */
function get_dashboard_default_widget_instance(
	$uuid,
	$type,
	$order,
	$width = 1,
	$height = 1,
	$attributes = array()
) {
	$widget = array(
		'uuid' => $uuid,
		'type' => $type,
	);

	if ( ! empty( $attributes ) ) {
		$widget['attributes'] = $attributes;
	}

	$widget['placement'] = array(
		'width'  => $width,
		'height' => $height,
		'order'  => $order,
	);

	return $widget;
}

/**
 * Returns the bundled default widget layouts keyed by dashboard tab.
 *
 * @return array Map of tab IDs to widget layout arrays.
 */
function get_dashboard_default_section_layouts() {
	return array(
		DASHBOARD_TRAFFIC_SECTION_ID     => array(
			get_dashboard_default_widget_instance(
				'default-traffic-chart-widget-instance',
				'jpa/traffic-chart',
				0,
				2,
				2,
				array(
					'granularity' => 'auto',
				)
			),
			get_dashboard_default_widget_instance(
				'default-stats-top-posts-widget-instance',
				'jpa/stats-top-posts',
				1,
				1,
				2,
				array(
					'num' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-referrers-widget-instance',
				'jpa/referrers',
				2,
				1,
				2,
				array(
					'max' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-locations-widget-instance',
				'jpa/locations',
				3,
				2,
				2,
				array(
					'max' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-devices-widget-instance',
				'jpa/devices',
				4,
				1,
				2,
				array(
					'max' => 5,
				)
			),
			get_dashboard_default_widget_instance(
				'default-top-platforms-widget-instance',
				'jpa/top-platforms',
				5,
				1,
				2,
				array(
					'max' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-search-terms-widget-instance',
				'jpa/search-terms',
				6,
				1,
				2,
				array(
					'max' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-utm-insights-widget-instance',
				'jpa/utm-insights',
				7,
				1,
				2,
				array(
					'utmDimension' => 'utm_source,utm_medium',
					'max'          => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-file-downloads-widget-instance',
				'jpa/file-downloads',
				8,
				1,
				2,
				array(
					'max' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-clicks-widget-instance',
				'jpa/clicks',
				9,
				1,
				2,
				array(
					'max' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-authors-widget-instance',
				'jpa/authors',
				10,
				1,
				2,
				array(
					'max' => 7,
				)
			),
			get_dashboard_default_widget_instance(
				'default-videopress-widget-instance',
				'jpa/videopress',
				11,
				1,
				2,
				array(
					'max' => 7,
				)
			),
			get_dashboard_default_widget_instance(
				'default-plan-usage-widget-instance',
				'jpa/plan-usage',
				12,
				2,
				1
			),
		),
		DASHBOARD_INSIGHTS_SECTION_ID    => array(
			get_dashboard_default_widget_instance(
				'default-annual-highlights-widget-instance',
				'jpa/annual-highlights',
				0,
				2,
				1
			),
			get_dashboard_default_widget_instance(
				'default-all-time-stats-widget-instance',
				'jpa/all-time-stats',
				1,
				2,
				1
			),
			get_dashboard_default_widget_instance(
				'default-latest-post-widget-instance',
				'jpa/latest-post',
				2,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-posting-activity-widget-instance',
				'jpa/posting-activity',
				3,
				2,
				2
			),
			get_dashboard_default_widget_instance(
				'default-emails-widget-instance',
				'jpa/stats-emails',
				4,
				1,
				2,
				array(
					'max'    => 10,
					'metric' => 'opens',
				)
			),
			get_dashboard_default_widget_instance(
				'default-shares-widget-instance',
				'jpa/shares',
				5,
				1,
				2,
				array(
					'max' => 10,
				)
			),
			get_dashboard_default_widget_instance(
				'default-most-popular-day-widget-instance',
				'jpa/most-popular-day',
				6,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-most-popular-time-widget-instance',
				'jpa/most-popular-time',
				7,
				1,
				1
			),
		),
		DASHBOARD_SUBSCRIBERS_SECTION_ID => array(
			get_dashboard_default_widget_instance(
				'default-subscriber-highlights-widget-instance',
				'jpa/subscriber-highlights',
				0,
				4,
				1,
				array(
					'showTotal'  => true,
					'showPaid'   => true,
					'showFree'   => true,
					'showSocial' => true,
				)
			),
			get_dashboard_default_widget_instance(
				'default-subscribers-chart-widget-instance',
				'jpa/subscribers-chart',
				1,
				4,
				1,
				array(
					'granularity' => 'auto',
				)
			),
			get_dashboard_default_widget_instance(
				'default-subscribers-list-widget-instance',
				'jpa/subscribers-list',
				2,
				2,
				2,
				array(
					'num' => 6,
				)
			),
			get_dashboard_default_widget_instance(
				'default-subscribers-emails-widget-instance',
				'jpa/stats-emails',
				3,
				2,
				2,
				array(
					'max'    => 10,
					'metric' => 'opens',
				)
			),
		),
		DASHBOARD_STORE_SECTION_ID       => array(
			get_dashboard_default_widget_instance(
				'default-store-performance-widget-instance',
				'jpa/store-performance',
				0,
				2,
				1
			),
			get_dashboard_default_widget_instance(
				'default-total-sales-over-time-widget-instance',
				'jpa/total-sales-over-time',
				1,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-conversion-rate-widget-instance',
				'jpa/conversion-rate',
				2,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-orders-over-time-widget-instance',
				'jpa/orders-over-time',
				3,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-average-order-value-widget-instance',
				'jpa/average-order-value',
				4,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-top-performing-products-widget-instance',
				'jpa/top-performing-products',
				5,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-new-vs-returning-customer-widget-instance',
				'jpa/new-vs-returning-customer',
				6,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-payment-status-widget-instance',
				'jpa/payment-status',
				7,
				1,
				1
			),
			get_dashboard_default_widget_instance(
				'default-orders-fulfillment-widget-instance',
				'jpa/orders-fulfillment',
				8,
				1,
				1
			),
		),
	);
}

/**
 * Resolves a dashboard or section identifier to one of the bundled tab IDs.
 *
 * @param string $dashboard_name Dashboard or section identifier.
 * @return string|null Bundled tab ID, or null when the identifier is unsupported.
 */
function get_dashboard_default_section_id_for( $dashboard_name ) {
	$aliases = array(
		DASHBOARD_NAME                   => DASHBOARD_TRAFFIC_SECTION_ID,
		DASHBOARD_TRAFFIC_SECTION_ID     => DASHBOARD_TRAFFIC_SECTION_ID,
		'analytics/traffic'              => DASHBOARD_TRAFFIC_SECTION_ID,
		DASHBOARD_INSIGHTS_SECTION_ID    => DASHBOARD_INSIGHTS_SECTION_ID,
		'analytics/insights'             => DASHBOARD_INSIGHTS_SECTION_ID,
		DASHBOARD_SUBSCRIBERS_SECTION_ID => DASHBOARD_SUBSCRIBERS_SECTION_ID,
		'analytics/subscribers'          => DASHBOARD_SUBSCRIBERS_SECTION_ID,
		DASHBOARD_STORE_SECTION_ID       => DASHBOARD_STORE_SECTION_ID,
		'woocommerce/store'              => DASHBOARD_STORE_SECTION_ID,
	);

	return $aliases[ $dashboard_name ] ?? null;
}

/**
 * Seeds the bundled default layouts for the Premium Analytics dashboard tabs.
 *
 * Only contributes to the known Premium Analytics dashboard and tab aliases;
 * other dashboards are left untouched so the filter can be reused if more
 * dashboards are added later.
 *
 * @param array  $dashboard_layout Default layout from earlier callbacks.
 * @param string $dashboard_name   Identifier of the dashboard receiving the
 *                                 default.
 * @return array The layout extended with the bundled widget instances.
 */
function seed_default_dashboard_layout( $dashboard_layout, $dashboard_name = '' ) {
	$section_id = get_dashboard_default_section_id_for( $dashboard_name );

	if ( null === $section_id ) {
		return $dashboard_layout;
	}

	$uuids   = array_column( $dashboard_layout, 'uuid' );
	$layouts = get_dashboard_default_section_layouts();

	foreach ( $layouts[ $section_id ] as $widget ) {
		if ( ! in_array( $widget['uuid'], $uuids, true ) ) {
			$dashboard_layout[] = $widget;
			$uuids[]            = $widget['uuid'];
		}
	}

	return $dashboard_layout;
}
add_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, __NAMESPACE__ . '\\seed_default_dashboard_layout', 10, 2 );
