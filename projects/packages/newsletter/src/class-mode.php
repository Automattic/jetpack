<?php
/**
 * Newsletter Mode: a focused, opt-in newsletter workspace inside wp-admin.
 *
 * This class owns the state that gates the mode: a plain per-site option plus
 * small helpers that both the standalone Jetpack plugin and jetpack-mu-wpcom can
 * call. It deliberately uses a plain WP option (NOT the shared settings
 * whitelist) so the value is readable via get_option() early enough — before
 * `admin_menu` — to drive menu rendering on the same page load.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Status\Host;

/**
 * Owns Newsletter Mode state and request-scoping helpers.
 */
class Mode {

	/**
	 * Per-site option storing whether Newsletter Mode is switched on.
	 *
	 * Plain WP option (boolean, default false). Intentionally NOT registered with
	 * the shared jetpack/v4/settings whitelist — it is written by a package-owned
	 * endpoint and read via get_option() before `admin_menu` runs.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_newsletter_mode_enabled';

	/**
	 * REST namespace for the package-owned Newsletter Mode route.
	 *
	 * Deliberately a package-owned namespace (not `jetpack/v4`) so persisting the
	 * flag does not require registering it on the shared settings whitelist.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack-newsletter/v1';

	/**
	 * Slug of the mode-only Dashboard page (first item in the focused nav).
	 *
	 * @var string
	 */
	const PAGE_DASHBOARD = 'jetpack-newsletter-home';

	/**
	 * Slug of the mode-only Paid page (last item in the focused nav).
	 *
	 * @var string
	 */
	const PAGE_PAID = 'jetpack-newsletter-paid';

	/**
	 * Query arg marking a shared wp-admin screen as reached from the mode's nav.
	 *
	 * Posts and Replies are core screens the whole of wp-admin links to, so —
	 * unlike the mode's own pages — the URL alone can't say whether the visitor
	 * is inside the mode. The curated nav appends this to its links; arriving at
	 * the same screen from the normal menu carries no marker and stays normal.
	 *
	 * @var string
	 */
	const NAV_QUERY_ARG = 'newsletter-mode';

