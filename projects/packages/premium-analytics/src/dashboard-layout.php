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

	if ( ! empty( $committed ) ) {
		return $value;
	}

	$default = get_dashboard_default_layout_for( DASHBOARD_NAME );

	if ( empty( $default ) ) {
		return $value;
	}

	if ( ! isset( $base[ DASHBOARD_LAYOUT_SCOPE ] ) || ! is_array( $base[ DASHBOARD_LAYOUT_SCOPE ] ) ) {
		$base[ DASHBOARD_LAYOUT_SCOPE ] = array();
	}

	$base[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_LAYOUT_KEY ] = $default;

	return array( $base );
}
add_filter( 'get_user_metadata', __NAMESPACE__ . '\\inject_dashboard_default_layout', 99, 3 );

/**
 * Resolves the default layout registered for a dashboard.
 *
 * Returns a fresh evaluation of the filter chain each call, so callers always
 * see the current code default rather than a hydrated copy.
 *
 * @param string $dashboard_name Identifier of the dashboard.
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
	 * @param string $dashboard_name Identifier of the dashboard receiving the
	 *                               default. Callbacks targeting a specific
	 *                               dashboard should switch on this value.
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
		'/dashboards/(?P<name>[a-z][a-z0-9-]*(?:_[a-z0-9-]+)+)/default-layout',
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
 * Seeds the bundled default layout for the Premium Analytics dashboard.
 *
 * Only contributes to DASHBOARD_NAME; other dashboards are left untouched so
 * the filter can be reused if more dashboards are added later.
 *
 * @param array  $dashboard_layout Default layout from earlier callbacks.
 * @param string $dashboard_name   Identifier of the dashboard receiving the
 *                                 default.
 * @return array The layout extended with the bundled widget instances.
 */
function seed_default_dashboard_layout( $dashboard_layout, $dashboard_name = '' ) {
	if ( DASHBOARD_NAME !== $dashboard_name ) {
		return $dashboard_layout;
	}

	$uuids = array_column( $dashboard_layout, 'uuid' );

	if ( ! in_array( 'default-hello-world-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-hello-world-widget-instance',
			'type'      => 'jpa/hello-world',
			'placement' => array(
				'width'  => 1,
				'height' => 1,
				'order'  => 0,
			),
		);
	}

	return $dashboard_layout;
}
add_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, __NAMESPACE__ . '\\seed_default_dashboard_layout', 10, 2 );
