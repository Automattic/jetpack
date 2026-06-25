<?php
/**
 * Dashboard Sections: Premium Analytics per-section layout defaults.
 *
 * Seeds a section-to-layout preference map so the dashboard's section tabs can
 * start from tailored bundled layouts instead of falling back to the flat
 * dashboard-wide default.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Preferences key under DASHBOARD_LAYOUT_SCOPE that holds per-section layouts.
 */
const DASHBOARD_SECTION_LAYOUTS_KEY = 'dashboardSectionLayouts';

/**
 * Filter through which per-section default layouts are resolved.
 */
const DASHBOARD_SECTION_LAYOUTS_FILTER = 'jetpack_premium_analytics_dashboard_section_layouts';

/**
 * Returns the bundled section layouts for the Premium Analytics dashboard.
 *
 * Section IDs mirror `routes/dashboard/config/sections.ts`.
 *
 * @param string $dashboard_name Identifier of the dashboard.
 * @return array Section ID => widget layout array.
 */
function get_bundled_dashboard_section_layouts( $dashboard_name ) {
	if ( DASHBOARD_NAME !== $dashboard_name ) {
		return array();
	}

	return array(
		'traffic'     => array(
			array(
				'uuid'      => 'default-locations-widget-instance',
				'type'      => 'jpa/locations',
				'placement' => array(
					'width'  => 2,
					'height' => 1,
					'order'  => 0,
				),
			),
		),
		'insights'    => array(),
		'subscribers' => array(),
		'store'       => array(),
	);
}

/**
 * Resolves per-section default layouts registered for a dashboard.
 *
 * @param string $dashboard_name Identifier of the dashboard.
 * @return array Section ID => widget layout array.
 */
function get_dashboard_section_layouts_for( $dashboard_name ) {
	/**
	 * Filters per-section default layouts served to users who have not
	 * customized their section layout preference.
	 *
	 * Each top-level key is a dashboard section ID. Each value is a widget
	 * layout array using the dashboard widget instance shape: `uuid`, `type`,
	 * optional `attributes`, optional `placement`.
	 *
	 * @param array  $section_layouts Section ID => widget layout array.
	 * @param string $dashboard_name  Identifier of the dashboard receiving the
	 *                                defaults.
	 */
	$section_layouts = apply_filters(
		DASHBOARD_SECTION_LAYOUTS_FILTER,
		get_bundled_dashboard_section_layouts( $dashboard_name ),
		$dashboard_name
	);

	if ( ! is_array( $section_layouts ) ) {
		return array();
	}

	$normalized = array();
	foreach ( $section_layouts as $section_id => $layout ) {
		if ( ! is_string( $section_id ) || '' === $section_id || ! is_array( $layout ) ) {
			continue;
		}

		$normalized[ $section_id ] = array_values( $layout );
	}

	return $normalized;
}

/**
 * Resolves the default layout for a specific dashboard section.
 *
 * A present section key is authoritative even when its layout is an empty
 * array. Missing section keys fall back to the flat dashboard default so older
 * callers still have a sensible reset target.
 *
 * @param string $dashboard_name Identifier of the dashboard.
 * @param string $section_id     Dashboard section ID.
 * @return array Widget layout array.
 */
function get_dashboard_section_default_layout_for( $dashboard_name, $section_id ) {
	$section_layouts = get_dashboard_section_layouts_for( $dashboard_name );

	if ( is_string( $section_id ) && array_key_exists( $section_id, $section_layouts ) ) {
		return $section_layouts[ $section_id ];
	}

	return get_dashboard_default_layout_for( $dashboard_name );
}

/**
 * REST callback returning the default layout for a requested dashboard section.
 *
 * @param \WP_REST_Request $request REST request carrying the dashboard and section names.
 * @return \WP_REST_Response Response wrapping the section default layout array.
 */
function get_dashboard_section_default_layout_response( $request ) {
	return rest_ensure_response(
		get_dashboard_section_default_layout_for( $request['name'], $request['section'] )
	);
}

/**
 * Registers the REST route that exposes per-section default layouts.
 *
 * @return void
 */
function register_dashboard_section_default_layout_route() {
	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/dashboards/(?P<name>[a-z][a-z0-9-]*(?:_[a-z0-9-]+)+)/sections/(?P<section>[a-z][a-z0-9-]*)/default-layout',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_dashboard_section_default_layout_response',
			'permission_callback' => static function () {
				return current_user_can( 'manage_options' );
			},
			'args'                => array(
				'name'    => array(
					'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'jetpack-premium-analytics' ),
					'type'        => 'string',
				),
				'section' => array(
					'description' => __( 'Dashboard section identifier.', 'jetpack-premium-analytics' ),
					'type'        => 'string',
				),
			),
		)
	);
}
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_dashboard_section_default_layout_route' );

/**
 * Adds section layouts to the dashboard preference defaults.
 *
 * @param array  $preference_defaults Preference defaults from earlier callbacks.
 * @param string $dashboard_name      Identifier of the dashboard receiving the
 *                                    defaults.
 * @return array Preference defaults extended with section layouts.
 */
function seed_dashboard_section_layouts_preference_default( $preference_defaults, $dashboard_name = '' ) {
	if ( DASHBOARD_NAME !== $dashboard_name ) {
		return $preference_defaults;
	}

	$preference_defaults[ DASHBOARD_SECTION_LAYOUTS_KEY ] = get_dashboard_section_layouts_for( $dashboard_name );

	return $preference_defaults;
}
add_filter( DASHBOARD_PREFERENCE_DEFAULTS_FILTER, __NAMESPACE__ . '\\seed_dashboard_section_layouts_preference_default', 10, 2 );