	/**
	 * Whether init() has already wired up hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire up Newsletter Mode hooks (idempotent).
	 *
	 * Must be called on every request — including REST API requests, which are
	 * NOT is_admin() — so `register_rest_routes` runs on `rest_api_init`.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'rest_api_init', array( self::class, 'register_rest_routes' ) );

		// Register the top-level "Newsletters" menu link when the mode is on. On
		// wpcom Simple the Jetpack menu is built at priority 999999, so match that
		// ordering there; standalone Jetpack / Atomic use an early priority so the
		// submenu-hiding filter lands before Settings adds its submenu at 999.
		$menu_priority = ( new Host() )->is_wpcom_simple() ? 999999 : 1;
		add_action( 'admin_menu', array( self::class, 'maybe_register_admin_menu' ), $menu_priority );

		// Declutter the left menu on newsletter-mode surfaces down to the focused
		// nav. Runs at a very late priority so it happens after every menu builder
		// (including wpcom's 999999 ones) has finished.
		add_action( 'admin_menu', array( self::class, 'maybe_declutter_menu' ), 1000000 );

		// Fix the browser-tab title on the Newsletter page (which is a hidden,
		// empty-parent page once the mode hides the Jetpack submenu).
		add_filter( 'admin_title', array( self::class, 'maybe_filter_admin_title' ), 10, 2 );

		// Keep the Newsletter page's layout CSS working. Hiding the Jetpack
		// submenu turns the page into a hidden (empty-parent) page, which flips
		// its <body> class from `jetpack_page_jetpack-newsletter` to
		// `admin_page_jetpack-newsletter` — but the wp-build layout mixin is keyed
		// on the former. Add the expected class back on that page.
		add_filter( 'admin_body_class', array( self::class, 'maybe_add_body_class' ) );

		// Render the "Newsletters" header (with a chevron exit link) at the top of
		// the decluttered menu on mode surfaces: styles here, markup injected in
		// the footer once #adminmenu exists in the DOM.
		add_action( 'admin_enqueue_scripts', array( self::class, 'maybe_enqueue_mode_assets' ) );
		add_action( 'admin_footer', array( self::class, 'maybe_render_mode_header' ) );

		// Mark the Subscribers / Settings nav item as current. Unlike the mode's
		// own pages, those two can only be resolved client side.
		add_action( 'admin_footer', array( self::class, 'maybe_highlight_newsletter_nav_item' ) );

		// Same for Posts / Replies, whose nav slugs carry NAV_QUERY_ARG.
		add_filter( 'parent_file', array( self::class, 'maybe_mark_core_screen_current' ) );

		// Keep NAV_QUERY_ARG across the list-table filter/search forms on those
		// screens, which submit their own fields rather than the current URL.
		add_action( 'restrict_manage_posts', array( self::class, 'maybe_render_nav_marker_field' ) );
		add_action( 'restrict_manage_comments', array( self::class, 'maybe_render_nav_marker_field' ) );

		// Let the mu-wpcom Write editor's back button return to the Newsletter
		// page (the "Write & send" link passes source=newsletter).
		add_filter( 'wpcom_write_back_destinations', array( self::class, 'add_write_back_destination' ) );

		// That filter only exists in a mu-wpcom this plugin doesn't ship, so also
		// override the destination directly on the editor page.
		add_action( 'admin_footer', array( self::class, 'maybe_override_write_back_url' ) );

		// Load the wp-build assets + generated render functions on the mode's own
		// AdminPage pages (Dashboard, Paid). Priority 1 mirrors Settings so the
		// render functions exist before the menu callbacks fire.
		add_action( 'admin_menu', array( self::class, 'maybe_load_wp_build' ), 1 );
	}

	/**
	 * Whether the current request targets one of the mode's own wp-build
	 * AdminPage pages (Dashboard or Paid). Their menu slugs double as their
	 * wp-build page ids.
	 *
	 * @return bool
	 */
	private static function is_wp_build_page() {
		if ( ! self::is_enabled() || ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		$page = sanitize_text_field( wp_unslash( $_GET['page'] ) );

		return in_array( $page, array( self::PAGE_DASHBOARD, self::PAGE_PAID ), true );
	}

	/**
	 * Load the newsletter package's wp-build bundle so the generated AdminPage
	 * render + enqueue functions exist for the Dashboard / Paid pages. Mirrors
	 * Settings::maybe_load_wp_build() / Subscribers_Announcement.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_wp_build_page() ) {
			return;
		}

		$build_index = dirname( __DIR__ ) . '/build/build.php';
		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		// The wp-build tool also generates a standalone full-screen page.php that
		// hooks admin_init and takes over the request (no wp-admin chrome). We want
		// the *embedded* AdminPage (so the mode nav stays), so drop those
		// interceptors. This admin_menu hook runs before admin_init, so removing
		// them here prevents the takeover.
		remove_action( 'admin_init', 'jetpack_newsletter_jetpack_newsletter_home_intercept_render' );
		remove_action( 'admin_init', 'jetpack_newsletter_jetpack_newsletter_paid_intercept_render' );

		\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register(
			'jetpack-newsletter',
			array_merge(
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::SCRIPT_HANDLES,
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::MODULE_IDS
			)
		);

		add_action( 'current_screen', array( self::class, 'alias_screen_id' ) );
	}

	/**
	 * Alias the screen id to the page's wp-build id so the generated enqueue
	 * gate (which matches on the bare page id) fires. WP would otherwise report
	 * `admin_page_<slug>` for these hidden pages.
	 *
	 * @param \WP_Screen|null $screen The current screen (passed by WP).
	 * @return void
	 */
	public static function alias_screen_id( $screen ) {
		if ( ! is_object( $screen ) || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		$page = sanitize_text_field( wp_unslash( $_GET['page'] ) );

		if ( in_array( $page, array( self::PAGE_DASHBOARD, self::PAGE_PAID ), true ) ) {
			$screen->id = $page;
		}
	}

	/**
	 * Where the Write editor's back button should return to — the mode's landing
	 * surface, matching where the "Newsletters" menu link enters.
	 *
	 * @return string
	 */
	private static function get_write_back_url() {
		return admin_url( 'admin.php?page=' . self::PAGE_DASHBOARD );
	}

	/**
	 * Register the mode as a Write editor "back" destination, so the editor's
	 * back button returns to it instead of the dashboard.
	 * Consumed by wpcom_write_resolve_back_url() for source=newsletter.
	 *
	 * @param array $destinations Map of source token to destination URL.
	 * @return array
	 */
	public static function add_write_back_destination( $destinations ) {
		$destinations['newsletter'] = self::get_write_back_url();

		return $destinations;
	}

	/**
	 * Point the Write editor's back button at the mode, without depending on the
	 * editor's own destination map.
	 *
	 * The editor resolves where "back" goes from `?source=`, but that lookup —
	 * and the `wpcom_write_back_destinations` filter add_write_back_destination()
	 * registers against — lives in jetpack-mu-wpcom, which this plugin does not
	 * ship: it reaches sites via mu-wpcom-plugin / wpcomsh, deployed by
	 * WordPress.com. So on a site whose mu-wpcom predates that filter, `newsletter`
	 * is simply not a key in the map and the editor falls back to `admin_url()` —
	 * the plain dashboard — no matter what `source` we pass.
	 *
	 * Overriding it here keeps the button working on those sites today, and stays
	 * harmless once the filter ships (both resolve to the same URL). Both exit
	 * paths need covering: a back-click on a clean post follows the link's href,
	 * while a dirty post routes through the leave-confirm modal, which navigates
	 * to the Interactivity store's `backUrl`.
	 *
	 * @return void
	 */
	public static function maybe_override_write_back_url() {
		if ( ! self::is_enabled() || ! is_admin() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		if ( ! isset( $_GET['page'] ) || ! isset( $_GET['source'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		if ( 'write' !== sanitize_key( wp_unslash( $_GET['page'] ) ) || 'newsletter' !== sanitize_key( wp_unslash( $_GET['source'] ) ) ) {
			return;
		}

		$back_url = self::get_write_back_url();

		// Merges over the value the editor seeded while rendering the page: the
		// state is not serialized until the script modules print, which happens
		// after admin_footer.
		if ( function_exists( 'wp_interactivity_state' ) ) {
			wp_interactivity_state( 'wpcom-write', array( 'backUrl' => $back_url ) );
		}

		wp_print_inline_script_tag(
			sprintf(
				'( function () {' .
					'var back = document.querySelector( "a.bw-back" );' .
					'if ( back ) { back.href = %1$s; }' .
				'}() );',
				wp_json_encode( $back_url, JSON_HEX_TAG | JSON_HEX_AMP )
			)
		);
	}

	/**
	 * When the mode is enabled, add a top-level "Newsletters" menu link and hide
	 * the default "Jetpack → Newsletter" submenu so there is no duplicate entry.
	 *
	 * The top-level item uses a page URL as its menu slug, so it deep-links to
	 * the mode's Dashboard (the landing surface) rather than creating another
	 * page or render callback here. Core add_menu_page() is used deliberately:
	 * the admin-ui Admin_Menu wrapper only creates submenus under `jetpack`,
	 * never a new top-level root.
	 *
	 * @return void
	 */
	public static function maybe_register_admin_menu() {
		if ( ! self::is_enabled() ) {
			return;
		}

		// Hide the default "Jetpack → Newsletter" submenu; the page stays
		// reachable by URL. Added before Settings::add_wp_admin_menu() (priority
		// 999) reads the filter, so it takes effect this request.
		add_filter( 'jetpack_show_newsletter_menu_item', '__return_false' );

		add_menu_page(
			/** "Newsletters" is a product surface name. */
			__( 'Newsletters', 'jetpack-newsletter' ),
			__( 'Newsletters', 'jetpack-newsletter' ),
			'manage_options',
			'admin.php?page=' . self::PAGE_DASHBOARD,
			'',
			'dashicons-email',
			3.9
		);

		// Register the mode-only stub pages as hidden pages (empty parent =
		// reachable by URL, absent from the normal menu). The curated nav in
		// maybe_declutter_menu links to them; they only exist while the mode is on.
		add_submenu_page(
			'',
			__( 'Dashboard', 'jetpack-newsletter' ),
			__( 'Dashboard', 'jetpack-newsletter' ),
			'manage_options',
			self::PAGE_DASHBOARD,
			array( self::class, 'render_dashboard_page' )
		);
		add_submenu_page(
			'',
			__( 'Paid', 'jetpack-newsletter' ),
			__( 'Paid', 'jetpack-newsletter' ),
			'manage_options',
			self::PAGE_PAID,
			array( self::class, 'render_paid_page' )
		);
	}

	/**
	 * On the newsletter surface, strip the left menu down to a focused nav.
	 *
	 * Keeps the native wp-admin frame (admin bar + left menu column) but removes
	 * the unrelated top-level items and rebuilds a short list: an exit link back
	 * to the full dashboard, then the newsletter surfaces. Uses core
	 * remove_menu_page()/add_menu_page() (the sanctioned "menu sweep" approach)
	 * rather than mutating the raw globals, so access checks stay intact. The
	 * admin bar is untouched.
	 *
	 * @return void
	 */
	public static function maybe_declutter_menu() {
		if ( ! self::is_mode_surface() ) {
			return;
		}

		global $menu, $submenu;

		// Remove every existing top-level item; we rebuild a focused set below.
		$slugs = array();
		foreach ( (array) $menu as $item ) {
			if ( ! empty( $item[2] ) ) {
				$slugs[] = $item[2];
			}
		}
		foreach ( $slugs as $slug ) {
			remove_menu_page( $slug );
		}

		$nav = self::get_nav_slugs();

		// The exit affordance is the chevron in the injected "Newsletters" header
		// (see maybe_render_mode_header), not a menu item.
		//
		// Dashboard and Paid pass their render callbacks here because taking their
		// bare page slug as the menu slug moves their page hook from
		// `admin_page_<slug>` (set by the hidden registration in
		// maybe_register_admin_menu) to `toplevel_page_<slug>`; without the
		// callback on the item that owns the slug, the page would render empty.
		add_menu_page(
			__( 'Dashboard', 'jetpack-newsletter' ),
			__( 'Dashboard', 'jetpack-newsletter' ),
			'manage_options',
			$nav['dashboard'],
			array( self::class, 'render_dashboard_page' ),
			'none',
			3
		);
		add_menu_page(
			__( 'Posts', 'jetpack-newsletter' ),
			__( 'Posts', 'jetpack-newsletter' ),
			'edit_posts',
			$nav['posts'],
			'',
			'none',
			4
		);
		add_menu_page(
			__( 'Subscribers', 'jetpack-newsletter' ),
			__( 'Subscribers', 'jetpack-newsletter' ),
			'manage_options',
			$nav['subscribers'],
			'',
			'none',
			5
		);
		add_menu_page(
			__( 'Replies', 'jetpack-newsletter' ),
			__( 'Replies', 'jetpack-newsletter' ),
			'moderate_comments',
			$nav['replies'],
			'',
			'none',
			6
		);
		add_menu_page(
			__( 'Paid', 'jetpack-newsletter' ),
			__( 'Paid', 'jetpack-newsletter' ),
			'manage_options',
			$nav['paid'],
			array( self::class, 'render_paid_page' ),
			'none',
			7
		);
		add_menu_page(
			__( 'Settings', 'jetpack-newsletter' ),
			__( 'Settings', 'jetpack-newsletter' ),
			'manage_options',
			$nav['settings'],
			'',
			'none',
			8
		);

		// The nav is deliberately flat: every item is a single destination, so
		// strip the submenus the native screens bring with them (Posts otherwise
		// flies out to All Posts / Add Post / Categories / Tags). The top-level
		// sweep above only clears $menu — submenus live in their own global and
		// survive it. Sweeping $menu rather than naming slugs keeps this correct
		// if the nav gains another core screen. Each item's own link is unchanged:
		// with no children, core builds the href from the item's slug instead of
		// its first submenu entry, which for Posts is edit.php either way.
		foreach ( (array) $menu as $item ) {
			if ( empty( $item[2] ) ) {
				continue;
			}

			// $submenu is keyed on the bare screen, but the nav's core-screen
			// items carry NAV_QUERY_ARG, so drop the query string first — the same
			// way core resolves a menu slug to a file in menu-header.php.
			$screen = $item[2];
			$query  = strpos( $screen, '?' );
			if ( false !== $query ) {
				$screen = substr( $screen, 0, $query );
			}

			if ( empty( $submenu[ $screen ] ) ) {
				continue;
			}

			foreach ( wp_list_pluck( $submenu[ $screen ], 2 ) as $child_slug ) {
				remove_submenu_page( $screen, $child_slug );
			}
		}
	}

	/**
	 * The menu slugs of the curated nav's plugin-page items, keyed by surface.
	 *
	 * The mode's own pages use their bare page slug. That is what makes them
	 * highlight when current: core resolves the active top-level item by looking
	 * for a `$menu` entry whose slug equals the current `?page=` value (see
	 * get_admin_page_parent(), called from wp-admin/menu-header.php), then
	 * compares that back against each item's slug in _wp_menu_output(). A
	 * link-style `admin.php?page=…` slug matches neither test, so such an item can
	 * never be marked current — it always renders `wp-not-current-submenu`.
	 *
	 * The two Newsletter-page entries keep the link-style form deliberately: that
	 * page is registered and rendered by Settings, and claiming its slug here
	 * would repoint its page hook and drop the `load-{$page_suffix}` binding that
	 * loads its assets. They are marked current in
	 * maybe_highlight_newsletter_nav_item() instead.
	 *
	 * Posts and Replies carry NAV_QUERY_ARG so the shared core screens they point
	 * at can tell a visit from inside the mode apart from one from the normal
	 * menu — which also puts a `?` in their slug, so they are marked current in
	 * maybe_mark_core_screen_current() rather than by core's slug match.
	 *
	 * @return array<string, string>
	 */
	private static function get_nav_slugs() {
		$newsletter_url = 'admin.php?page=' . Settings::ADMIN_PAGE_SLUG;
		$mode_arg       = '?' . self::NAV_QUERY_ARG . '=1';

		return array(
			'dashboard'   => self::PAGE_DASHBOARD,
			'posts'       => 'edit.php' . $mode_arg,
			'subscribers' => $newsletter_url,
			'replies'     => 'edit-comments.php' . $mode_arg,
			'paid'        => self::PAGE_PAID,
			// The SPA router encodes its path+search into a single `p` param, so
			// encode the value rather than letting the nested `?`/`&` be parsed as
			// separate query args.
			'settings'    => $newsletter_url . '&p=' . rawurlencode( '/?tab=settings' ),
		);
	}

	/**
	 * Resolve the "Write" URL — the mu-wpcom Write editor (returning to the
	 * Newsletter page via source=newsletter) when its feature is loaded, else the
	 * block editor on standalone Jetpack.
	 *
	 * @return string
	 */
	private static function get_write_url() {
		if ( function_exists( 'wpcom_write_url' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists(); wpcom_write_url() is provided by jetpack-mu-wpcom on WP.com Simple/Atomic.
			return add_query_arg( 'source', 'newsletter', wpcom_write_url() );
		}

		return admin_url( 'post-new.php' );
	}

	/**
	 * Render the mode-only Dashboard stub page.
	 *
	 * @return void
	 */
	public static function render_dashboard_page() {
		self::render_wp_build_page(
			'jetpack_newsletter_jetpack_newsletter_home_wp_admin_render_page',
			__( 'Dashboard', 'jetpack-newsletter' )
		);
	}

	/**
	 * Render the mode-only Paid page (its wp-build AdminPage).
	 *
	 * @return void
	 */
	public static function render_paid_page() {
		self::render_wp_build_page(
			'jetpack_newsletter_jetpack_newsletter_paid_wp_admin_render_page',
			__( 'Paid', 'jetpack-newsletter' )
		);
	}

	/**
	 * Render a mode page through its generated wp-build AdminPage function when
	 * available; fall back to a simple stub (e.g. before the package is built).
	 * Calls the function via a variable so static analysis doesn't flag the
	 * generated symbol as undeclared.
	 *
	 * @param string $render_fn Generated wp-build render function name.
	 * @param string $heading   Fallback heading if the build isn't present.
	 * @return void
	 */
	private static function render_wp_build_page( $render_fn, $heading ) {
		if ( function_exists( $render_fn ) ) {
			$render_fn();
			return;
		}

		printf(
			'<div class="wrap"><h1>%1$s</h1><p>%2$s</p></div>',
			esc_html( $heading ),
			esc_html__( 'Coming soon.', 'jetpack-newsletter' )
		);
	}

	/**
	 * Give each mode surface a proper browser-tab title. Mode pages are hidden
	 * (empty-parent) pages whose title get_admin_page_title() can't resolve, so
	 * the tab would otherwise show only the site name.
	 *
	 * @param string $admin_title The full <title> text WordPress computed.
	 * @param string $title       The page-title portion (empty for hidden pages).
	 * @return string
	 */
	public static function maybe_filter_admin_title( $admin_title, $title ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing.
		if ( '' !== $title || ! self::is_mode_surface() || ! isset( $_GET['page'] ) ) {
			return $admin_title;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing; guarded by isset above.
		$page   = sanitize_text_field( wp_unslash( $_GET['page'] ) );
		$labels = array(
			self::PAGE_DASHBOARD => __( 'Dashboard', 'jetpack-newsletter' ),
			self::PAGE_PAID      => __( 'Paid', 'jetpack-newsletter' ),
		);

		// "Newsletter" is a product name; used for the unified page and as fallback.
		$label = isset( $labels[ $page ] ) ? $labels[ $page ] : 'Newsletter';

		return $label . $admin_title;
	}

	/**
	 * Restore the expected <body> class on the mode's surfaces, so their layout
	 * CSS still applies even though the mode changes how the pages are
	 * registered. Two cases, in opposite directions:
	 *
	 * - The Newsletter page's CSS is keyed on `body.jetpack_page_jetpack-newsletter`,
	 *   but hiding the Jetpack submenu makes it a hidden page → `admin_page_…`.
	 * - Dashboard and Paid are keyed on `body.admin_page_<slug>` (see their
	 *   route.scss), the class WP gives a hidden page — but the curated nav
	 *   registers them as top-level pages so they can be marked current, which
	 *   renames the class to `toplevel_page_<slug>`.
	 *
	 * @param string $classes Space-separated admin body classes.
	 * @return string
	 */
	public static function maybe_add_body_class( $classes ) {
		if ( self::is_active_for_request() ) {
			$classes .= ' jetpack_page_jetpack-newsletter';
		}

		if ( self::is_wp_build_page() && isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing; is_wp_build_page() has already matched this against the mode's own page slugs.
			$classes .= ' admin_page_' . sanitize_text_field( wp_unslash( $_GET['page'] ) );
		}

		return $classes;
	}

	/**
	 * Enqueue styles for the injected "Newsletters" menu header on mode surfaces.
	 *
	 * @return void
	 */
	public static function maybe_enqueue_mode_assets() {
		if ( ! self::is_mode_surface() ) {
			return;
		}

		$handle = 'jetpack-newsletter-mode';
		wp_register_style( $handle, false, array(), '1.0' );
		wp_enqueue_style( $handle );
		wp_add_inline_style(
			$handle,
			'#adminmenu .jetpack-newsletter-mode-header {
				display: flex;
				align-items: center;
				gap: 4px;
				padding: 14px 12px 14px 0;
				margin: 0;
			}
			#adminmenu .jetpack-newsletter-mode-header .jetpack-newsletter-mode-exit {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				/* No color set: inherit the active color scheme #adminmenu link color. */
				opacity: 0.7;
				text-decoration: none;
			}
			#adminmenu .jetpack-newsletter-mode-header .jetpack-newsletter-mode-exit:hover,
			#adminmenu .jetpack-newsletter-mode-header .jetpack-newsletter-mode-exit:focus {
				opacity: 1;
			}
			#adminmenu .jetpack-newsletter-mode-header .jetpack-newsletter-mode-exit svg {
				display: block;
				width: 24px;
				height: 24px;
				fill: currentColor;
			}
			#adminmenu .jetpack-newsletter-mode-header p {
				margin: 0;
				padding: 0;
				/* Menu text color: wpcom sidebar-text var, light fallback for core schemes. */
				color: var( --color-sidebar-text, #fff );
				/* Match the left-nav link size/weight. */
				font-size: 14px;
				font-weight: 400;
				line-height: 1.4;
			}
			/* Collapsed menu (#collapse-button → body.folded, or the responsive
			   auto-fold range): show only the chevron, hide the heading text —
			   mirroring how core folds a normal menu item to icon-only. */
			body.folded #adminmenu .jetpack-newsletter-mode-header {
				justify-content: center;
				padding-left: 0;
				padding-right: 0;
			}
			body.folded #adminmenu .jetpack-newsletter-mode-header p {
				display: none;
			}
			@media only screen and ( min-width: 783px ) and ( max-width: 960px ) {
				.auto-fold #adminmenu .jetpack-newsletter-mode-header {
					justify-content: center;
					padding-left: 0;
					padding-right: 0;
				}
				.auto-fold #adminmenu .jetpack-newsletter-mode-header p {
					display: none;
				}
			}
			/* Prominent "Write" button at the top of the nav (below the header). */
			#adminmenu .jetpack-newsletter-mode-write {
				margin: 0;
				padding: 4px 12px 12px;
			}
			#adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 6px;
				/* Neutral surface button (not the accent/primary color). */
				background: var( --color-surface, #fff );
				color: var( --color-text, #1e1e1e );
				font-size: 14px;
				font-weight: 400;
				line-height: 1.4;
				padding: 8px 16px;
				max-height: 40px;
				box-sizing: border-box;
				border-radius: 4px;
				text-decoration: none;
				box-shadow: none;
			}
			#adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn:hover,
			#adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn:focus {
				background: var( --color-neutral-5, #f0f0f1 );
				color: var( --color-text, #1e1e1e );
				box-shadow: none;
			}
			#adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn svg {
				display: block;
				width: 20px;
				height: 20px;
				flex-shrink: 0;
			}
			/* Collapsed menu: compact icon-only button (text hidden). */
			body.folded #adminmenu .jetpack-newsletter-mode-write {
				padding: 4px 6px 8px;
			}
			body.folded #adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn {
				padding: 8px;
			}
			body.folded #adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn span {
				display: none;
			}
			body.folded #adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn svg {
				display: block;
			}
			@media only screen and ( min-width: 783px ) and ( max-width: 960px ) {
				.auto-fold #adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn span {
					display: none;
				}
				.auto-fold #adminmenu .jetpack-newsletter-mode-write .jetpack-newsletter-mode-write-btn svg {
					display: block;
				}
			}
			/* Subscribers/Settings live in the left nav in mode, so hide the
			   in-page tab bar (the tab content stays; only the bar is hidden). */
			.jp-admin-page-tabs {
				display: none;
			}
			/* Hide the WordPress.com site-notices upsell banner, which a late hook
			   injects into #adminmenu after our declutter runs. */
			#adminmenu #toplevel_page_site-notices {
				display: none !important;
			}'
		);

		// Scheme-aware custom SVG icons for the menu items (masked + currentColor).
		wp_add_inline_style( $handle, self::get_menu_icon_css() );

		// On WP.com Simple/Atomic the platform menu is 272px wide (set by the
		// masterbar package). That rule doesn't apply in mode, so re-assert it so
		// the focused nav matches the platform. Desktop only — leave the folded /
		// auto-fold responsive widths to core.
		if ( ( new Host() )->is_wpcom_platform() ) {
			wp_add_inline_style(
				$handle,
				'@media ( min-width: 961px ) {
					body:not(.folded) #adminmenuback,
					body:not(.folded) #adminmenuwrap,
					body:not(.folded) #adminmenu {
						width: 272px;
					}
					body:not(.folded) #wpcontent,
					body:not(.folded) #wpfooter {
						margin-left: 272px;
					}
				}'
			);
		}
	}

	/**
	 * Build scheme-aware CSS for the custom menu-item icons.
	 *
	 * Each SVG is applied as a CSS mask on the item's `.wp-menu-image` box with
	 * `background-color: currentColor`, so it recolors to match the active admin
	 * color scheme (resting / hover / current) — the way native dashicons do.
	 * Items are targeted by href so the selectors stay stable.
	 *
	 * @return string
	 */
	private static function get_menu_icon_css() {
		$icons = array(
			// Dashboard.
			'a[href*="jetpack-newsletter-home"]' => '<svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m16.5 2c.8284 0 1.5.67157 1.5 1.5v13c0 .8284-.6716 1.5-1.5 1.5h-13c-.82843 0-1.5-.6716-1.5-1.5v-13c0-.82843.67157-1.5 1.5-1.5zm-10.875 9v4h1.75v-4zm3.5 4h1.75v-7h-1.75zm3.5 0h1.75v-10h-1.75z" fill="#fff"/></svg>',
			// Posts (edit.php).
			'a[href^="edit.php"]'                => '<svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m18.0588 8.36327c.4947-.36224.5499-1.08037.1163-1.51397l-5.034-5.034c-.4303-.43031-1.1419-.37973-1.5071.10711l-3.55535 4.74051c-1.21348-.10112-2.42696.10113-3.64045.70787-.10112 0-.10112.10112-.20225.10112-.32088.19253-.60104.38506-.84046.57759-.2152.17305-.21473.49081-.01946.68608l3.38801 3.38802-5.76404 5.764v1.1124h1.11236l5.76404-5.764 3.388 3.388c.1953.1952.5142.197.6929-.0136.2395-.2821.4297-.5642.5708-.8464.1011-.1011.1011-.2022.2022-.3033.6068-1.1124.809-2.427.6068-3.6405z" fill="#fff"/></svg>',
			// Subscribers (the bare Newsletter page URL).
			'a[href$="page=jetpack-newsletter"]' => '<svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m19 15.5c0 .8284-.6716 1.5-1.5 1.5h-15c-.82843 0-1.5-.6716-1.5-1.5v-8.09863l8.50586 5.82033.50004.3428.4961-.3477 8.498-5.94922zm-1.5-12.5c.8284 0 1.5.67157 1.5 1.5v.63086l-9.00684 6.30464-8.99316-6.15327v-.78223c0-.82843.67157-1.5 1.5-1.5z" fill="#fff"/></svg>',
			// Replies (edit-comments.php).
			'a[href^="edit-comments.php"]'       => '<svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m16 2h-12c-1.1 0-2 .9-2 2v12.9c0 .6.5 1.1 1.1 1.1.3 0 .5-.1.8-.3l2.6-2.7h9.5c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2z" fill="#fff"/></svg>',
			// Paid.
			'a[href*="jetpack-newsletter-paid"]' => '<svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m19 15.5c0 .8284-.6716 1.5-1.5 1.5h-15c-.82843 0-1.5-.6716-1.5-1.5v-6.625h18zm-1.5-12.5c.8284 0 1.5.67157 1.5 1.5v2.625h-18v-2.625c0-.82843.67157-1.5 1.5-1.5z" fill="#fff"/></svg>',
			// Settings (carries the tab param).
			'a[href*="jetpack-newsletter"][href*="settings"]' => '<svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><clipPath id="a"><path d="m0 0h20v20h-20z"/></clipPath><g clip-path="url(#a)"><path clip-rule="evenodd" d="m12.226 1.77803c-.0025-.34164-.2789-.61797-.6205-.62043l-3.3195-.02396c-.16733-.00121-.32815.06473-.44647.18306-.11831.11832-.18424.27915-.18303.44648.01364 1.8736-2.07741 3.06983-3.74144 2.1091-.29893-.17258-.68117-.07017-.85375.22874l-1.63904 2.8389c-.17258.29893-.07017.68118.22877.85377 1.66361.96049 1.67285 3.36871.04309 4.29401-.1455.0826-.25181.2201-.29515.3817-.04329.1616-.02002.3339.06471.4782l1.6805 2.8628c.17296.2946.55042.3958.84755.2271 1.682-.9548 3.77042.2509 3.78456 2.1849.00241.3417.2788.618.62041.6204l3.31949.024c.1674.0013.3282-.0648.4465-.183.1183-.1184.1843-.2792.183-.4465-.0136-1.8744 2.0759-3.0705 3.7391-2.1103.2989.1726.6812.0702.8538-.2287l1.639-2.8389c.1726-.299.0701-.6812-.2288-.8538-1.6636-.9605-1.6728-3.36878-.0431-4.29401.1456-.08259.2519-.22009.2952-.38173s.02-.33386-.0647-.47816l-1.6805-2.86279c-.173-.29468-.5505-.39584-.8475-.22714-1.6809.95423-3.7681-.25084-3.7822-2.18374zm-3.68438 10.74747c1.39502.8054 3.17878.3275 3.98428-1.0676.8054-1.395.3274-3.17879-1.0676-3.98421-1.395-.80541-3.17884-.32744-3.98425 1.06758-.80542 1.39502-.32745 3.17883 1.06757 3.98423z" fill="#fff" fill-rule="evenodd"/></g></svg>',
		);

		$css = '';
		foreach ( $icons as $selector => $svg ) {
			$uri  = 'data:image/svg+xml,' . rawurlencode( $svg );
			$css .= sprintf(
				'#adminmenu %1$s .wp-menu-image{' .
					'background-image:none;' .
					'background-color:currentColor;' .
					'-webkit-mask-image:url("%2$s");mask-image:url("%2$s");' .
					'-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;' .
					'-webkit-mask-position:center;mask-position:center;' .
					'-webkit-mask-size:20px auto;mask-size:20px auto;' .
				'}',
				$selector,
				$uri
			);
		}

		return $css;
	}

	/**
	 * Inject the "Newsletters" header at the top of the decluttered menu.
	 *
	 * An <h3> heading with a chevron to its left that links back out of the mode.
	 * Injected client-side because wp-admin renders each menu item as `<li><a>`,
	 * which can't hold a separate heading + exit link; this runs in the footer,
	 * after #adminmenu is in the DOM.
	 *
	 * @return void
	 */
	public static function maybe_render_mode_header() {
		if ( ! self::is_mode_surface() ) {
			return;
		}

		$header_markup = sprintf(
			'<a href="%1$s" class="jetpack-newsletter-mode-exit" aria-label="%2$s"><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z"></path></svg></a><p>%3$s</p>',
			esc_url( admin_url() ),
			esc_attr__( 'Exit Newsletter Mode', 'jetpack-newsletter' ),
			/** "Newsletters" is a product surface name. */
			'Newsletters'
		);

		$write_markup = sprintf(
			'<a href="%1$s" class="jetpack-newsletter-mode-write-btn"><svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true" focusable="false"><g stroke="currentColor" stroke-linecap="square" stroke-linejoin="round" stroke-width="1.5"><path d="m10.0009 4.16602v11.66828"></path><path d="m15.835 10.002h-11.66837"></path></g></svg><span>%2$s</span></a>',
			esc_url( self::get_write_url() ),
			esc_html__( 'Write', 'jetpack-newsletter' )
		);

		// Inject the Write button first, then the header above it, so the final
		// order is: header, Write button, then the existing menu items.
		wp_print_inline_script_tag(
			sprintf(
				'( function () {' .
					'var menu = document.getElementById( "adminmenu" );' .
					'if ( ! menu ) { return; }' .
					'var write = document.createElement( "li" );' .
					'write.className = "jetpack-newsletter-mode-write";' .
					'write.innerHTML = %1$s;' .
					'menu.insertBefore( write, menu.firstChild );' .
					'var header = document.createElement( "li" );' .
					'header.className = "jetpack-newsletter-mode-header";' .
					'header.innerHTML = %2$s;' .
					'menu.insertBefore( header, menu.firstChild );' .
				'}() );',
				wp_json_encode( $write_markup, JSON_HEX_TAG | JSON_HEX_AMP ),
				wp_json_encode( $header_markup, JSON_HEX_TAG | JSON_HEX_AMP )
			)
		);
	}

	/**
	 * Carry NAV_QUERY_ARG through the Posts / Replies filter and search forms.
	 *
	 * Those forms are GET forms that submit only their own fields, so without
	 * this a search or filter would drop the marker and drop the visitor back out
	 * to the normal wp-admin menu mid-task. Paging and column sorting need no
	 * help: core rebuilds those links from the current URL.
	 *
	 * @return void
	 */
	public static function maybe_render_nav_marker_field() {
		if ( ! self::is_mode_surface() ) {
			return;
		}

		printf( '<input type="hidden" name="%s" value="1" />', esc_attr( self::NAV_QUERY_ARG ) );
	}

	/**
	 * Mark the Posts or Replies nav item as the current one.
	 *
	 * Their nav slugs carry NAV_QUERY_ARG, so they no longer equal the bare
	 * `edit.php` / `edit-comments.php` that those screens set as `$parent_file`,
	 * and core's slug match misses them. Pointing `$parent_file` at the slug the
	 * nav registered fixes that — and unlike on the mode's own pages, the value
	 * survives here: get_admin_page_parent() (which runs right after this filter)
	 * only overwrites `$parent_file` when it finds a matching submenu entry, and
	 * on these screens it finds none — the curated nav strips their submenus, and
	 * its one remaining branch that could match declines any `$parent_file`
	 * containing a `?`. Its closing fallback only fires on an empty value.
	 *
	 * @param string $parent_file Menu slug of the current item's parent.
	 * @return string
	 */
	public static function maybe_mark_core_screen_current( $parent_file ) {
		if ( ! self::is_mode_surface() ) {
			return $parent_file;
		}

		global $pagenow;

		$nav = self::get_nav_slugs();

		if ( 'edit.php' === $pagenow ) {
			return $nav['posts'];
		}

		if ( 'edit-comments.php' === $pagenow ) {
			return $nav['replies'];
		}

		return $parent_file;
	}

	/**
	 * Mark the Subscribers or Settings nav item as the current one.
	 *
	 * These two items are the exception to the bare-slug registration that makes
	 * Dashboard and Paid highlight natively (see get_nav_slugs). They address the
	 * same page — `page=jetpack-newsletter`, owned by Settings — and are told
	 * apart only by the SPA route, so at least one of them has to keep a
	 * link-style slug to carry its `p=` deep link, and a link-style slug can
	 * never match core's current-item lookup. Claiming the page's bare slug for
	 * the other would repoint its page hook away from the `load-{$page_suffix}`
	 * binding Settings uses to load the page's assets.
	 *
	 * Resolving it here also keeps the highlight correct when the in-page tabs
	 * switch between Subscribers and Settings, which a server-rendered menu
	 * cannot follow: the SPA changes the route without a reload.
	 *
	 * @return void
	 */
	public static function maybe_highlight_newsletter_nav_item() {
		if ( ! self::is_mode_surface() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		if ( sanitize_text_field( wp_unslash( $_GET['page'] ) ) !== Settings::ADMIN_PAGE_SLUG ) {
			return;
		}

		// Same selectors the icon CSS uses (see get_menu_icon_css): Subscribers is
		// the bare Newsletter page URL, Settings the one carrying the tab route.
		wp_print_inline_script_tag(
			'( function () {' .
				'var menu = document.getElementById( "adminmenu" );' .
				'if ( ! menu ) { return; }' .
				'var subscribers = menu.querySelector( \'a[href$="page=jetpack-newsletter"]\' );' .
				'var settings = menu.querySelector( \'a[href*="jetpack-newsletter"][href*="settings"]\' );' .
				'if ( ! subscribers || ! settings ) { return; }' .
				'function mark( link, isCurrent ) {' .
					'[ link.parentNode, link ].forEach( function ( el ) {' .
						'el.classList.toggle( "current", isCurrent );' .
						'el.classList.toggle( "wp-not-current-submenu", ! isCurrent );' .
					'} );' .
					'if ( isCurrent ) { link.setAttribute( "aria-current", "page" ); }' .
					'else { link.removeAttribute( "aria-current" ); }' .
				'}' .
				'function apply() {' .
					'var search = window.location.search;' .
					// The route is percent-encoded inside `p`; a malformed value
					// must not take the whole menu down.
					'try { search = decodeURIComponent( search ); } catch ( e ) {}' .
					'var onSettings = search.indexOf( "tab=settings" ) !== -1;' .
					'mark( settings, onSettings );' .
					'mark( subscribers, ! onSettings );' .
				'}' .
				'apply();' .
				// The SPA routes with history calls, which fire no event of their
				// own — wrap them so an in-page tab switch re-runs the match.
				'window.addEventListener( "popstate", apply );' .
				'[ "pushState", "replaceState" ].forEach( function ( name ) {' .
					'var original = window.history[ name ];' .
					'window.history[ name ] = function () {' .
						'var result = original.apply( this, arguments );' .
						'apply();' .
						'return result;' .
					'};' .
				'} );' .
			'}() );'
		);
	}

	/**
	 * Whether Newsletter Mode is available on this site at all.
	 *
	 * Spike-stage feature gate: defaults to false so the mode stays dark until it
	 * is explicitly turned on for a test cohort. Flip it locally with:
	 *   add_filter( 'jetpack_newsletter_mode_available', '__return_true' );
	 *
	 * @return bool
	 */
	public static function is_available() {
		/**
		 * Filter whether Newsletter Mode is available on this site.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $available Whether the mode may be enabled. Default false.
		 */
		return (bool) apply_filters( 'jetpack_newsletter_mode_available', false );
	}

	/**
	 * Whether Newsletter Mode is switched on for this site.
	 *
	 * True only when the feature is available AND the per-site option is on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		if ( ! self::is_available() ) {
			return false;
		}

		return (bool) get_option( self::OPTION_NAME, false );
	}

	/**
	 * Whether Newsletter Mode should take over the current request.
	 *
	 * True only when the mode is enabled AND the request targets the Newsletter
	 * admin page. Mirrors Settings::is_newsletter_admin_request() so the mode
	 * scopes itself to exactly the page the unified Newsletter dashboard owns.
	 *
	 * @return bool
	 */
	public static function is_active_for_request() {
		if ( ! self::is_enabled() ) {
			return false;
		}

		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === Settings::ADMIN_PAGE_SLUG; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Whether the current request is a Newsletter Mode surface — one of the
	 * wp-admin pages that make up the mode: the unified Newsletter page plus the
	 * mode-only Dashboard and Paid pages. Drives the decluttered nav, injected
	 * header, and mode styles (which apply on every surface — unlike the body
	 * class fix, which is specific to the wp-build Newsletter page and stays on
	 * is_active_for_request()).
	 *
	 * @return bool
	 */
	public static function is_mode_surface() {
		if ( ! self::is_enabled() || ! is_admin() ) {
			return false;
		}

		// Newsletter pages, identified by the ?page= param.
		if ( isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
			$page = sanitize_text_field( wp_unslash( $_GET['page'] ) );
			if ( in_array( $page, array( Settings::ADMIN_PAGE_SLUG, self::PAGE_DASHBOARD, self::PAGE_PAID ), true ) ) {
				return true;
			}
		}

		// Posts / Replies live on their own core scripts (no ?page= param). Those
		// screens belong to the whole of wp-admin, not to the mode, so they only
		// count while the visitor got there from the curated nav — reaching Posts
		// or Comments from the normal menu must not pull anyone into the mode.
		global $pagenow;

		return in_array( $pagenow, array( 'edit.php', 'edit-comments.php' ), true )
			&& isset( $_GET[ self::NAV_QUERY_ARG ] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
	}

	/**
	 * Register the package-owned REST route that reads/writes the mode option.
	 *
	 * GET  /jetpack-newsletter/v1/mode → { enabled: bool }
	 * POST /jetpack-newsletter/v1/mode { enabled: bool } → { enabled: bool }
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/mode',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'rest_get_mode' ),
					'permission_callback' => array( self::class, 'rest_permission_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'rest_update_mode' ),
					'permission_callback' => array( self::class, 'rest_permission_check' ),
					'args'                => array(
						'enabled' => array(
							'type'     => 'boolean',
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check for the mode route: site admins only.
	 *
	 * @return bool
	 */
	public static function rest_permission_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET handler: return whether the mode is currently enabled.
	 *
	 * @return \WP_REST_Response
	 */
	public static function rest_get_mode() {
		return rest_ensure_response( array( 'enabled' => self::is_enabled() ) );
	}

	/**
	 * POST handler: persist the mode option and return the resulting state.
	 *
	 * Writes the plain option directly (not the shared settings whitelist). The
	 * new value applies on the next page load, which is expected — see plan.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response
	 */
	public static function rest_update_mode( \WP_REST_Request $request ) {
		update_option( self::OPTION_NAME, (bool) $request->get_param( 'enabled' ) );

		return rest_ensure_response( array( 'enabled' => self::is_enabled() ) );
	}
}
