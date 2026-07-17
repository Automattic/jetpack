<?php
/**
 * Dashboard Sections: registry bootstrap and REST routes.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-layout.php';
require_once __DIR__ . '/dashboard-grammar.php';
require_once __DIR__ . '/class-dashboard-section.php';
require_once __DIR__ . '/class-dashboard-section-registry.php';

/**
 * Filter through which WooCommerce section availability is resolved.
 */
const WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER = 'jetpack_premium_analytics_woocommerce_dashboard_section_available';

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
			'label'          => __( 'Traffic', 'jetpack-premium-analytics' ),
			'order'          => 10,
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/traffic' );
			},
		),
		'analytics/insights'    => array(
			'label'          => __( 'Insights', 'jetpack-premium-analytics' ),
			'order'          => 20,
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/insights' );
			},
		),
		'analytics/subscribers' => array(
			'label'          => __( 'Subscribers', 'jetpack-premium-analytics' ),
			'order'          => 30,
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/subscribers' );
			},
		),
		'woocommerce/store'     => array(
			'label'          => __( 'WooCommerce', 'jetpack-premium-analytics' ),
			'order'          => 40,
			'is_available'   => __NAMESPACE__ . '\\is_woocommerce_dashboard_section_available',
			'default_layout' => __NAMESPACE__ . '\\get_woocommerce_dashboard_section_default_layout',
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
 * Gets the user meta key used by the WordPress preferences store.
 *
 * @global \wpdb $wpdb WordPress database abstraction object.
 *
 * @return string Persisted preferences user meta key.
 */
function get_persisted_preferences_meta_key() {
	global $wpdb;

	return $wpdb->get_blog_prefix() . 'persisted_preferences';
}

/**
 * Reads the raw stored preferences for a user.
 *
 * The dashboard default layout is injected through the same user meta key at
 * read time. Section layout writes need the committed value only, otherwise a
 * section-only update can accidentally persist that synthetic default layout.
 *
 * @param int $user_id User ID.
 * @return array Preferences array.
 */
function get_stored_persisted_preferences_for_user( $user_id ) {
	$default_layout_filter = __NAMESPACE__ . '\\inject_dashboard_default_layout';
	$removed_filter        = remove_filter( 'get_user_metadata', $default_layout_filter, 99 );

	$preferences = get_user_meta( $user_id, get_persisted_preferences_meta_key(), true );

	if ( $removed_filter ) {
		add_filter( 'get_user_metadata', $default_layout_filter, 99, 3 );
	}

	return is_array( $preferences ) ? $preferences : array();
}

/**
 * Reads stored dashboard section layouts for a user.
 *
 * Invalid or stale section layout entries are ignored while preserving the
 * missing-key semantics used by the section API.
 *
 * @param int $user_id User ID.
 * @return array<string,array> Map of section IDs to custom layouts.
 */
function get_dashboard_section_layouts_for_user( $user_id ) {
	$preferences = get_stored_persisted_preferences_for_user( $user_id );
	$scope       = $preferences[ DASHBOARD_LAYOUT_SCOPE ] ?? array();

	if ( ! is_array( $scope ) ) {
		return array();
	}

	$layouts = $scope[ DASHBOARD_SECTION_LAYOUTS_KEY ] ?? array();

	if ( ! is_array( $layouts ) ) {
		return array();
	}

	$normalized = array();

	foreach ( $layouts as $section_id => $layout ) {
		if (
			is_string( $section_id )
			&& 1 === preg_match( '/^' . get_dashboard_section_id_pattern() . '$/', $section_id )
			&& is_dashboard_section_layout( $layout )
		) {
			$normalized[ $section_id ] = array_values( $layout );
		}
	}

	return $normalized;
}

/**
 * Persists a custom dashboard section layout for a user.
 *
 * @param int    $user_id    User ID.
 * @param string $section_id Section identifier.
 * @param array  $layout     Widget layout.
 * @return bool True when the write completed or the stored value was unchanged.
 */
function update_dashboard_section_layout_for_user( $user_id, $section_id, $layout ) {
	$preferences = get_stored_persisted_preferences_for_user( $user_id );
	$original    = $preferences;

	if ( ! isset( $preferences[ DASHBOARD_LAYOUT_SCOPE ] ) || ! is_array( $preferences[ DASHBOARD_LAYOUT_SCOPE ] ) ) {
		$preferences[ DASHBOARD_LAYOUT_SCOPE ] = array();
	}

	if (
		! isset( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] )
		|| ! is_array( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] )
	) {
		$preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] = array();
	}

	$preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ][ $section_id ] = array_values( $layout );

	if ( $preferences === $original ) {
		return true;
	}

	$updated = update_user_meta( $user_id, get_persisted_preferences_meta_key(), $preferences );

	return false !== $updated;
}

