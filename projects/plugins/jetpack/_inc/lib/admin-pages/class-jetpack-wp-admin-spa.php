<?php
/**
 * The top-level "jetpack" wp-build page that hosts every product's routes in one SPA.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class-jetpack-wp-build-page.php';

/**
 * Registers the hidden `jetpack-spa-wp-admin` page and lets other projects contribute routes to it.
 *
 * @since $$next-version$$
 */
class Jetpack_WP_Admin_SPA {

	const PAGE_ID   = 'jetpack-spa';
	const PAGE_SLUG = 'jetpack-spa-wp-admin';

	/**
	 * Whether the current request is for the SPA page.
	 *
	 * @return bool
	 */
	public static function is_spa_request() {
		return is_admin() && isset( $_GET['page'] ) && self::PAGE_SLUG === sanitize_text_field( wp_unslash( $_GET['page'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Load wp-build for the SPA page. Hook at `admin_menu` priority 1.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_spa_request() || ! Jetpack_WP_Build_Page::load( self::PAGE_ID ) ) {
			return;
		}

		/**
		 * Fires once the host page's build is loaded, so a project can load its own wp-build output.
		 *
		 * The project must declare the `jetpack-spa` page so wp-build emits its routes, remove that
		 * page's own enqueue callback, and add its generated `get_..._routes` function to the
		 * `jetpack_wp_admin_spa_route_getters` filter.
		 *
		 * @since $$next-version$$
		 */
		do_action( 'jetpack_wp_admin_spa_load' );

		add_action( self::PAGE_SLUG . '_init', array( __CLASS__, 'register_contributed_routes' ), 99 );
	}

	/**
	 * Copy each contributing project's routes into the host's route list.
	 *
	 * @return void
	 */
	public static function register_contributed_routes() {
		/**
		 * Filters the callables that return another project's routes for the host page.
		 *
		 * @since $$next-version$$
		 *
		 * @param callable[] $getters Callables returning arrays of `array( 'path', 'content_module', 'route_module' )`.
		 */
		foreach ( apply_filters( 'jetpack_wp_admin_spa_route_getters', array() ) as $getter ) {
			if ( ! is_callable( $getter ) ) {
				continue;
			}
			foreach ( (array) $getter() as $route ) {
				jetpack_plugin_register_jetpack_spa_wp_admin_route( $route['path'], $route['content_module'] ?? null, $route['route_module'] ?? null ); // @phan-suppress-current-line PhanUndeclaredFunction -- Defined by the generated build/pages/, which Phan excludes.
			}
		}
	}

	/**
	 * Register the page. It has no menu entry: products keep theirs and link here with `&p=`.
	 *
	 * @return void
	 */
	public static function add_page() {
		if ( ! function_exists( 'jetpack_plugin_jetpack_spa_wp_admin_render_page' ) ) {
			return;
		}

		add_submenu_page(
			'',
			__( 'Jetpack', 'jetpack' ),
			__( 'Jetpack', 'jetpack' ),
			'manage_options',
			self::PAGE_SLUG,
			'jetpack_plugin_jetpack_spa_wp_admin_render_page'
		);
	}
}

add_action( 'admin_menu', array( 'Jetpack_WP_Admin_SPA', 'maybe_load_wp_build' ), 1 );
add_action( 'admin_menu', array( 'Jetpack_WP_Admin_SPA', 'add_page' ) );
