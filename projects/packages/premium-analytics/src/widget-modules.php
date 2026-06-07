<?php
/**
 * Dashboard widget modules: REST exposure + import-map wiring.
 *
 * The wp-build-generated `build/widgets.php` registers each widget's render and
 * metadata as script modules and exposes `jpa_get_registered_widget_modules()`.
 * This file exposes that registry to the client through the
 * `/wp/v2/widget-modules` REST endpoint (read by the `widgetModule` core-data
 * entity in @automattic/jetpack-widget-primitives), and adds the modules to the
 * dashboard page's import map so the client can dynamically `import()` them on
 * demand.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Register the `/wp/v2/widget-modules` REST route.
 *
 * @return void
 */
function register_widget_modules_rest_route() {
	register_rest_route(
		'wp/v2',
		'/widget-modules',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\get_widget_modules_response',
			'permission_callback' => static function () {
				return current_user_can( 'manage_options' );
			},
		)
	);
}
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_widget_modules_rest_route' );

/**
 * Build the REST response: one record per registered widget.
 *
 * @return \WP_REST_Response
 */
function get_widget_modules_response() {
	$records = array();

	if ( function_exists( 'jpa_get_registered_widget_modules' ) ) {
		foreach ( jpa_get_registered_widget_modules() as $widget ) {
			if ( empty( $widget['name'] ) ) {
				continue;
			}
			$records[] = array(
				'name'          => $widget['name'],
				'render_module' => $widget['render_module'] ?? null,
				'widget_module' => $widget['widget_module'] ?? null,
				'presentation'  => $widget['presentation'] ?? null,
			);
		}
	}

	return rest_ensure_response( $records );
}

/**
 * Add registered widget modules to the dashboard page import map as dynamic
 * dependencies, so the client can `import()` them on demand.
 *
 * @param array $boot_dependencies Boot dependencies for the page.
 * @return array Updated boot dependencies.
 */
function add_widget_modules_to_boot_deps( $boot_dependencies ) {
	if ( ! function_exists( 'jpa_get_registered_widget_modules' ) ) {
		return $boot_dependencies;
	}

	foreach ( jpa_get_registered_widget_modules() as $widget ) {
		if ( ! empty( $widget['render_module'] ) ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget['render_module'],
			);
		}
		if ( ! empty( $widget['widget_module'] ) ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget['widget_module'],
			);
		}
	}

	return $boot_dependencies;
}
add_filter( 'jetpack-premium-analytics-wp-admin_boot_dependencies', __NAMESPACE__ . '\\add_widget_modules_to_boot_deps' );