/**
 * Removes a custom dashboard section layout for a user.
 *
 * @param int    $user_id    User ID.
 * @param string $section_id Section identifier.
 * @return bool True when the reset completed or there was nothing to reset.
 */
function delete_dashboard_section_layout_for_user( $user_id, $section_id ) {
	$preferences = get_stored_persisted_preferences_for_user( $user_id );

	if (
		! isset( $preferences[ DASHBOARD_LAYOUT_SCOPE ] )
		|| ! is_array( $preferences[ DASHBOARD_LAYOUT_SCOPE ] )
		|| ! isset( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] )
		|| ! is_array( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] )
	) {
		return true;
	}

	if ( ! array_key_exists( $section_id, $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] ) ) {
		return true;
	}

	unset( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ][ $section_id ] );

	if ( empty( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] ) ) {
		unset( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] );
	}

	$updated = update_user_meta( $user_id, get_persisted_preferences_meta_key(), $preferences );

	return false !== $updated;
}

/**
 * Removes all custom dashboard section layouts for a user.
 *
 * @param int $user_id User ID.
 * @return bool True when the reset completed or there was nothing to reset.
 */
function delete_dashboard_section_layouts_for_user( $user_id ) {
	$preferences = get_stored_persisted_preferences_for_user( $user_id );

	if (
		! isset( $preferences[ DASHBOARD_LAYOUT_SCOPE ] )
		|| ! is_array( $preferences[ DASHBOARD_LAYOUT_SCOPE ] )
		|| ! isset( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] )
	) {
		return true;
	}

	unset( $preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ] );

	if ( empty( $preferences[ DASHBOARD_LAYOUT_SCOPE ] ) ) {
		unset( $preferences[ DASHBOARD_LAYOUT_SCOPE ] );
	}

	$updated = update_user_meta( $user_id, get_persisted_preferences_meta_key(), $preferences );

	return false !== $updated;
}

/**
 * Checks whether a value is a valid dashboard section layout.
 *
 * @param mixed $layout Candidate layout.
 * @return bool True when the value is a list of widget instances.
 */
