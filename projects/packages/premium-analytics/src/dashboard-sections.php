<?php
/**
 * Dashboard Sections: registry bootstrap and REST routes.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/dashboard-layout.php';
require_once __DIR__ . '/dashboard-grammar.php';
require_once __DIR__ . '/class-dashboard-section.php';
require_once __DIR__ . '/class-dashboard-section-registry.php';

/**
 * Filter through which WooCommerce section availability is resolved.
 */
const WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER = 'jetpack_premium_analytics_woocommerce_dashboard_section_available';

/**
 * Filter through which Subscribers section availability is resolved.
 */
const SUBSCRIBERS_DASHBOARD_SECTION_AVAILABLE_FILTER = 'jetpack_premium_analytics_subscribers_dashboard_section_available';

/**
 * Filter for Ads section availability.
 */
const ADS_DASHBOARD_SECTION_AVAILABLE_FILTER = 'jetpack_premium_analytics_ads_dashboard_section_available';

/**
 * Registers a dashboard section.
 *
 * @param string $dashboard_name Dashboard identifier.
 * @param string $id             Section identifier.
 * @param array  $args           Optional. Section arguments.
 * @return Dashboard_Section|false The registered section on success, or false on failure.
 */
function register_dashboard_section( $dashboard_name, $id, $args = array() ) {
	return Dashboard_Section_Registry::get_instance()->register( $dashboard_name, $id, $args );
}

/**
 * Retrieves a registered dashboard section.
 *
 * @param string $dashboard_name Dashboard identifier.
 * @param string $id             Section identifier.
 * @return Dashboard_Section|null The registered section, or null when absent.
 */
function get_registered_dashboard_section( $dashboard_name, $id ) {
	return Dashboard_Section_Registry::get_instance()->get_registered( $dashboard_name, $id );
}

/**
 * Retrieves available dashboard sections.
 *
 * @param string $dashboard_name Dashboard identifier.
 * @return Dashboard_Section[] Ordered list of available sections.
 */
function get_available_dashboard_sections( $dashboard_name ) {
	return Dashboard_Section_Registry::get_instance()->get_available_sections( $dashboard_name );
}

/**
 * Whether the WooCommerce dashboard section should be exposed.
 *
 * @return bool True when WooCommerce is active.
 */
function is_woocommerce_dashboard_section_available() {
	$is_available = class_exists( 'WooCommerce' ) || function_exists( 'WC' );

	/**
	 * Filters whether the WooCommerce dashboard section is available.
	 *
	 * @param bool $is_available Whether WooCommerce was detected in the current request.
	 */
	return (bool) apply_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, $is_available );
}

/**
 * Whether the current user should be shown the WooCommerce dashboard section.
 *
 * The sibling is_woocommerce_dashboard_section_available() answers "is
 * WooCommerce here"; this adds "and may this reader see store data".
 *
 * @since 0.1.0
 *
 * @return bool
 */
function is_woocommerce_dashboard_section_available_to_current_user() {
	return is_woocommerce_dashboard_section_available() && Capabilities::current_user_can_view_store_reports();
}

/**
 * Whether the Subscribers dashboard section should be exposed.
 *
 * Sites without Jetpack have no module state to check, so the section remains
 * available. Modules::is_active() also returns true on WPCOM Simple.
 *
 * @since 0.3.0
 *
 * @return bool True when the subscriptions module is active.
 */
function is_subscribers_dashboard_section_available() {
	$is_available = ! class_exists( 'Jetpack' ) || ( new Modules() )->is_active( 'subscriptions' );

	/**
	 * Filters whether the Subscribers dashboard section is available.
	 *
	 * @since 0.3.0
	 *
	 * @param bool $is_available Whether the subscriptions module was detected in the current request.
	 */
	return (bool) apply_filters( SUBSCRIBERS_DASHBOARD_SECTION_AVAILABLE_FILTER, $is_available );
}

/**
 * Whether the Ads dashboard section is available.
 *
 * WPCOM reads the plan feature rather than the module, which is a false negative
 * on Atomic and meaningless on Simple. Mirrors is_videopress_available().
 *
 * @since 0.4.0
 *
 * @return bool True when the site can produce WordAds earnings.
 */
function is_ads_dashboard_section_available() {
	if ( ( new Host() )->is_wpcom_platform() ) {
		$is_available = function_exists( 'wpcom_site_has_feature' ) && \wpcom_site_has_feature( 'wordads' );
	} else {
		$is_available = ! class_exists( 'Jetpack' ) || ( new Modules() )->is_active( 'wordads' );
	}

	/**
	 * Filters whether the Ads dashboard section is available.
	 *
	 * @since 0.4.0
	 *
	 * @param bool $is_available Whether WordAds was detected in the current request.
	 */
	return (bool) apply_filters( ADS_DASHBOARD_SECTION_AVAILABLE_FILTER, $is_available );
}

/**
 * Whether the current user can access the Ads dashboard section.
 *
 * @since 0.4.0
 *
 * @return bool
 */
