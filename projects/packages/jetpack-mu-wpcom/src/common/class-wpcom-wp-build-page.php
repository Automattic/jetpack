<?php
/**
 * Shared plumbing for mu-wpcom's wp-build admin pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// @phan-file-suppress PhanAbstractStaticMethodCallInStatic -- static:: dispatches to the concrete page; the base is never booted itself.

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

require_once __DIR__ . '/wp-build-script-translations.php';

/**
 * Serves a wp-build page under a wp-admin menu slug of the subclass's choosing.
 *
 * Subclasses are static and boot with `add_action( 'init', array( Subclass::class, 'init' ) )`.
 */
abstract class WPCOM_WP_Build_Page {

	/**
	 * Admin page slug, which stays in the page URL.
	 */
	const MENU_SLUG = '';

	/**
	 * Page name for wp-build, as declared in the page's routes/<route>/package.json.
	 *
	 * Must differ from the menu slug, or wp-build's generated standalone page takes the slug over.
	 */
	const WP_BUILD_PAGE = '';

	/**
	 * Menu the page sits under.
	 */
	const PARENT_SLUG = 'jetpack';

	/**
	 * Capability for the page, and for receiving its initial state.
	 */
	const CAPABILITY = 'manage_options';

	/**
	 * `admin_menu` priority for register_page().
	 *
	 * After Jetpack's Admin_Menu (1000), so a slug it claimed is visible, and before
	 * wpcom_add_jetpack_submenu() (999999), which reads whether the slug is claimed.
	 */
	const REGISTER_PRIORITY = 999998;

	/**
	 * Global the page's boot script reads get_initial_state() from.
	 */
	const INITIAL_STATE_VAR = '';

	/**
	 * Whether the page loads WordPress.com Tracks.
	 */
	const ENQUEUE_TRACKS = false;

	/**
	 * Whether each page registered its slug on this request, keyed by class.
	 *
	 * @var bool[]
	 */
	private static $owns_page = array();

	/**
	 * The screen ID displaced by alias_screen_id(), keyed by class.
	 *
	 * @var string[]
	 */
	private static $displaced_screen_id = array();

	/**
	 * The hook suffix add_submenu_page() returned, which is the page's screen ID, keyed by class.
	 *
	 * @var string[]
	 */
	private static $screen_id = array();

	/**
	 * The page title.
	 *
	 * @return string
	 */
	abstract public static function get_page_title();

	/**
	 * The menu entry's label.
	 *
	 * @return string
	 */
	abstract public static function get_menu_title();

	/**
	 * The state the page's boot script reads from INITIAL_STATE_VAR.
	 *
	 * @return array
	 */
	abstract public static function get_initial_state();

	/**
	 * Whether this page should claim its slug on this site.
	 *
	 * @return bool
	 */
	public static function should_register() {
		return true;
	}

	/**
	 * Boot the page, loading the wp-build assets only on its own request.
	 *
	 * @return void
	 */
	public static function init() {
		// Without a build the page would render blank, so leave the slug to whatever serves it otherwise.
		if ( ! static::should_register() || ! static::has_build() ) {
			return;
		}

		add_action( 'admin_menu', array( static::class, 'register_page' ), static::REGISTER_PRIORITY );

		if ( ! static::is_page_request() ) {
			return;
		}

		static::load_wp_build();

		// wp-build's generated enqueue runs at the default priority 10; the alias is
		// scoped to that one pass so nothing else sees the rewritten screen.
		add_action( 'admin_enqueue_scripts', array( static::class, 'alias_screen_id' ), 9 );
		add_action( 'admin_enqueue_scripts', array( static::class, 'restore_screen_id' ), 11 );
		add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_page_data' ), 20 );
	}

	/**
	 * The wp-build output directory, produced at release time and absent from an unbuilt checkout.
	 *
	 * @return string
	 */
	public static function build_dir() {
		return dirname( __DIR__, 2 ) . '/build';
	}

	/**
	 * Whether the wp-build output the page renders from exists.
	 *
	 * @return bool
	 */
	public static function has_build() {
		return file_exists( static::build_dir() . '/build.php' );
	}

	/**
	 * The page's wp-build route directories, read from the build's route registry.
	 *
	 * @return string[]
	 */
	public static function get_routes() {
		$registry = static::build_dir() . '/routes/registry.php';

		if ( ! file_exists( $registry ) ) {
			return array();
		}

		$routes = array();
		foreach ( (array) require $registry as $route ) {
			if ( is_array( $route ) && static::WP_BUILD_PAGE === ( $route['page'] ?? null ) && isset( $route['name'] ) ) {
				$routes[] = $route['name'];
			}
		}

		return $routes;
	}

	/**
	 * Render callback wp-build generates in build/pages/<page>/page-wp-admin.php.
	 *
	 * @return string
	 */
	public static function get_render_callback() {
		return 'jetpack_mu_wpcom_' . str_replace( '-', '_', static::WP_BUILD_PAGE ) . '_wp_admin_render_page';
	}

	/**
	 * The page's own address.
	 *
	 * @return string
	 */
	public static function get_page_url() {
		return admin_url( 'admin.php?page=' . static::MENU_SLUG );
	}

