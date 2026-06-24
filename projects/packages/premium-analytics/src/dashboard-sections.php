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
				'uuid'      => 'default-traffic-top-posts-widget-instance',
				'type'      => 'jpa/stats-top-posts',
				'placement' => array(
					'width'  => 1,
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
