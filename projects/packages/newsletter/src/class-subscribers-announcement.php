<?php
/**
 * Transitional "Subscribers moved" announcement page.
 *
 * When the Newsletter modernization filter is enabled, the unified
 * Jetpack → Newsletter page owns subscriber management and the legacy
 * "Subscribers ↗" Calypso shortcut is retired. Instead of silently dropping
 * the menu item, this page takes its place so people who rely on the link
 * learn the new location before it disappears. They can also remove the
 * menu item themselves once they have adopted the new flow.
 *
 * The whole feature is temporary and kept deliberately small: this class
 * (menu, handlers, tracking) plus the `routes/subscribers-announcement`
 * wp-build route can be deleted wholesale once the transition period ends.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Tracking;

/**
 * Renders the transitional Subscribers announcement page and handles its
 * "remove from sidebar" toggle and "Take me to Newsletter" redirect.
 *
 * The menu itself is registered by callers that own the Subscribers menu
 * placement (the Jetpack plugin's subscriptions module) via add_menu();
 * this class self-registers only request handlers and wp-build loading.
 *
 * @since 0.10.0
 */
class Subscribers_Announcement {

	/**
	 * Admin page slug (kept distinct from the wp-build page name; the screen
	 * ID is aliased so wp-build's enqueue check still matches).
	 *
	 * @var string
	 */
	const PAGE_SLUG = 'jetpack-subscribers';

	/**
	 * Wp-build page name, matching `routes/subscribers-announcement/package.json`.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE = 'jetpack-subscribers-announcement';

	/**
	 * Option storing whether the user removed the Subscribers menu item.
	 *
	 * @var string
	 */
	const REMOVED_OPTION = 'jetpack_subscribers_announcement_menu_removed';

	/**
	 * AJAX action toggling the menu item visibility.
	 *
	 * @var string
	 */
	const TOGGLE_ACTION = 'jetpack_subscribers_announcement_toggle_menu';

	/**
	 * Admin-post action tracking the "Take me to Newsletter" click before redirecting.
	 *
	 * @var string
	 */
	const GO_ACTION = 'jetpack_subscribers_announcement_go_to_newsletter';

	/**
	 * Site ID cutoff for displaying the Subscribers announcement page.
	 *
	 * Sites with an ID *below* this value registered before Subscribers moved
	 * out of its old placement, so they need the transitional announcement.
	 * Sites at or above it only ever saw the current placement. The bound is
	 * exclusive: a site whose ID equals this value does not see the page.
	 *
	 * @var int
	 */
	const SITE_ID_CUTOFF = 256340000;

	/**
	 * Register request handlers and the wp-build loader.
	 *
	 * Called from Settings::init_hooks() so the AJAX/admin-post handlers exist
	 * on admin-ajax.php / admin-post.php requests, where `admin_menu` (and so
	 * add_menu()) never fires.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::is_enabled() ) {
			return;
		}

		add_action( 'wp_ajax_' . self::TOGGLE_ACTION, array( __CLASS__, 'handle_toggle_menu' ) );
		add_action( 'admin_post_' . self::GO_ACTION, array( __CLASS__, 'handle_go_to_newsletter' ) );

		// Priority 1 mirrors Settings::maybe_load_wp_build(): the modernization
		// filter has been registered by opt-in code by then, and the wp-build
		// render function must exist before menu callbacks are resolved.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
	}

	/**
	 * Whether the announcement page feature is active.
	 *
	 * This is the single gate for the whole feature: `init()` (handlers and the
	 * wp-build loader), `maybe_load_wp_build()`, and both menu-registration
	 * entry points consult it. They must agree — if the menu were registered
	 * while this returned false, maybe_load_wp_build() would bail, the wp-build
	 * render function would never be defined, and add_menu() would serve the
	 * bare render_fallback() page instead of the styled announcement app.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/** This filter is documented in projects/packages/newsletter/src/class-settings.php */
		if ( ! apply_filters( Settings::MODERNIZATION_FILTER, true ) ) {
			return false;
		}

		// Only sites predating the Subscribers move have anything to be told
		// about. Use the quiet lookup: it returns null rather than a WP_Error
		// when the site has no known ID, and comparing a WP_Error against an
		// int is a TypeError on PHP 8. A site with no known ID (disconnected)
		// is treated as newer and does not see the page.
		$site_id = Connection_Manager::get_site_id( true );