function is_dashboard_section_layout( $layout ) {
	if ( ! is_array( $layout ) ) {
		return false;
	}

	$expected_key = 0;

	foreach ( $layout as $key => $widget ) {
		if ( $key !== $expected_key ) {
			return false;
		}

		++$expected_key;

		if ( ! is_array( $widget ) ) {
			return false;
		}

		if ( ! isset( $widget['uuid'] ) || ! is_string( $widget['uuid'] ) || '' === $widget['uuid'] ) {
			return false;
		}

		if ( ! isset( $widget['type'] ) || ! is_string( $widget['type'] ) || '' === $widget['type'] ) {
			return false;
		}

		if ( isset( $widget['placement'] ) && ! is_array( $widget['placement'] ) ) {
			return false;
		}

		if ( isset( $widget['attributes'] ) && ! is_array( $widget['attributes'] ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Validates a dashboard section layout REST argument.
 *
 * @param mixed $value Candidate layout.
 * @return true|\WP_Error True when valid, otherwise an error.
 */
function validate_dashboard_section_layout( $value ) {
	if ( is_dashboard_section_layout( $value ) ) {
		return true;
	}

	return new \WP_Error(
		'invalid_dashboard_section_layout',
		__( 'Dashboard section layout must be an array of widget instances.', 'jetpack-premium-analytics' )
	);
}

/**
 * Sanitizes a dashboard section layout REST argument.
 *
 * @param mixed $value Candidate layout.
 * @return array Layout array.
 */
function sanitize_dashboard_section_layout( $value ) {
	return is_array( $value ) ? array_values( $value ) : array();
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

	return $section;
}

/**
 * Builds the public REST representation for a dashboard section.
 *
 * @param Dashboard_Section $section         Dashboard section.
 * @param array             $section_layouts Map of section IDs to custom layouts.
 * @return array REST response data.
 */
function get_dashboard_section_response_data( Dashboard_Section $section, $section_layouts ) {
	$has_custom_layout = array_key_exists( $section->id, $section_layouts );
	$data              = $section->to_array();

	$data['layout']          = $has_custom_layout ? $section_layouts[ $section->id ] : $section->get_default_layout();
	$data['hasCustomLayout'] = $has_custom_layout;

	return $data;
}

/**
 * REST callback returning available dashboard sections.
 *
 * @param \WP_REST_Request $request REST request carrying the dashboard name.
 * @return \WP_REST_Response
 */
function get_dashboard_sections_response( $request ) {
	$section_layouts = get_dashboard_section_layouts_for_user( get_current_user_id() );
	$sections        = array_map(
		static function ( Dashboard_Section $section ) use ( $section_layouts ) {
			return get_dashboard_section_response_data( $section, $section_layouts );
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
 * REST callback persisting a dashboard section layout for the current user.
 *
 * @param \WP_REST_Request $request REST request carrying dashboard, section, and layout.
 * @return \WP_REST_Response|\WP_Error
 */
function update_dashboard_section_layout_response( $request ) {
	$section = get_available_dashboard_section_for_route( $request['name'], $request['section'] );

	if ( is_wp_error( $section ) ) {
		return $section;
	}

	$layout = sanitize_dashboard_section_layout( $request['layout'] );
	$user   = get_current_user_id();

	if ( ! update_dashboard_section_layout_for_user( $user, $section->id, $layout ) ) {
		return new \WP_Error(
			'dashboard_section_layout_update_failed',
			__( 'Could not update dashboard section layout.', 'jetpack-premium-analytics' ),
			array( 'status' => 500 )
		);
	}

	return rest_ensure_response(
		get_dashboard_section_response_data(
			$section,
			array( $section->id => $layout )
		)
	);
}

/**
 * REST callback removing a dashboard section layout customization for the current user.
 *
 * @param \WP_REST_Request $request REST request carrying dashboard and section identifiers.
 * @return \WP_REST_Response|\WP_Error
 */
function delete_dashboard_section_layout_response( $request ) {
	$section = get_available_dashboard_section_for_route( $request['name'], $request['section'] );

	if ( is_wp_error( $section ) ) {
		return $section;
	}

	$user = get_current_user_id();

	if ( ! delete_dashboard_section_layout_for_user( $user, $section->id ) ) {
		return new \WP_Error(
			'dashboard_section_layout_delete_failed',
			__( 'Could not reset dashboard section layout.', 'jetpack-premium-analytics' ),
			array( 'status' => 500 )
		);
	}

	return rest_ensure_response(
		get_dashboard_section_response_data(
			$section,
			get_dashboard_section_layouts_for_user( $user )
		)
	);
}

/**
 * REST callback removing all dashboard section layout customizations for the current user.
 *
 * @param \WP_REST_Request $request REST request carrying the dashboard identifier.
 * @return \WP_REST_Response|\WP_Error
 */
function delete_dashboard_sections_layouts_response( $request ) {
	if ( ! delete_dashboard_section_layouts_for_user( get_current_user_id() ) ) {
		return new \WP_Error(
			'dashboard_section_layout_delete_failed',
			__( 'Could not reset dashboard section layouts.', 'jetpack-premium-analytics' ),
			array( 'status' => 500 )
		);
	}

	return get_dashboard_sections_response( $request );
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
		'/dashboards/(?P<name>' . get_dashboard_name_pattern() . ')/sections',
		array(
			'methods'             => \WP_REST_Server::DELETABLE,
			'callback'            => __NAMESPACE__ . '\\delete_dashboard_sections_layouts_response',
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

	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/dashboards/(?P<name>' . get_dashboard_name_pattern() . ')/sections/(?P<section>' . get_dashboard_section_id_pattern() . ')/layout',
		array(
			'methods'             => 'PUT',
			'callback'            => __NAMESPACE__ . '\\update_dashboard_section_layout_response',
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
				'layout'  => array(
					'description'       => __( 'Widget layout to persist for the dashboard section.', 'jetpack-premium-analytics' ),
					'type'              => 'array',
					'required'          => true,
					'validate_callback' => __NAMESPACE__ . '\\validate_dashboard_section_layout',
					'sanitize_callback' => __NAMESPACE__ . '\\sanitize_dashboard_section_layout',
				),
			),
		)
	);

	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/dashboards/(?P<name>' . get_dashboard_name_pattern() . ')/sections/(?P<section>' . get_dashboard_section_id_pattern() . ')/layout',
		array(
			'methods'             => \WP_REST_Server::DELETABLE,
			'callback'            => __NAMESPACE__ . '\\delete_dashboard_section_layout_response',
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
