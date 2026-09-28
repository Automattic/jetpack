<?php
/**
 * Dashboard Sections API: the registry helpers, the preview scope, and the REST routes.
 *
 * The package's own sections register through this API from default-dashboard-sections.php,
 * the same way a plugin extending the dashboard does.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-layout.php';
require_once __DIR__ . '/dashboard-grammar.php';
require_once __DIR__ . '/rest-namespace.php';
require_once __DIR__ . '/class-dashboard-section.php';
require_once __DIR__ . '/class-dashboard-section-registry.php';

// Guarded on a symbol the file declares, so a second copy of the package can't redeclare it.
if ( ! function_exists( __NAMESPACE__ . '\\register_dashboard_feature_flags' ) ) {
	require_once __DIR__ . '/dashboard-policy.php';
}

/**
 * Filter through which the preview's section scope is resolved.
 */
const DASHBOARD_PREVIEW_SCOPE_FILTER = 'jetpack_premium_analytics_dashboard_preview_scope';

/**
 * Section slugs the customer preview exposes as tabs. A section still rolling out to some
 * sites is opened through the filter instead. Widget types are registered independently of
 * this, as they are of the per-section availability checks.
 */
const PREVIEW_SECTIONS = array( 'traffic', 'insights', 'subscribers', 'ads' );

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
 * Whether the dashboard is running as the customer-facing preview.
 *
 * The site's own opt-in means the preview. Anything else that switches the dashboard on, the
 * WordPress.com blog sticker or the `jetpack_premium_analytics_enabled` filter, means us.
 *
 * @since 0.6.0
 *
 * @return bool
 */
function is_dashboard_preview_scoped() {
	return (bool) get_option( Enablement_Setting::ENABLED_OPTION );
}

/**
 * Whether the preview exposes a dashboard section.
 *
 * @since 0.6.0
 *
 * @param string $dashboard_name Dashboard identifier. Only this package's own dashboard is scoped.
 * @param string $slug           URL-facing section slug.
 * @return bool
 */
function is_dashboard_section_in_preview_scope( $dashboard_name, $slug ) {
	$in_scope = DASHBOARD_NAME !== $dashboard_name
		|| ! is_dashboard_preview_scoped()
		|| in_array( $slug, PREVIEW_SECTIONS, true )
		|| is_dashboard_unlocked_for_a11n();

	/**
	 * Filters whether the preview exposes a dashboard section.
	 *
	 * `__return_true` restores the whole dashboard, which is how a development or test site
	 * sees every tab.
	 *
	 * @since 0.6.0
	 *
	 * @param bool   $in_scope       Whether the preview exposes the section.
	 * @param string $slug           URL-facing section slug.
	 * @param string $dashboard_name Dashboard the section belongs to.
	 */
	return (bool) apply_filters( DASHBOARD_PREVIEW_SCOPE_FILTER, $in_scope, $slug, $dashboard_name );
}

/**
 * Slugs of the tabs the dashboard exposes, for the client's report routes.
 *
 * Reads the same sections the tab list does, so a report cannot outlive the tab it sits
 * behind. Null, never `array()`, while nothing is registered: an empty array is a
 * published scope that exposes nothing.
 *
 * @since 0.6.0
 *
 * @return string[]|null
 */
function get_dashboard_preview_scope_sections() {
	$registry = Dashboard_Section_Registry::get_instance();

	if ( empty( $registry->get_all_registered( DASHBOARD_NAME ) ) ) {
		return null;
	}

	return array_map(
		static function ( Dashboard_Section $section ) {
			return $section->slug;
		},
		$registry->get_available_sections( DASHBOARD_NAME )
	);
}

/**
 * Configures the preview scope script data.
 *
 * @since 0.6.0
 *
 * @return void
 */
function configure_dashboard_preview_scope() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_preview_scope_script_data', 20 );
}

/**
 * Injects the preview's section scope into JetpackScriptData.
 *
 * The same list travels over REST for the tab bar, but a report route reads no REST before
 * choosing its redirect, so it reads the scope from boot data instead.
 *
 * @since 0.6.0
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_dashboard_preview_scope_script_data( array $data ): array {
	$sections = get_dashboard_preview_scope_sections();

	if ( null === $sections ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['preview_sections'] = $sections;

	return $data;
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
 * Mirrored by the frontend's `sections.ts` and reused by WPCOM for Simple sites (see AGENTS.md).
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
			'order'               => array(
				'description' => __( 'Sort order, ascending.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'integer',
				'readonly'    => true,
			),
			'date_filter'         => array(
				'description' => __( 'Which shape the section date filter takes: the rolling date range, or all time plus single years.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'string',
				'enum'        => Dashboard_Section::DATE_FILTERS,
				'default'     => Dashboard_Section::DATE_FILTER_RANGE,
				'readonly'    => true,
			),
			'date_filter_options' => array(
				'description' => __( 'What the section date filter supports, and where it renders.', 'jetpack-premium-analytics-pkg' ),
				'type'        => 'object',
				'properties'  => array(
					'with_date_comparison'     => array(
						'description' => __( 'Whether the section supports period-over-period comparison at all. When false, no widget in the section receives comparison parameters.', 'jetpack-premium-analytics-pkg' ),
						'type'        => 'boolean',
						'default'     => true,
					),
					'with_header_date_control' => array(
						'description' => __( 'Whether the section header renders the date control. When false, the section widgets host their own.', 'jetpack-premium-analytics-pkg' ),
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
				// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- register_rest_route()'s own signature mixes a numerically keyed endpoint list with a route-level `schema` key.
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
