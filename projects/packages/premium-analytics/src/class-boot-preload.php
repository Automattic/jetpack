<?php
/**
 * Boot preload: lists the requested route's content module as a static boot dependency.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Promotes the requested route's content module to a static boot dependency, so core prints a
 * modulepreload for it and the browser fetches it while the page's classic scripts load.
 *
 * The page's loader module is empty, so a static dependency is only fetched and compiled early;
 * it still runs when `@wordpress/boot` imports it. Widget modules stay dynamic: preloaded too,
 * they compete with the page's blocking scripts and delay the first widget on slow connections.
 */
class Boot_Preload {

	/**
	 * The generated page's filter over its loader's script-module dependencies.
	 */
	const BOOT_DEPENDENCIES_FILTER = 'jetpack-premium-analytics-wp-admin_boot_dependencies';

	/**
	 * Captures the route name from a content module ID wp-build registers.
	 */
	const CONTENT_MODULE_PATTERN = '#/routes/([^/]+)/content$#';

	/**
	 * Path to the wp-build route registry; overridden by tests.
	 *
	 * @var string|null
	 */
	private static $routes_file = null;

	/**
	 * Hook into the dashboard page's boot dependencies. Call only on dashboard requests.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( self::BOOT_DEPENDENCIES_FILTER, array( static::class, 'filter_boot_dependencies' ), 20 );
	}

	/**
	 * Make the requested route's content module static.
	 *
	 * @param array $boot_dependencies Boot dependencies, each with 'import' and 'id' keys.
	 * @return array
	 */
	public static function filter_boot_dependencies( $boot_dependencies ) {
		if ( ! is_array( $boot_dependencies ) ) {
			return $boot_dependencies;
		}

		$route = self::get_requested_route();
		if ( null === $route ) {
			return $boot_dependencies;
		}

		foreach ( $boot_dependencies as $index => $dependency ) {
			if (
				is_array( $dependency )
				&& isset( $dependency['id'] )
				&& is_string( $dependency['id'] )
				&& preg_match( self::CONTENT_MODULE_PATTERN, $dependency['id'], $matches )
				&& $matches[1] === $route
			) {
				$boot_dependencies[ $index ]['import'] = 'static';
			}
		}

		return $boot_dependencies;
	}

	/**
	 * The route the `p` query arg resolves to, or null when it matches none.
	 *
	 * @return string|null Route name from the wp-build registry.
	 */
	private static function get_requested_route() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only routing input, only compared against known route paths.
		$location = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? wp_unslash( $_GET['p'] ) : '/';
		$path     = (string) wp_parse_url( $location, PHP_URL_PATH );
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
