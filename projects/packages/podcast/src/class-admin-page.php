<?php
/**
 * Registers the Jetpack Podcast wp-admin page and loads the wp-build dashboard.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

/**
 * Adds the "Jetpack > Podcast" wp-admin screen.
 */
class Admin_Page {

	const ADMIN_PAGE_SLUG = 'jetpack-podcast';

	/**
	 * Where the Podcast item sits in the Jetpack submenu on self-hosted.
	 *
	 * Placed after Subscribers (15) and Newsletter (10) to mirror the order
	 * `wpcom-admin-menu.php` uses on Simple/Atomic.
	 */
	const MENU_POSITION = 16;

	/**
	 * Slug emitted by `@wordpress/build`. wp-build's auto-generated enqueue
	 * callback only fires when `$screen->id` matches this value, so we alias
	 * the screen id via `current_screen` without changing the user-facing URL.
	 */
	const WP_BUILD_SLUG = 'jetpack-podcast-dashboard';

	/**
	 * Whether `init()` has already wired its hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire admin hooks. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );

		// On Simple/Atomic, wpcom-admin-menu.php builds the Jetpack menu at
		// priority 999999 and calls add_wp_admin_submenu() itself. Self-hosted
		// has no such file, so we register our own. Priority 999 queues the item
		// before Admin_Menu's priority-1000 callback.
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_submenu' ), 999 );
		}
	}

	/**
	 * Register the Podcast submenu under the Jetpack menu.
	 */
	public static function add_wp_admin_submenu() {
		// Prefer the wp-build render function once it's defined (by
		// maybe_load_wp_build() at admin_menu priority 1); fall back otherwise.
		$wp_build_render = 'jetpack_podcast_jetpack_podcast_dashboard_wp_admin_render_page';
		$callback        = function_exists( $wp_build_render ) ? $wp_build_render : array( __CLASS__, 'render' );

		if ( ( new Host() )->is_wpcom_platform() ) {
			$page_suffix = add_submenu_page(
				'jetpack',
				/** "Podcast" is a product name, do not translate. */
				'Podcast',
				'Podcast',
				'manage_options',
				self::ADMIN_PAGE_SLUG,
				$callback
			);
		} else {
			$page_suffix = Admin_Menu::add_menu(
				/** "Podcast" is a product name, do not translate. */
				'Podcast',
				'Podcast',
				'manage_options',
				self::ADMIN_PAGE_SLUG,
				$callback,
				self::MENU_POSITION
			);
		}

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}
	}

	/**
	 * Wire admin-init actions once we know the Podcast page is loading.
	 */
	public static function admin_init() {
		// MediaUpload (cover-image-control) reads wp.media.view — only defined after this runs.
		add_action( 'admin_enqueue_scripts', 'wp_enqueue_media' );
	}

	/**
	 * Hooked at admin_menu priority 1 so polyfills register before
	 * `wp_default_scripts` fires and the wp-build render function is defined
	 * before `add_wp_admin_submenu()` runs (priority 999 on self-hosted, 999999
	 * on Simple/Atomic).
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_podcast_admin_request() ) {
			return;
		}

		self::load_wp_build();
		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'inject_podcast_script_data' ) );
	}

	/**
	 * Add the podcast gate boolean to `window.JetpackScriptData`.
	 *
	 * Hooked from `maybe_load_wp_build()` so it only runs when the request is
	 * for the podcast admin page.
	 *
	 * @param array $data Script data being injected.
	 * @return array
	 */
	public static function inject_podcast_script_data( $data ) {
		if ( ! is_array( $data ) ) {
			$data = array();
		}

		$data['podcast'] = array(
			'has_product_access'  => Podcast_Gate::has_product_access(),
			// Source of truth for the dashboard's directory list + URL validation.
			'show_url_hosts'      => Settings::SHOW_URL_HOSTS,
			'show_url_max_length' => Settings::SHOW_URL_MAX_LENGTH,
			// Lets the dashboard skip its mount-time REST fetches.
			'preload'             => self::build_preload(),
		);

		return $data;
	}

	/**
	 * Pre-fetch the settings + categories REST responses so the dashboard reads
	 * them from cache instead of hitting the network on first render. Keys must
	 * match what core-data requests, or the cache silently misses.
	 *
	 * @return array<string, array{body: mixed, headers: array<string, string>}>
	 */
	private static function build_preload() {
		$preload = rest_preload_api_request( array(), '/wpcom/v2/podcast/settings' );

		$preload = self::add_categories_preload( $preload );

		return $preload;
	}

	/**
	 * Add the category list to the preload map.
	 *
	 * The dashboard asks core-data for every category (`per_page=-1`), but the
	 * terms endpoint rejects `-1`, so core-data paginates at `per_page=100`. We
	 * fetch page one — a request the server accepts — and store it under the
	 * `per_page=-1` key the dashboard's first request matches on. Skipped when the
	 * list spans more than one page, or we'd truncate the picker (preloading
	 * short-circuits the pagination that would fetch the rest).
	 *
	 * @param array $preload Preload map so far.
	 * @return array
	 */
	private static function add_categories_preload( $preload ) {
		$page_path = '/wp/v2/categories?context=edit&per_page=100';
		$fetched   = rest_preload_api_request( array(), $page_path );

		if ( ! isset( $fetched[ $page_path ] ) ) {
			return $preload;
		}

		$entry   = $fetched[ $page_path ];
		$headers = isset( $entry['headers'] ) && is_array( $entry['headers'] ) ? $entry['headers'] : array();

		$total_pages = 1;
		foreach ( $headers as $name => $value ) {
			if ( 'x-wp-totalpages' === strtolower( (string) $name ) ) {
				$total_pages = (int) $value;
				break;
			}
		}

		if ( $total_pages <= 1 ) {
			$preload['/wp/v2/categories?context=edit&per_page=-1'] = $entry;
		}

		return $preload;
	}

	/**
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
	 * Alias the current screen id to wp-build's expected slug.
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
	 * Fallback render used when the wp-build artifact is missing.
	 */
	public static function render() {
		?>
		<div class="wrap">
			<h1>Podcast</h1>
		</div>
		<?php
	}

	/**
	 * Whether the current request targets the Podcast admin page.
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
