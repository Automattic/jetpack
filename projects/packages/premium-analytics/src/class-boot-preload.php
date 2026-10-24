<?php
/**
 * Boot preload: puts what the requested screen needs into the page up front, so the browser
 * does not discover it one round trip at a time (slowest on HTTP/1.1, i.e. sites without TLS).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Promotes the requested route's modules to modulepreloads and preloads its first REST responses.
 */
class Boot_Preload {

	/**
	 * The generated page's filter over its loader's script-module dependencies.
	 */
	const BOOT_DEPENDENCIES_FILTER = 'jetpack-premium-analytics-wp-admin_boot_dependencies';

	/**
	 * Matches the route and content module handles wp-build registers, capturing the route name.
	 */
	const ROUTE_MODULE_PATTERN = '#^jetpack-premium-analytics/routes/([^/]+)/(?:route|content)$#';

	/**
	 * Path to the wp-build route registry; overridden by tests.
	 *
	 * @var string|null
	 */
	private static $routes_file = null;

	/**
	 * Hook into the dashboard page render. Call only on dashboard requests.
	 *
	 * @return void
	 */
	public static function register() {
		// After add_widget_modules_to_boot_deps(), which adds the widget modules promoted here.
		add_filter( self::BOOT_DEPENDENCIES_FILTER, array( static::class, 'filter_boot_dependencies' ), 20 );
		add_action( 'admin_enqueue_scripts', array( static::class, 'preload_rest_responses' ) );
	}

	/**
	 * Make the requested route's modules and its first widgets static, and every other route's dynamic.
	 *
	 * Core modulepreloads static dependencies only; dynamic ones stay in the import map for
	 * `import()`. A modulepreload fetches without executing, so boot still runs after DOMContentLoaded.
	 *
	 * @param array $boot_dependencies Boot dependencies, each with 'import' and 'id' keys.
	 * @return array
	 */
	public static function filter_boot_dependencies( $boot_dependencies ) {
		$route = self::get_requested_route();
		if ( null === $route || ! is_array( $boot_dependencies ) ) {
			return $boot_dependencies;
		}

		$widget_modules = 'dashboard' === $route ? array_flip( self::get_initial_widget_modules() ) : array();

		foreach ( $boot_dependencies as $index => $dependency ) {
			if ( ! isset( $dependency['id'] ) ) {
				continue;
			}

			if ( preg_match( self::ROUTE_MODULE_PATTERN, $dependency['id'], $matches ) ) {
				$boot_dependencies[ $index ]['import'] = $matches[1] === $route ? 'static' : 'dynamic';
			} elseif ( isset( $widget_modules[ $dependency['id'] ] ) ) {
				$boot_dependencies[ $index ]['import'] = 'static';
			}
		}

		return $boot_dependencies;
	}

	/**
	 * Preload the REST responses the requested route reads before it can render any widget.
	 *
	 * @return void
	 */
	public static function preload_rest_responses() {
		$route = self::get_requested_route();
		if ( null === $route ) {
			return;
		}

		// Paths as core-data requests them; the middleware matches them exactly.
		$paths = array(
			'/wp/v2/settings',
			'/' . DASHBOARD_REST_NAMESPACE . '/widget-modules?per_page=-1',
		);
		if ( 'dashboard' === $route ) {
			$paths[] = '/' . DASHBOARD_REST_NAMESPACE . '/dashboards/' . DASHBOARD_NAME . '/sections?per_page=-1';
		}

		// Skips any path that does not answer 200, which the client then fetches as before.
		$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );
		if ( empty( $preloaded ) ) {
			return;
		}

		wp_add_inline_script(
			'wp-api-fetch',
			sprintf(
				'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );',
				wp_json_encode( $preloaded, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
			),
			'after'
		);
	}

