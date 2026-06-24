<?php
/**
 * Dashboard Layout: Premium Analytics server-side preference defaults.
 *
 * Premium Analytics owns its dashboard, so it ships its own default layout
 * rather than relying on the core dashboard endpoint (which is Gutenberg-only
 * and returns the core dashboard's widgets). Mirrors the first-load preference
 * injection the core experiment uses while allowing additional dashboard
 * preference keys to seed independently.
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
 * Filter through which dashboard preference defaults are resolved.
 */
const DASHBOARD_PREFERENCE_DEFAULTS_FILTER = 'jetpack_premium_analytics_dashboard_preference_defaults';

/**
 * Injects registered dashboard defaults into the user's `persisted_preferences`
 * read when the corresponding stored preference is empty.
 *
 * Hooks into `get_user_metadata` so the default propagates through the same
 * persistence layer the dashboard's JS layer reads from. The JS side stays
 * oblivious: a default and a user-saved preference look identical at the
 * preferences-store boundary. Each preference key is evaluated independently,
 * so customizing one key never suppresses defaults registered for another.
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
function inject_dashboard_preference_defaults( $value, $user_id, $meta_key ) {
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

	$defaults = get_dashboard_preference_defaults_for( DASHBOARD_NAME );
	if ( empty( $defaults ) ) {
		return $value;
	}

	if ( ! isset( $base[ DASHBOARD_LAYOUT_SCOPE ] ) || ! is_array( $base[ DASHBOARD_LAYOUT_SCOPE ] ) ) {
		$base[ DASHBOARD_LAYOUT_SCOPE ] = array();
	}

	$updated = false;

	foreach ( $defaults as $preference_key => $default_value ) {
		if ( ! is_string( $preference_key ) || '' === $preference_key ) {
			continue;
		}

		$committed = $base[ DASHBOARD_LAYOUT_SCOPE ][ $preference_key ] ?? null;
		if ( ! empty( $committed ) ) {
			continue;
		}

		$base[ DASHBOARD_LAYOUT_SCOPE ][ $preference_key ] = $default_value;
		$updated = true;
	}

	if ( ! $updated ) {
		return $value;
	}

	return array( $base );
}
add_filter( 'get_user_metadata', __NAMESPACE__ . '\\inject_dashboard_preference_defaults', 99, 3 );

/**
 * Resolves preference defaults registered for a dashboard.
 *
 * @param string $dashboard_name Identifier of the dashboard.
 * @return array Associative array of preference key => default value.
 */
function get_dashboard_preference_defaults_for( $dashboard_name ) {
	/**
	 * Filters dashboard preference defaults served to users who have not
	 * customized the corresponding preference keys.
	 *
	 * @param array  $preference_defaults Associative array of preference key
	 *                                    => default value.
	 * @param string $dashboard_name      Identifier of the dashboard receiving
	 *                                    the defaults.
	 */
	$defaults = apply_filters( DASHBOARD_PREFERENCE_DEFAULTS_FILTER, array(), $dashboard_name );

	if ( ! is_array( $defaults ) ) {
		return array();
	}

	return $defaults;
}

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

	if ( ! in_array( 'default-locations-widget-instance', $uuids, true ) ) {
		$dashboard_layout[] = array(
			'uuid'      => 'default-locations-widget-instance',
			'type'      => 'jpa/locations',
			'placement' => array(
				'width'  => 2,
				'height' => 1,
				'order'  => 1,
			),
		);
	}

	return $dashboard_layout;
}
add_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, __NAMESPACE__ . '\\seed_default_dashboard_layout', 10, 2 );

/**
 * Adds the flat dashboard layout to the preference defaults.
 *
 * @param array  $preference_defaults Preference defaults from earlier callbacks.
 * @param string $dashboard_name      Identifier of the dashboard receiving the
 *                                    defaults.
 * @return array Preference defaults extended with the bundled dashboard layout.
 */
function seed_dashboard_layout_preference_default( $preference_defaults, $dashboard_name = '' ) {
	if ( DASHBOARD_NAME !== $dashboard_name ) {
		return $preference_defaults;
	}

	$default_layout = get_dashboard_default_layout_for( $dashboard_name );
	if ( ! empty( $default_layout ) ) {
		$preference_defaults[ DASHBOARD_LAYOUT_KEY ] = $default_layout;
	}

	return $preference_defaults;
}
add_filter( DASHBOARD_PREFERENCE_DEFAULTS_FILTER, __NAMESPACE__ . '\\seed_dashboard_layout_preference_default', 10, 2 );
