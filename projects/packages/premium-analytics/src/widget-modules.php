<?php
/**
 * Dashboard widget modules: REST exposure, import-map wiring and the page's boot preloads.
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
 * Load the widget type API and the build manifest, once, ahead of the registry's first read.
 *
 * Deferred to the registry's only two readers rather than run at boot: on Simple this file's
 * registration runs on every WPCOM public-api request, and most never read the registry. The
 * registry hydrates itself on that read, from the registration action.
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
			'icon'          => $widget_type->icon,
			'actions'       => $widget_type->actions,
			'attributes'    => $widget_type->attributes,
			'keywords'      => $widget_type->keywords,
			'textdomain'    => $widget_type->textdomain,
			'i18n_manifest' => $widget_type->i18n_manifest,
			'former_names'  => $widget_type->former_names,
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

/**
 * Make the requested route's content module static, so core modulepreloads it with the page.
 *
 * The page's loader module is empty, so this only fetches and compiles it early; boot still runs it.
 * Widget modules stay dynamic: preloading them too delayed the first widget on slow connections.
 *
 * @param array       $boot_dependencies Boot dependencies for the page.
 * @param string|null $routes_file       The wp-build route registry. Defaults to the build's.
 * @return array Updated boot dependencies.
 */
function preload_requested_route_content( $boot_dependencies, $routes_file = null ) {
	if ( ! is_array( $boot_dependencies ) ) {
		return $boot_dependencies;
	}

	$route = get_requested_dashboard_route( $routes_file ?? __DIR__ . '/../build/routes/registry.php' );
	if ( null === $route ) {
		return $boot_dependencies;
	}

	foreach ( $boot_dependencies as $index => $dependency ) {
		if (
			is_array( $dependency )
			&& isset( $dependency['id'] )
			&& is_string( $dependency['id'] )
			&& preg_match( '#/routes/([^/]+)/content$#', $dependency['id'], $matches )
			&& $matches[1] === $route
		) {
			$boot_dependencies[ $index ]['import'] = 'static';
		}
	}

	return $boot_dependencies;
}
add_filter( 'jetpack-premium-analytics-wp-admin_boot_dependencies', __NAMESPACE__ . '\\preload_requested_route_content', 20 );

/**
 * The wp-build route the `p` query arg resolves to.
 *
 * @param string $routes_file The wp-build route registry.
 * @return string|null Route name, or null when the registry is missing or no route matches.
 */
function get_requested_dashboard_route( $routes_file ) {
	if ( ! file_exists( $routes_file ) ) {
		return null;
	}
	$routes = require $routes_file;

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only routing input, only compared against known route paths.
	$location = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? wp_unslash( $_GET['p'] ) : '/';
	$segments = array_values( array_filter( explode( '/', (string) wp_parse_url( $location, PHP_URL_PATH ) ), 'strlen' ) );

	foreach ( is_array( $routes ) ? $routes : array() as $route ) {
		if ( ! isset( $route['name'] ) || ! isset( $route['path'] ) ) {
			continue;
		}

		$pattern = array_values( array_filter( explode( '/', $route['path'] ), 'strlen' ) );
		if ( count( $pattern ) !== count( $segments ) ) {
			continue;
		}

		foreach ( $pattern as $position => $segment ) {
			// `$postId`-style segments are params and match any value; the rest match as the
			// client router does, decoded and case-insensitive.
			if ( '$' !== $segment[0] && 0 !== strcasecmp( $segment, rawurldecode( $segments[ $position ] ) ) ) {
				continue 2;
			}
		}

		return $route['name'];
	}

	return null;
}

/**
 * Add the REST responses the dashboard reads before it can place a widget to the page's preloads:
 * the settings, then the sections and widget types, two round trips before the first widget mounts.
 *
 * Each path is the exact form the client requests, `_locale` included, or the preload goes unused.
 *
 * @param array $preload_paths Paths the generated page preloads.
 * @return array Updated paths.
 */
function preload_dashboard_rest_responses( $preload_paths ) {
	if ( ! is_array( $preload_paths ) ) {
		return $preload_paths;
	}

	$preload_paths[] = '/wp/v2/settings';
	$preload_paths[] = '/' . DASHBOARD_REST_NAMESPACE . '/dashboards/' . DASHBOARD_NAME . '/sections?per_page=100&_locale=user';
	$preload_paths[] = '/' . DASHBOARD_REST_NAMESPACE . '/widget-modules?per_page=100&_locale=user';

	return $preload_paths;
}
add_filter( 'jpa_jetpack_premium_analytics_wp_admin_preload_paths', __NAMESPACE__ . '\\preload_dashboard_rest_responses' );
