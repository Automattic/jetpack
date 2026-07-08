<?php
/**
 * Dashboard Sections: registry bootstrap and REST routes.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-layout.php';
require_once __DIR__ . '/class-dashboard-section.php';
require_once __DIR__ . '/class-dashboard-section-registry.php';

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
 * Registers the default Premium Analytics dashboard sections.
 *
 * @return void
 */
function register_default_dashboard_sections() {
	$registry = Dashboard_Section_Registry::get_instance();

	$sections = array(
		'analytics/traffic'     => array(
			'label'          => __( 'Traffic', 'jetpack-premium-analytics' ),
			'order'          => 10,
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( DASHBOARD_NAME );
			},
		),
		'analytics/insights'    => array(
			'label' => __( 'Insights', 'jetpack-premium-analytics' ),
			'order' => 20,
		),
		'analytics/subscribers' => array(
			'label' => __( 'Subscribers', 'jetpack-premium-analytics' ),
			'order' => 30,
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
	return current_user_can( 'manage_options' );
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
	$section = get_registered_dashboard_section( $request['name'], $request['section'] );

	if ( ! $section ) {
		return new \WP_Error(
			'dashboard_section_not_found',
			__( 'Dashboard section not found.', 'jetpack-premium-analytics' ),
			array( 'status' => 404 )
		);
	}

	if ( ! $section->is_available() ) {
		return new \WP_Error(
			'dashboard_section_unavailable',
			__( 'Dashboard section is not available.', 'jetpack-premium-analytics' ),
			array( 'status' => 404 )
		);
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
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_dashboard_sections_response',
			'permission_callback' => __NAMESPACE__ . '\\check_dashboard_sections_permission',
			'args'                => array(
				'name' => array(
					'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'jetpack-premium-analytics' ),
					'type'        => 'string',
				),
			),
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

bootstrap_dashboard_sections();
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_dashboard_sections_rest_routes' );