	/**
	 * Whether the current request targets this page.
	 *
	 * @return bool
	 */
	public static function is_page_request() {
		// admin-ajax.php is also `is_admin()`, and has no menu, screen or enqueue pass to set up.
		if ( ! is_admin() || 'admin.php' !== ( $GLOBALS['pagenow'] ?? '' ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing check; no form data is processed.
		return isset( $_GET['page'] ) && static::MENU_SLUG === sanitize_text_field( wp_unslash( $_GET['page'] ) );
	}

	/**
	 * Register the page, unless something else already serves the slug.
	 *
	 * @return void
	 */
	public static function register_page() {
		// A second entry under a slug someone else owns would leave two.
		if ( static::slug_is_claimed() ) {
			return;
		}

		self::$owns_page[ static::class ] = true;

		// build/build.php defines the render callback but only loads on this page's
		// own request; elsewhere the callback never runs, so any callable will do.
		$callback = function_exists( static::get_render_callback() )
			? static::get_render_callback()
			: '__return_empty_string';

		$hook = add_submenu_page(
			static::PARENT_SLUG,
			static::get_page_title(),
			static::get_menu_title(),
			static::CAPABILITY,
			static::MENU_SLUG,
			$callback
		);

		if ( $hook ) {
			self::$screen_id[ static::class ] = $hook;
		}
	}

	/**
	 * Whether this page registered its slug on this request.
	 *
	 * @return bool
	 */
	public static function owns_page() {
		return ! empty( self::$owns_page[ static::class ] );
	}

	/**
	 * The page's screen ID, or null when it did not register on this request.
	 *
	 * @return string|null
	 */
	public static function get_screen_id() {
		return self::$screen_id[ static::class ] ?? null;
	}

	/**
	 * Reset the registration state. Test seam; production sets this once per request.
	 *
	 * @return void
	 */
	public static function reset() {
		unset( self::$owns_page[ static::class ], self::$displaced_screen_id[ static::class ], self::$screen_id[ static::class ] );
	}

	/**
	 * Whether something has already registered this page's slug.
	 *
	 * @return bool
	 */
	public static function slug_is_claimed() {
		global $submenu;

		foreach ( $submenu[ static::PARENT_SLUG ] ?? array() as $item ) {
			if ( is_array( $item ) && static::MENU_SLUG === ( $item[2] ?? null ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Load the wp-build generated asset registrations and the boot polyfills.
	 *
	 * @return void
	 */
	public static function load_wp_build() {
		$wp_build_index = static::build_dir() . '/build.php';
		require_once $wp_build_index;

		// Register polyfills for WP < 7.0 (must run before enqueue).
		WP_Build_Polyfills::register(
			'jetpack-mu-wpcom',
			array_merge(
				WP_Build_Polyfills::SCRIPT_HANDLES,
				WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Make wp-build's enqueue check, which wants a screen ID of WP_BUILD_PAGE, pass without changing the URL.
	 *
	 * Paired with restore_screen_id() so the body class and page-view tracker keep reading the real ID.
	 *
	 * @return void
	 */
	public static function alias_screen_id() {
		$screen = get_current_screen();

		if ( ! static::owns_page() || ! is_object( $screen ) ) {
			return;
		}

		self::$displaced_screen_id[ static::class ] = $screen->id;
		$screen->id                                 = static::WP_BUILD_PAGE;
	}

	/**
	 * Put back the screen ID displaced by alias_screen_id().
	 *
	 * @return void
	 */
	public static function restore_screen_id() {
		$screen = get_current_screen();

		if ( ! isset( self::$displaced_screen_id[ static::class ] ) || ! is_object( $screen ) ) {
			return;
		}

		$screen->id = self::$displaced_screen_id[ static::class ];
		unset( self::$displaced_screen_id[ static::class ] );
	}

	/**
	 * Hand the page its initial state, Tracks and translation catalogs.
	 *
	 * All of it lands on the prerequisites script, which runs before the boot module.
	 *
	 * @return void
	 */
	public static function enqueue_page_data() {
		$handle = static::WP_BUILD_PAGE . '-wp-admin-prerequisites';

		// The menu's capability gate already keeps others off the page; restated because
		// subclasses build the state from direct calls rather than gated endpoints.
		if ( ! static::owns_page() || ! wp_script_is( $handle, 'registered' ) || ! current_user_can( static::CAPABILITY ) ) {
			return;
		}

		// wp-build has no `jetpackConfig` external, so @automattic/jetpack-config reads this global.
		wp_add_inline_script( $handle, 'window.jetpackConfig = ' . wp_json_encode( array( 'consumer_slug' => 'jetpack-mu-wpcom' ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES ) . ';', 'before' );

		if ( '' !== static::INITIAL_STATE_VAR ) {
			// Inline JSON rather than wp_localize_script(), which stringifies top-level scalars.
			$state = wp_json_encode( static::get_initial_state(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES );

			// Every `before` script shares one tag, so a bare `= ;` would also break the translations.
			if ( false !== $state ) {
				wp_add_inline_script( $handle, 'window.' . static::INITIAL_STATE_VAR . ' = ' . $state . ';', 'before' );
			}
		}

		if ( static::ENQUEUE_TRACKS ) {
			Common\wpcom_enqueue_tracking_scripts( $handle );
		}

		$constants = static::build_dir() . '/constants.php';
		if ( file_exists( $constants ) ) {
			$build_constants = require $constants;
			$translations    = wpcom_wp_build_script_translations( static::build_dir() . '/i18n-manifest.json', $build_constants['build_url'], static::get_routes() );

			if ( null !== $translations ) {
				wp_add_inline_script( $handle, $translations, 'before' );
			}
		}
	}
}