	/**
	 * The route the `p` query arg resolves to, or null when it matches none.
	 *
	 * @return string|null Route name from the wp-build registry.
	 */
	private static function get_requested_route() {
		$path     = (string) wp_parse_url( self::get_location(), PHP_URL_PATH );
		$segments = array_values( array_filter( explode( '/', $path ), 'strlen' ) );

		foreach ( self::get_routes() as $route ) {
			if ( ! isset( $route['name'] ) || ! isset( $route['path'] ) ) {
				continue;
			}

			$pattern = array_values( array_filter( explode( '/', $route['path'] ), 'strlen' ) );
			if ( count( $pattern ) !== count( $segments ) ) {
				continue;
			}

			foreach ( $pattern as $position => $segment ) {
				// `$postId`-style segments are params and match any value.
				if ( '$' !== $segment[0] && $segment !== $segments[ $position ] ) {
					continue 2;
				}
			}

			return $route['name'];
		}

		return null;
	}

	/**
	 * The render and widget modules of the widgets the initial dashboard section shows.
	 *
	 * Mirrors the client: the `section` param or the first available section, then the stored
	 * layout for it or its default.
	 *
	 * @return string[] Script module IDs.
	 */
	private static function get_initial_widget_modules() {
		$sections = get_available_dashboard_sections( DASHBOARD_NAME );
		if ( empty( $sections ) ) {
			return array();
		}

		$section   = reset( $sections );
		$requested = self::get_location_arg( 'section' );
		foreach ( $sections as $candidate ) {
			if ( $candidate->slug === $requested ) {
				$section = $candidate;
				break;
			}
		}

		$stored = self::get_stored_section_layouts();
		$layout = isset( $stored[ $section->slug ] ) && is_array( $stored[ $section->slug ] )
			? $stored[ $section->slug ]
			: $section->get_default_layout();

		ensure_widget_registry_ready();
		$widget_types = get_available_widget_types();

		$modules = array();
		foreach ( $layout as $widget ) {
			$type = is_array( $widget ) && isset( $widget['type'] ) ? $widget['type'] : null;
			if ( null === $type || ! isset( $widget_types[ $type ] ) ) {
				continue;
			}

			$modules[] = $widget_types[ $type ]->widget_module;
			$modules[] = $widget_types[ $type ]->render_module;
		}

		return array_values( array_unique( array_filter( $modules ) ) );
	}

	/**
	 * The current user's customized section layouts, keyed by section slug.
	 *
	 * @return array
	 */
	private static function get_stored_section_layouts() {
		global $wpdb;

		$preferences = get_user_meta( get_current_user_id(), $wpdb->get_blog_prefix() . 'persisted_preferences', true );
		$layouts     = $preferences[ Enablement_Setting::PREFERENCES_SCOPE ]['dashboardSectionLayouts'] ?? array();

		return is_array( $layouts ) ? $layouts : array();
	}

	/**
	 * The in-app location from the `p` query arg, e.g. `/post/12?from=...`.
	 *
	 * @return string
	 */
	private static function get_location() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only routing input, only matched against known routes and slugs.
		return isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? wp_unslash( $_GET['p'] ) : '/';
	}

	/**
	 * A search param from the in-app location; the router stores strings JSON-encoded.
	 *
	 * @param string $name Param name.
	 * @return string|null
	 */
	private static function get_location_arg( $name ) {
		wp_parse_str( (string) wp_parse_url( self::get_location(), PHP_URL_QUERY ), $args );
		if ( ! isset( $args[ $name ] ) || ! is_string( $args[ $name ] ) ) {
			return null;
		}

		$decoded = json_decode( $args[ $name ] );
		return is_string( $decoded ) ? $decoded : $args[ $name ];
	}

	/**
	 * The routes wp-build generated for this page.
	 *
	 * @return array[]
	 */
	private static function get_routes() {
		$routes_file = self::$routes_file ?? __DIR__ . '/../build/routes/registry.php';
		if ( ! file_exists( $routes_file ) ) {
			return array();
		}

		$routes = require $routes_file;
		return is_array( $routes ) ? $routes : array();
	}
}
