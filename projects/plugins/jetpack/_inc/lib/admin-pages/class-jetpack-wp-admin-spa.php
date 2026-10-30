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

	/**
	 * Menu slug => SPA route path for every project whose sidebar entry the SPA can serve.
	 *
	 * @return array<string,string>
	 */
	private static function get_menu_routes() {
		if ( ! file_exists( JETPACK__PLUGIN_DIR . 'build/pages/' . self::PAGE_ID . '/page-wp-admin.php' ) ) {
			return array();
		}

		/**
		 * Filters which Jetpack submenu entries open a route on the SPA page instead of their own page.
		 *
		 * @since $$next-version$$
		 *
		 * @param array<string,string> $routes Menu slug => route path, e.g. `jetpack-backup` => `/backup`.
		 */
		return (array) apply_filters( 'jetpack_wp_admin_spa_menu_routes', array() );
	}

	/**
	 * The SPA URL a route path opens.
	 *
	 * @param string $route_path Route path.
	 * @return string Admin-relative URL.
	 */
	private static function get_route_url( $route_path ) {
		return 'admin.php?page=' . self::PAGE_SLUG . '&p=' . rawurlencode( $route_path );
	}

	/**
	 * Retarget the Jetpack sidebar entries at SPA routes.
	 *
	 * Runs on `admin_head`, after Admin_Menu drops hidden entries by slug and after core's page access check.
	 *
	 * @return void
	 */
	public static function retarget_menu() {
		global $submenu;

		$routes = self::get_menu_routes();
		if ( ! $routes || empty( $submenu['jetpack'] ) ) {
			return;
		}

		foreach ( $submenu['jetpack'] as $index => $item ) {
			if ( isset( $routes[ $item[2] ] ) ) {
				$submenu['jetpack'][ $index ][2] = self::get_route_url( $routes[ $item[2] ] ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			}
		}
	}

	/**
	 * Keep "Jetpack" open in the sidebar while on the SPA page.
	 *
	 * @param string $parent_file Parent menu file.
	 * @return string
	 */
	public static function filter_parent_file( $parent_file ) {
		return self::is_spa_request() ? 'jetpack' : $parent_file;
	}

	/**
	 * Highlight the sidebar entry of the route being shown.
	 *
	 * @param string|null $submenu_file Current submenu file.
	 * @return string|null
	 */
	public static function filter_submenu_file( $submenu_file ) {
		if ( ! self::is_spa_request() ) {
			return $submenu_file;
		}

		$current = isset( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '/'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		foreach ( self::get_menu_routes() as $route_path ) {
			if ( $current === $route_path || 0 === strpos( $current, $route_path . '/' ) ) {
				return self::get_route_url( $route_path );
			}
		}
		return $submenu_file;
	}

	/**
	 * Make sidebar clicks navigate the router instead of loading a new page.
	 *
	 * @return void
	 */
	public static function print_menu_script() {
		if ( ! self::is_spa_request() ) {
			return;
		}

		// Tail of the router's own history: push, then tell it the location changed.
		?>
		<script>
		document.getElementById( 'adminmenu' )?.addEventListener( 'click', ( event ) => {
			const link = event.target.closest( 'a[href*="page=<?php echo esc_js( self::PAGE_SLUG ); ?>"]' );
			if ( ! link || event.metaKey || event.ctrlKey || event.shiftKey || event.button ) {
				return;
			}
			event.preventDefault();
			const state = window.history.state || {};
			window.history.pushState( { ...state, key: String( Date.now() ), __TSR_index: ( state.__TSR_index ?? 0 ) + 1 }, '', link.href );
			window.dispatchEvent( new PopStateEvent( 'popstate' ) );
			document.querySelectorAll( '#adminmenu .wp-submenu li.current' ).forEach( ( li ) => li.classList.remove( 'current' ) );
			document.querySelectorAll( '#adminmenu .wp-submenu a.current' ).forEach( ( a ) => a.classList.remove( 'current' ) );
			link.classList.add( 'current' );
			link.parentElement.classList.add( 'current' );
		} );
		</script>
		<?php
	}
}

add_action( 'admin_menu', array( 'Jetpack_WP_Admin_SPA', 'maybe_load_wp_build' ), 1 );
add_action( 'admin_menu', array( 'Jetpack_WP_Admin_SPA', 'add_page' ) );
add_action( 'admin_head', array( 'Jetpack_WP_Admin_SPA', 'retarget_menu' ), 20 );
add_filter( 'parent_file', array( 'Jetpack_WP_Admin_SPA', 'filter_parent_file' ) );
add_filter( 'submenu_file', array( 'Jetpack_WP_Admin_SPA', 'filter_submenu_file' ) );
add_action( 'admin_print_footer_scripts', array( 'Jetpack_WP_Admin_SPA', 'print_menu_script' ), 99 );
