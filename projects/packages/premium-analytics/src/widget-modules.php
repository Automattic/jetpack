<?php
/**
 * Dashboard widget modules: REST exposure + import-map wiring.
 *
 * Reads get_available_widget_types() and exposes it two ways: the `/wpcom/v2/widget-modules`
 * REST list, and the page import map, for dynamic `import()`.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/rest-namespace.php';

/**
 * Register the `/wpcom/v2/widget-modules` REST route.
 *
 * @return void
 */
function register_widget_modules_rest_route() {
	register_rest_route(
		DASHBOARD_REST_NAMESPACE,
		'/widget-modules',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_widget_modules_response',
			'permission_callback' => array( Capabilities::class, 'current_user_can_view_analytics' ),
		)
	);
}

/**
 * Load and hydrate the widget type registry, once.
 *
 * Deferred to the registry's only two readers rather than run at boot: on Simple this file's
 * registration runs on every WPCOM public-api request, and most never read the registry.
 *
 * @return void
 */
function ensure_widget_registry_ready() {
	static $ready = false;
	if ( $ready ) {
		return;
	}
	$ready = true;

	require_once __DIR__ . '/widget-types.php';
	require_once __DIR__ . '/widget-availability.php';

	// REST does not load the admin build, so this require is the manifest's only route in
	// (WOOA7S-1804). Drop it and every widget renders "Widget is no longer available" (#49961).
	$widgets_manifest = Analytics::widget_manifest_path();
	if ( file_exists( $widgets_manifest ) ) {
		require_once $widgets_manifest;
	}

	bootstrap_widget_types();
}

/**
 * Build the REST response: one record per available widget type.
 *
 * @return \WP_REST_Response
 */
function get_widget_modules_response() {
	ensure_widget_registry_ready();

	$records = array();

	foreach ( get_available_widget_types() as $widget_type ) {
		$records[] = array(
			'name'          => $widget_type->name,
			'render_module' => $widget_type->render_module,
			'widget_module' => $widget_type->widget_module,
			'presentation'  => $widget_type->presentation,
			'category'      => $widget_type->category,
			'title'         => $widget_type->title,
			'description'   => $widget_type->description,
			'help'          => $widget_type->help,
			'keywords'      => $widget_type->keywords,
		);
	}

	return rest_ensure_response( $records );
}

/**
 * Add available widget modules to the page import map as dynamic dependencies,
 * so the client can `import()` them on demand.
 *
 * @param array $boot_dependencies Boot dependencies for the page.
 * @return array Updated boot dependencies.
 */
function add_widget_modules_to_boot_deps( $boot_dependencies ) {
	ensure_widget_registry_ready();

	foreach ( get_available_widget_types() as $widget_type ) {
		if ( ! empty( $widget_type->render_module ) ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget_type->render_module,
			);
		}

		if ( ! empty( $widget_type->widget_module ) ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget_type->widget_module,
			);
		}
	}

	return $boot_dependencies;
}
add_filter( 'jetpack-premium-analytics-wp-admin_boot_dependencies', __NAMESPACE__ . '\\add_widget_modules_to_boot_deps' );