		return $site_id !== null && $site_id < self::SITE_ID_CUTOFF;
	}

	/**
	 * Load wp-build for the announcement page when the feature is enabled.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_enabled() || ! self::is_announcement_request() ) {
			return;
		}

		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register(
			'jetpack-newsletter',
			array_merge(
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::SCRIPT_HANDLES,
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::MODULE_IDS
			)
		);

		// wp-build registers standalone modules (e.g. the init module) on
		// wp_default_scripts, which has already fired by admin_menu. Register them
		// directly so the init module makes it into the import map.
		if ( function_exists( 'jetpack_newsletter_register_script_modules' ) ) {
			jetpack_newsletter_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
	}

	/**
	 * Alias the current screen ID to satisfy wp-build's auto-generated enqueue check.
	 *
	 * Mirrors Settings::alias_screen_id_for_wp_build(): wp-build enqueues only
	 * when the screen ID matches the wp-build page name, while our menu slug
	 * stays `jetpack-subscribers`.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( ! is_object( $screen ) ) {
			return;
		}

		$screen->id = self::WP_BUILD_PAGE;
	}

	/**
	 * Register the Subscribers announcement page under the Jetpack menu.
	 *
	 * When the user opted to remove the menu item, the page stays registered
	 * (so the page remains reachable directly and the choice can be undone)
	 * but the sidebar entry is removed.
	 *
	 * @return void
	 */
	public static function add_menu() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$callback = function_exists( 'jetpack_newsletter_jetpack_subscribers_announcement_wp_admin_render_page' )
			? 'jetpack_newsletter_jetpack_subscribers_announcement_wp_admin_render_page'
			: array( __CLASS__, 'render_fallback' );

		if ( get_option( self::REMOVED_OPTION ) ) {
			// Register as a hidden page (empty parent slug): it stays reachable
			// at its URL — so the choice can be undone from the page itself —
			// but never appears in the sidebar.
			$page_suffix = add_submenu_page(
				'',
				__( 'Subscribers', 'jetpack-newsletter' ),
				__( 'Subscribers', 'jetpack-newsletter' ),
				'manage_options',
				self::PAGE_SLUG,
				$callback
			);
		} else {
			$page_suffix = Admin_Menu::add_menu(
				__( 'Subscribers', 'jetpack-newsletter' ),
				__( 'Subscribers', 'jetpack-newsletter' ),
				'manage_options',
				self::PAGE_SLUG,
				$callback,
				15
			);
		}

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'on_page_load' ) );
		}
	}

	/**
	 * Register the announcement page directly under the Jetpack menu.
	 *
	 * Used on WordPress.com (Simple and WoA), where jetpack-mu-wpcom's
	 * wpcom-admin-menu owns the Jetpack menu and registers submenus with the
	 * core add_submenu_page() at a late priority — not the standalone plugin's
	 * Admin_Menu wrapper. Mirrors Settings::add_wp_admin_submenu().
	 *
	 * As in add_menu(), an empty parent slug keeps the page reachable at its URL
	 * (so the "remove from sidebar" choice can be undone) while hiding it from
	 * the sidebar.
	 *
	 * @return void
	 */
	public static function add_wp_admin_submenu() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$callback = function_exists( 'jetpack_newsletter_jetpack_subscribers_announcement_wp_admin_render_page' )
			? 'jetpack_newsletter_jetpack_subscribers_announcement_wp_admin_render_page'
			: array( __CLASS__, 'render_fallback' );

		$parent_slug = get_option( self::REMOVED_OPTION ) ? '' : 'jetpack';

		$page_suffix = add_submenu_page(
			$parent_slug,
			__( 'Subscribers', 'jetpack-newsletter' ),
			__( 'Subscribers', 'jetpack-newsletter' ),
			'manage_options',
			self::PAGE_SLUG,
			$callback
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'on_page_load' ) );
		}
	}

	/**
	 * Page-load actions: record the page view and expose the app data.
	 *
	 * @return void
	 */
	public static function on_page_load() {
		add_action( 'admin_head', array( __CLASS__, 'print_app_data' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_i18n_loader' ) );

		self::tracking()->record_user_event(
			'subscribers_announcement_page_view',
			array( 'menu_removed' => (bool) get_option( self::REMOVED_OPTION ) )
		);
	}

	/**
	 * Enqueue the i18n loader so the wp-build init module can download its JS
	 * translation catalogs. It's registered on every admin page by jetpack-assets
	 * but only enqueued when depended on; the esbuild bundles don't pull it in.
	 *
	 * @return void
	 */
	public static function enqueue_i18n_loader() {
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}

	/**
	 * Print the data the announcement app needs (URLs, nonce, current state).
	 *
	 * @return void
	 */
	public static function print_app_data() {
		$data = array(
			'ajaxUrl'           => admin_url( 'admin-ajax.php' ),
			'toggleAction'      => self::TOGGLE_ACTION,
			'toggleNonce'       => wp_create_nonce( self::TOGGLE_ACTION ),
			// Built with add_query_arg (not wp_nonce_url, which HTML-escapes
			// the ampersands) because the app navigates to it via JS.
			'goToNewsletterUrl' => add_query_arg(
				array(
					'action'   => self::GO_ACTION,
					'_wpnonce' => wp_create_nonce( self::GO_ACTION ),
				),
				admin_url( 'admin-post.php' )
			),
			'menuRemoved'       => (bool) get_option( self::REMOVED_OPTION ),
			'menuSlug'          => self::PAGE_SLUG,
		);

		printf(
			'<script>window.JetpackSubscribersAnnouncementData = %s;</script>',
			wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT )
		);
	}

	/**
	 * Minimal fallback when the wp-build bundle is unavailable.
	 *
	 * @return void
	 */
	public static function render_fallback() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Subscribers moved', 'jetpack-newsletter' ); ?></h1>
			<p><?php esc_html_e( 'Now it’s part of Jetpack → Newsletter.', 'jetpack-newsletter' ); ?></p>
			<p>
				<a class="button button-primary" href="<?php echo esc_url( Urls::get_newsletter_settings_url() ); ?>">
					<?php esc_html_e( 'Take me to Newsletter', 'jetpack-newsletter' ); ?>
				</a>
			</p>
		</div>
		<?php
	}

	/**
	 * AJAX handler persisting the "remove Subscribers from the sidebar" choice.
	 *
	 * @return void
	 */
	public static function handle_toggle_menu() {
		check_ajax_referer( self::TOGGLE_ACTION );

		if ( ! current_user_can( 'manage_options' ) || ! self::is_enabled() ) {
			wp_send_json_error( 'unauthorized', 403, JSON_HEX_TAG | JSON_HEX_AMP );
		}

		$removed = isset( $_POST['removed'] ) && '1' === $_POST['removed'];
		update_option( self::REMOVED_OPTION, $removed ? 1 : 0, false );

		self::tracking()->record_user_event(
			'subscribers_announcement_remove_menu_click',
			array( 'removed' => $removed )
		);

		wp_send_json_success( array( 'removed' => $removed ), 200, JSON_HEX_TAG | JSON_HEX_AMP );
	}

	/**
	 * Admin-post handler recording the "Take me to Newsletter" click, then redirecting.
	 *
	 * Tracking the click server-side before the redirect avoids relying on a
	 * JS tracking pipeline on a page that is otherwise static.
	 *
	 * @return never
	 */
	public static function handle_go_to_newsletter() {
		check_admin_referer( self::GO_ACTION );

		if ( current_user_can( 'manage_options' ) && self::is_enabled() ) {
			self::tracking()->record_user_event( 'subscribers_announcement_newsletter_click' );
		}

		wp_safe_redirect( admin_url( 'admin.php?page=' . Settings::ADMIN_PAGE_SLUG ) );
		exit( 0 );
	}

	/**
	 * Get a Tracking instance.
	 *
	 * The product name stays `jetpack` so the events are recorded as
	 * `jetpack_subscribers_announcement_*` regardless of which plugin
	 * bundles this package.
	 *
	 * @return Tracking
	 */
	private static function tracking() {
		return new Tracking( 'jetpack', new Connection_Manager( 'jetpack' ) );
	}

	/**
	 * Returns true when the current request targets the announcement page.
	 *
	 * @return bool
	 */
	private static function is_announcement_request() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === self::PAGE_SLUG; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}
