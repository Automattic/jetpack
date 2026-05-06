<?php
/**
 * Registers the Jetpack Podcast wp-admin page and loads the wp-build dashboard.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Status\Host;

/**
 * Adds the "Jetpack > Podcast" wp-admin screen on Simple and Atomic when the
 * `jetpack_podcast_untangle` filter is enabled. Until that filter flips, every
 * entry point here is a no-op so the legacy podcasting experience keeps
 * running unchanged.
 *
 * On Simple sites, the canonical entry point is `wpcom-admin-menu.php` (in the
 * `jetpack-mu-wpcom` package), which calls `add_wp_admin_submenu()` at
 * priority 999999 — late enough that the Jetpack parent menu already exists.
 * Atomic and standalone Jetpack run through the standard `admin_menu` hook.
 */
class Settings {

	const ADMIN_PAGE_SLUG    = 'jetpack-podcast';
	const WP_BUILD_PAGE_SLUG = 'jetpack-podcast-dashboard';

	/**
	 * Whether the class has already wired its admin hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire the admin hooks. Called from `Podcast::init()` once the
	 * `jetpack_podcast_untangle` filter and host gates have been satisfied.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Defer wp-build loading to admin_menu (priority 1) so the
		// `jetpack_podcast_untangle` filter has been applied before we read it
		// and the wp-build render function is in place before any menu callback
		// runs (priority 999 on standalone Jetpack, 999999 on Simple via
		// wpcom-admin-menu.php → add_wp_admin_submenu).
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );

		// On Simple sites, the Jetpack parent menu doesn't exist until
		// wpcom-admin-menu.php runs at priority 999999, so we let it call
		// `add_wp_admin_submenu()` directly. On Atomic + standalone Jetpack we
		// register at priority 999, before `Admin_Menu::admin_menu_hook_callback`
		// processes queued items at priority 1000.
		$host = new Host();
		if ( $host->is_wpcom_simple() ) {
			return;
		}

		add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_menu' ), 999 );
	}

	/**
	 * Register the Podcast submenu under Jetpack on Atomic + standalone Jetpack.
	 */
	public static function add_wp_admin_menu() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$page_suffix = add_submenu_page(
			'jetpack',
			/** "Podcast" is a product name, do not translate. */
			'Podcast',
			'Podcast',
			'manage_options',
			self::ADMIN_PAGE_SLUG,
			self::get_render_callback()
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}
	}

	/**
	 * Register the Podcast submenu under Jetpack on Simple sites.
	 *
	 * Called from `wpcom-admin-menu.php` at priority 999999 once the Jetpack
	 * parent menu exists. Bails when the untangle filter is off so the legacy
	 * "Podcasting" Calypso link in `wpcom-admin-menu.php` keeps rendering.
	 */
	public static function add_wp_admin_submenu() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$page_suffix = add_submenu_page(
			'jetpack',
			/** "Podcast" is a product name, do not translate. */
			'Podcast',
			'Podcast',
			'manage_options',
			self::ADMIN_PAGE_SLUG,
			self::get_render_callback()
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}
	}

	/**
	 * Wire admin-init actions once we know the Podcast page is loading.
	 */
	public static function admin_init() {
		// Subsequent PRs in the untangle train layer script-data + Tracks
		// here. The wp-build dashboard manages its own enqueue pipeline.
	}

	/**
	 * Load the wp-build entry on Podcast admin requests when the untangle
	 * filter is on. Hooked at `admin_menu` priority 1 so the render function
	 * is defined before `add_wp_admin_menu` / `add_wp_admin_submenu` register
	 * the menu callback.
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_enabled() || ! self::is_podcast_admin_request() ) {
			return;
		}

		self::load_wp_build();
		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
	}

	/**
	 * Resolve the menu render callback, preferring the wp-build–generated
	 * function when the build artifact is in place.
	 *
	 * @return callable
	 */
	private static function get_render_callback() {
		$wp_build_render = 'jetpack_podcast_jetpack_podcast_dashboard_wp_admin_render_page';

		if ( function_exists( $wp_build_render ) ) {
			return $wp_build_render;
		}

		return array( __CLASS__, 'render' );
	}

	/**
	 * Default render callback. Used as a fallback when the wp-build artifact is
	 * missing — for example, on a fresh checkout before `pnpm build` has run.
	 */
	public static function render() {
		?>
		<div class="wrap">
			<h1>Podcast</h1>
		</div>
		<?php
	}

	/**
	 * Require the wp-build entry file and register its polyfills.
	 *
	 * Only called on `?page=jetpack-podcast` admin requests with the untangle
	 * filter on, so wp-build stays out of every other request.
	 */
	private static function load_wp_build() {
		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register(
			'jetpack-podcast',
			array_merge(
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::SCRIPT_HANDLES,
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Alias the current screen ID so wp-build's `<page>-wp-admin` enqueue
	 * callback fires on our `?page=jetpack-podcast` URL. Wp-build expects the
	 * screen ID to match the wp-build page slug (`jetpack-podcast-dashboard`),
	 * but we keep the user-facing slug as `jetpack-podcast`.
	 *
	 * Hooked only when the untangle filter is on AND we're on the Podcast
	 * page, so this never affects any other request.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( ! is_object( $screen ) ) {
			return;
		}

		$screen->id = self::WP_BUILD_PAGE_SLUG;
	}

	/**
	 * Whether the Podcast untangle is enabled. Mirrors the gate in
	 * `Podcast::init()` so callbacks invoked outside that flow (e.g.
	 * `add_wp_admin_submenu()` from wpcom-admin-menu.php) still bail.
	 */
	private static function is_enabled() {
		/** This filter is documented in src/class-podcast.php. */
		return (bool) apply_filters( 'jetpack_podcast_untangle', false );
	}

	/**
	 * Whether the current request targets the Podcast admin page.
	 *
	 * `$_GET['page']` is populated by `wp-admin/admin.php` before any of our
	 * hooks fire, so this is reliable from `admin_menu` priority 1 onwards.
	 */
	private static function is_podcast_admin_request() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === self::ADMIN_PAGE_SLUG; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}