function is_ads_dashboard_section_available_to_current_user() {
	return is_ads_dashboard_section_available() && Capabilities::current_user_can_view_ad_reports();
}

/**
 * Returns the default widget layout for the WooCommerce dashboard section.
 *
 * @return array Array of widget instances.
 */
function get_woocommerce_dashboard_section_default_layout() {
	return get_dashboard_default_layout_for( 'woocommerce/store' );
}

/**
 * Registers the default Premium Analytics dashboard sections.
 *
 * @return void
 */
function register_default_dashboard_sections() {
	$registry = Dashboard_Section_Registry::get_instance();

	$sections = array(
		'analytics/traffic'     => array(
			'label'          => __( 'Traffic', 'jetpack-premium-analytics-pkg' ),
			'title'          => __( 'Site traffic', 'jetpack-premium-analytics-pkg' ),
			'description'    => __( 'Views, visitors, and where they came from.', 'jetpack-premium-analytics-pkg' ),
			'order'          => 10,
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/traffic' );
			},
		),
		'analytics/insights'    => array(
			'label'               => __( 'Insights', 'jetpack-premium-analytics-pkg' ),
			'title'               => __( 'Activity insights', 'jetpack-premium-analytics-pkg' ),
			'description'         => __( 'Longer-term patterns in your content and audience.', 'jetpack-premium-analytics-pkg' ),
			'order'               => 20,
			// Insights reads whole history: all time and single years instead of
			// the rolling picker, with nothing to compare them against.
			'date_filter'         => Dashboard_Section::DATE_FILTER_YEAR,
			'date_filter_options' => array(
				'with_date_comparison' => false,
			),
			'default_layout'      => static function () {
				return get_dashboard_default_layout_for( 'analytics/insights' );
			},
		),
		'analytics/subscribers' => array(
			'label'          => __( 'Subscribers', 'jetpack-premium-analytics-pkg' ),
			'title'          => __( 'Subscribers stats', 'jetpack-premium-analytics-pkg' ),
			'description'    => __( 'How your subscriber list is growing, and how your emails land.', 'jetpack-premium-analytics-pkg' ),
			'order'          => 30,
			'is_available'   => __NAMESPACE__ . '\\is_subscribers_dashboard_section_available',
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/subscribers' );
			},
		),
		// Store registers no heading of its own, so it falls back to the label.
		'woocommerce/store'     => array(
			'label'          => __( 'Store', 'jetpack-premium-analytics-pkg' ),
			'description'    => __( 'Sales, orders, and what your customers are buying.', 'jetpack-premium-analytics-pkg' ),
			'order'          => 40,
			'is_available'   => __NAMESPACE__ . '\\is_woocommerce_dashboard_section_available_to_current_user',
			// Nothing backfills historical orders to WordPress.com but the analytics
			// full sync. The site sections above read data it already holds.
			'requires_sync'  => true,
			'default_layout' => __NAMESPACE__ . '\\get_woocommerce_dashboard_section_default_layout',
		),
		'analytics/ads'         => array(
			'label'          => __( 'Ads', 'jetpack-premium-analytics-pkg' ),
			'description'    => __( 'How your ads are performing, and what they have earned you.', 'jetpack-premium-analytics-pkg' ),
			'order'          => 50,
			'is_available'   => __NAMESPACE__ . '\\is_ads_dashboard_section_available_to_current_user',
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/ads' );
			},
		),
	);

	foreach ( $sections as $id => $args ) {
		if ( ! $registry->is_registered( DASHBOARD_NAME, $id ) ) {
			register_dashboard_section( DASHBOARD_NAME, $id, $args );
		}
	}
}

/**
 * Hydrates the dashboard section registry.
 *
 * @return void
 */
function bootstrap_dashboard_sections() {
	if ( did_action( 'init' ) ) {
		register_default_dashboard_sections();
	} else {
		add_action( 'init', __NAMESPACE__ . '\\register_default_dashboard_sections' );
	}
}

/**
 * Whether the current user can access dashboard section routes.
 *
 * @return bool
 */
function check_dashboard_sections_permission() {
	return Capabilities::current_user_can_view_analytics();
}

/**
 * Resolves a route section, including availability checks.
 *
 * @param string $dashboard_name Dashboard identifier.
 * @param string $section_id     Section identifier.
 * @return Dashboard_Section|\WP_Error Registered available section, or error.
 */
function get_available_dashboard_section_for_route( $dashboard_name, $section_id ) {
	$section = get_registered_dashboard_section( $dashboard_name, $section_id );

	if ( ! $section ) {
		return new \WP_Error(
			'dashboard_section_not_found',
			__( 'Dashboard section not found.', 'jetpack-premium-analytics-pkg' ),
			array( 'status' => 404 )
		);
	}

	if ( ! $section->is_available() ) {
		return new \WP_Error(
			'dashboard_section_unavailable',
			__( 'Dashboard section is not available.', 'jetpack-premium-analytics-pkg' ),
			array( 'status' => 404 )
		);
	}

	return $section;
}

