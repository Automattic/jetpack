<?php
/**
 * Registers the Jetpack Podcast wp-admin page and loads the wp-build dashboard.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

/**
 * Adds the "Jetpack > Podcast" wp-admin screen on Simple and Atomic when the
 * `jetpack_podcast_untangle` filter is enabled. Until that filter flips, every
 * entry point here is a no-op so the legacy podcasting experience keeps
 * running unchanged.
 *
 * Menu registration is owned by `wpcom-admin-menu.php` (in the
 * `jetpack-mu-wpcom` package), which calls `add_wp_admin_submenu()` at
 * `admin_menu` priority 999999 — late enough that the Jetpack parent menu
 * already exists. wpcom-admin-menu runs on both Simple and Atomic, so a single
 * registration path covers both. Standalone Jetpack is excluded by the host
 * gate in `Podcast::init()`.
 *
 * Mirrors `Automattic\Jetpack\Backup\V0005\Jetpack_Backup` — wp-build's
 * polyfills + auto-generated render/enqueue functions do the heavy lifting;
 * we just alias `$screen->id` so the auto-enqueue check passes for our slug.
 */
class Admin_Page {

	/**
	 * URL-facing menu slug.
	 *
	 * @var string
	 */
	const ADMIN_PAGE_SLUG = 'jetpack-podcast';

	/**
	 * The wp-build page slug emitted by `@wordpress/build` (`wpPlugin.pages[0]`).
	 * The auto-generated enqueue callback only fires when `$screen->id`
	 * matches this value, so we alias the screen id via `current_screen`
	 * on our admin page without changing the user-facing slug.
	 *
	 * @var string
	 */
	const WP_BUILD_SLUG = 'jetpack-podcast-dashboard';

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

		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
	}

	/**
	 * Register the Podcast submenu under Jetpack on Simple and Atomic.
	 *
	 * Called from `wpcom-admin-menu.php` at priority 999999 once the Jetpack
	 * parent menu exists. Bails when the untangle filter is off so the legacy
	 * "Podcasting" Calypso link in `wpcom-admin-menu.php` keeps rendering.
	 */
	public static function add_wp_admin_submenu() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$wp_build_render = 'jetpack_podcast_jetpack_podcast_dashboard_wp_admin_render_page';
		$callback        = function_exists( $wp_build_render )
			? $wp_build_render
			: array( __CLASS__, 'render' );

		$page_suffix = add_submenu_page(
			'jetpack',
			/** "Podcast" is a product name, do not translate. */
			'Podcast',
			'Podcast',
			'manage_options',
			self::ADMIN_PAGE_SLUG,
			$callback
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}
	}

	/**
	 * Wire admin-init actions once we know the Podcast page is loading.
	 *
	 * Subsequent PRs in the untangle train layer script-data + Tracks here.
	 * The wp-build dashboard manages its own enqueue pipeline.
	 */
	public static function admin_init() {
		// Intentionally empty for now.
	}

	/**
	 * Load wp-build only on the Podcast admin page, then alias `$screen->id`
	 * so wp-build's auto-generated enqueue callback fires for our slug.
	 *
	 * Hooked at admin_menu priority 1 so polyfills register before
	 * `wp_default_scripts` fires and the wp-build render function is defined
	 * before `add_wp_admin_submenu()` runs at priority 999999.
	 *
	 * Mirrors `Automattic\Jetpack\Backup\V0005\Jetpack_Backup::maybe_load_wp_build`.
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_enabled() || ! self::is_podcast_admin_request() ) {
			return;
		}

		self::load_wp_build();
		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
	}

	/**
	 * Require the wp-build entry file and register its polyfills.
	 *
	 * The build artifact may be absent on a fresh checkout before
	 * `pnpm build` has run; in that case `add_wp_admin_submenu()` falls back
	 * to `render()` so the page still loads (just without the React app).
	 */
	private static function load_wp_build() {
		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		WP_Build_Polyfills::register(
			'jetpack-podcast',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);
	}

	/**
	 * Alias `$screen->id` to wp-build's expected page slug so its
	 * auto-generated `<page>-wp-admin` enqueue callback fires on our
	 * `?page=jetpack-podcast` URL. Only hooked when we're already on the
	 * Podcast admin page, so this never affects any other request.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( ! is_object( $screen ) ) {
			return;
		}

		$screen->id = self::WP_BUILD_SLUG;
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
	 * hooks fire, so this check is reliable from `admin_menu` onwards.
	 */
	private static function is_podcast_admin_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return self::ADMIN_PAGE_SLUG === sanitize_text_field( wp_unslash( $_GET['page'] ) );
	}
}
