<?php
/**
 * Dashboard widget modules: REST exposure + import-map wiring.
 *
 * Reads get_available_widget_types() (the registry filtered by
 * widget-availability.php) and exposes it two ways: the
 * `/wpcom/v2/widget-modules` REST list, and the page import map, where each
 * widget's render and metadata modules are registered for dynamic `import()`.
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
 * Deferred to here (the registry's only two readers) instead of running
 * unconditionally at boot: this package boots on every request to a site
 * that has it active, and on WPCOM Simple this file's registration runs on
 * every public-api request across all of WPCOM, not just ones that touch
 * Premium Analytics. Most such requests never read the registry at all, so
 * parsing the widget manifest and hydrating it eagerly was wasted work.
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

	/**
	 * Filters the path to the generated widget manifest.
	 *
	 * Load-bearing since WOOA7S-1804: the build is otherwise admin-only, so on a
	 * REST request this require is the only thing that puts the manifest in
	 * reach. Drop it and every dashboard widget renders "Widget is no longer
	 * available" (the #49961 bug).
	 *
	 * @param string $path Absolute path to the manifest register_widget_types()
	 *                     reads. Absent without a JS build.
	 */
	$widgets_manifest = apply_filters(
		'jetpack_premium_analytics_widgets_manifest_path',
		__DIR__ . '/../build/widgets.php'
	);
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
// The full-page interceptor (page.php) renders via the `{page-id}` filter; the
// in-admin variant (page-wp-admin.php) uses the `{page-id}-wp-admin` filter. Hook
// both so the widget modules land in the import map regardless of which renders.
add_filter( 'jetpack-premium-analytics_boot_dependencies', __NAMESPACE__ . '\\add_widget_modules_to_boot_deps' );
add_filter( 'jetpack-premium-analytics-wp-admin_boot_dependencies', __NAMESPACE__ . '\\add_widget_modules_to_boot_deps' );
