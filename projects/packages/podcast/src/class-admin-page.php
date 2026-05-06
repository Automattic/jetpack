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
 * The wp-build chassis is loaded inline from `maybe_load_wp_build()` and
 * routed onto our user-facing slug via `bridge_wp_build_enqueue()` —
 * mirroring `Automattic\Jetpack\Scan_Page\Jetpack_Scan`.
 */
class Admin_Page {

	/**
	 * URL-facing menu slug.
	 *
	 * @var string
	 */
	const ADMIN_PAGE_SLUG = 'jetpack-podcast';

	/**
	 * Internal slug emitted by `@wordpress/build` (`wpPlugin.pages[0]`
	 * plus the `-wp-admin` suffix the build template appends). Used to
	 * find the auto-generated render / enqueue functions.
	 *
	 * @var string
	 */
	const WP_BUILD_SLUG = 'jetpack-podcast-dashboard-wp-admin';

	/**
	 * Whether the class has already wired its admin hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire the admin hooks. Called from `Podcast::init()` once the
	 * `jetpack_podcast_untangle` filter and host gates have been satisfied.
	 *
	 * Menu registration itself is handled by `wpcom-admin-menu.php` calling
	 * `add_wp_admin_submenu()` at `admin_menu` priority 999999. Here we only
	 * arrange for the wp-build artifact to be loaded (and bridged to our
	 * user-facing slug) before that callback runs.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Defer wp-build loading to admin_menu (priority 1) so the wp-build
		// render function is in place before the menu callback runs at
		// priority 999999.
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
	 *
	 * Subsequent PRs in the untangle train layer script-data + Tracks here.
	 * The wp-build dashboard manages its own enqueue pipeline (bridged via
	 * `bridge_wp_build_enqueue()`).
	 */
	public static function admin_init() {
		// Intentionally empty for now.
	}

	/**
	 * Load the wp-build entry on Podcast admin requests when the untangle
	 * filter is on. Hooked at `admin_menu` priority 1 so the render function
	 * is defined before `add_wp_admin_submenu` registers the menu callback at
	 * priority 999999.
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_enabled() || ! self::is_podcast_admin_request() ) {
			return;
		}

		self::load_wp_build();
		self::bridge_wp_build_enqueue();
		self::fix_boot_import_map_ordering();
	}

	/**
	 * Bridge wp-build's auto-generated enqueue function — which checks for
	 * `?page=jetpack-podcast-dashboard-wp-admin` — to our user-facing slug
	 * `?page=jetpack-podcast`. Hooked at priority 9 so the wp-build copy
	 * (registered at priority 10) sees the original `$_GET['page']` and skips
	 * its own enqueue.
	 *
	 * Mirrors `Automattic\Jetpack\Scan_Page\Jetpack_Scan::bridge_wp_build_enqueue`.
	 */
	private static function bridge_wp_build_enqueue() {
		add_action(
			'admin_enqueue_scripts',
			static function ( $hook_suffix ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				if ( ! isset( $_GET['page'] ) || self::ADMIN_PAGE_SLUG !== $_GET['page'] ) {
					return;
				}

				$enqueue_fn = 'jetpack_podcast_jetpack_podcast_dashboard_wp_admin_enqueue_scripts';
				if ( ! function_exists( $enqueue_fn ) ) {
					return;
				}

				// phpcs:disable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				$original     = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : null;
				$_GET['page'] = self::WP_BUILD_SLUG;
				// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- Function is generated by @wordpress/build into build/pages/jetpack-podcast-dashboard/page-wp-admin.php, which is outside Phan's analysis scope. The function_exists() guard above protects the call at runtime.
				call_user_func( $enqueue_fn, $hook_suffix );
				if ( null === $original ) {
					unset( $_GET['page'] );
				} else {
					$_GET['page'] = $original;
				}
				// phpcs:enable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			},
			9
		);
	}

	/**
	 * Fix import map ordering for the wp-build boot script.
	 *
	 * In wp-admin, `_wp_footer_scripts` (classic scripts) and
	 * `print_import_map` both hook into `admin_print_footer_scripts` at
	 * priority 10, but `_wp_footer_scripts` is registered first. This causes
	 * the inline `import("@wordpress/boot")` to execute before the import
	 * map exists.
	 *
	 * This fix moves the `import()` call from the classic inline script to a
	 * `<script type="module">` printed at priority 20 (after the import map).
	 *
	 * Mirrors `Automattic\Jetpack\Scan_Page\Jetpack_Scan::fix_boot_import_map_ordering`.
	 *
	 * @todo Remove once @wordpress/build ships the loader.js fix upstream
	 *       (WordPress/gutenberg#76870) and Jetpack updates the dependency.
	 */
	private static function fix_boot_import_map_ordering() {
		$handle = self::WP_BUILD_SLUG . '-prerequisites';

		add_action(
			'admin_enqueue_scripts',
			static function () use ( $handle ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				if ( ! isset( $_GET['page'] ) || self::ADMIN_PAGE_SLUG !== $_GET['page'] ) {
					return;
				}

				$data = wp_scripts()->get_data( $handle, 'after' );
				if ( empty( $data ) ) {
					return;
				}

				$boot_script = null;
				$remaining   = array();
				foreach ( $data as $line ) {
					if ( strpos( $line, '@wordpress/boot' ) !== false ) {
						$boot_script = $line;
					} else {
						$remaining[] = $line;
					}
				}

				if ( null === $boot_script ) {
					return;
				}

				wp_scripts()->add_data( $handle, 'after', $remaining );

				add_action(
					'admin_print_footer_scripts',
					static function () use ( $boot_script ) {
						wp_print_inline_script_tag( $boot_script, array( 'type' => 'module' ) );
					},
					20
				);
			},
			PHP_INT_MAX
		);
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
		WP_Build_Polyfills::register(
			'jetpack-podcast',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);

		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( file_exists( $build_index ) ) {
			require_once $build_index;
		}
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