/**
 * REST schema for one dashboard section, as returned by the sections route.
 *
 * The dashboard's frontend mirrors this shape in
 * `routes/dashboard/config/sections.ts`, and WPCOM serves the same route for
 * Simple sites (see AGENTS.md), so both are consumers of this contract.
 *
 * @since 0.2.0
 *
 * @return array The JSON schema for a dashboard section.
 */
function get_dashboard_section_schema() {
	return array(
		'$schema'    => 'http://json-schema.org/draft-04/schema#',
		'title'      => 'jetpack-premium-analytics-dashboard-section',
		'type'       => 'object',
		'properties' => array(
			'id'                  => array(
				'description' => __( 'Namespaced section identifier.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'string',
				'readonly'    => true,
			),
			'slug'                => array(
				'description' => __( 'URL-facing section slug, derived from the identifier.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'string',
				'readonly'    => true,
			),
			'label'               => array(
				'description' => __( 'Translated display label, naming the section tab.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'string',
				'readonly'    => true,
			),
			'title'               => array(
				'description' => __( 'Translated section heading, distinct from the tab label. Null falls back to the label.', 'jetpack-premium-analytics-pkg' ),
				'type'        => array( 'string', 'null' ),
				'readonly'    => true,
			),
			'description'         => array(
				'description' => __( 'Translated section description, shown as the page subtitle while the section is active.', 'jetpack-premium-analytics-pkg' ),
				'type'        => array( 'string', 'null' ),
				'readonly'    => true,
			),
			'order'               => array(
				'description' => __( 'Sort order, ascending.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'integer',
				'readonly'    => true,
			),
			'date_filter'         => array(
				'description' => __( 'Which date filter the section header offers: the rolling date range, or all time plus single years.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'string',
				'enum'        => Dashboard_Section::DATE_FILTERS,
				'default'     => Dashboard_Section::DATE_FILTER_RANGE,
				'readonly'    => true,
			),
			'date_filter_options' => array(
				'description' => __( 'Which optional controls the section date filter offers.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'object',
				'properties'  => array(
					'with_date_comparison' => array(
						'description' => __( 'Whether the section header offers the period-over-period comparison control.', 'jetpack-premium-analytics-pkg' ),
						'type'        => 'boolean',
						'default'     => true,
					),
				),
				'readonly'    => true,
			),
			'requires_sync'       => array(
				'description' => __( 'Whether the section\'s numbers stay incomplete until the analytics initial full sync has finished.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'boolean',
				'default'     => false,
				'readonly'    => true,
			),
			'default_layout'      => array(
				'description' => __( 'Bundled default widget layout.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'object' ),
				'readonly'    => true,
			),
		),
	);
}

/**
 * REST callback returning available dashboard sections.
 *
 * @param \WP_REST_Request $request REST request carrying the dashboard name.
 * @return \WP_REST_Response
 */
function get_dashboard_sections_response( $request ) {
	$sections = array_map(
		static function ( Dashboard_Section $section ) {
			return $section->to_array();
		},
		get_available_dashboard_sections( $request['name'] )
	);

	return rest_ensure_response( $sections );
}

/**
 * REST callback returning a section's default layout.
 *
 * @param \WP_REST_Request $request REST request carrying dashboard and section identifiers.
 * @return \WP_REST_Response|\WP_Error
 */
function get_dashboard_section_default_layout_response( $request ) {
	$section = get_available_dashboard_section_for_route( $request['name'], $request['section'] );

	if ( is_wp_error( $section ) ) {
		return $section;
	}

	return rest_ensure_response( $section->get_default_layout() );
}

/**
 * Registers dashboard section REST routes.
 *
 * @return void
 */
function register_dashboard_sections_rest_routes() {
	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/dashboards/(?P<name>' . get_dashboard_name_pattern() . ')/sections',
		array(
			array(
				// A route-level `schema` beside the numerically keyed endpoint list is
				// register_rest_route()'s own signature, reading to Phan as a mixed array.
				// @phan-suppress-next-line PhanPluginMixedKeyNoKey
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __NAMESPACE__ . '\\get_dashboard_sections_response',
				'permission_callback' => __NAMESPACE__ . '\\check_dashboard_sections_permission',
				'args'                => array(
					'name' => array(
						'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'jetpack-premium-analytics-pkg' ),
						'type'        => 'string',
					),
				),
			),
			'schema' => __NAMESPACE__ . '\\get_dashboard_section_schema',
		)
	);

	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/dashboards/(?P<name>' . get_dashboard_name_pattern() . ')/sections/(?P<section>' . get_dashboard_section_id_pattern() . ')/default-layout',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_dashboard_section_default_layout_response',
			'permission_callback' => __NAMESPACE__ . '\\check_dashboard_sections_permission',
			'args'                => array(
				'name'    => array(
					'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'jetpack-premium-analytics-pkg' ),
					'type'        => 'string',
				),
				'section' => array(
					'description' => __( 'Dashboard section identifier.', 'jetpack-premium-analytics-pkg' ),
					'type'        => 'string',
				),
			),
		)
	);
}

bootstrap_dashboard_sections();
