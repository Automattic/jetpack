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
	const PAGE_DASHBOARD = 'jetpack-newsletter-dashboard';

	/**
	 * Slug of the mode-only Paid page (last item in the focused nav).
	 *
	 * @var string
	 */
	const PAGE_PAID = 'jetpack-newsletter-paid';

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

		// Let the mu-wpcom Write editor's back button return to the Newsletter
		// page (the "Write & send" link passes source=newsletter).
		add_filter( 'wpcom_write_back_destinations', array( self::class, 'add_write_back_destination' ) );
	}

	/**
	 * Register the Newsletter page as a Write editor "back" destination, so the
	 * editor's back button returns to the mode instead of the dashboard.
	 * Consumed by wpcom_write_resolve_back_url() for source=newsletter.
	 *
	 * @param array $destinations Map of source token to destination URL.
	 * @return array
	 */
	public static function add_write_back_destination( $destinations ) {
		$destinations['newsletter'] = admin_url( 'admin.php?page=' . Settings::ADMIN_PAGE_SLUG );

		return $destinations;
	}

	/**
	 * When the mode is enabled, add a top-level "Newsletters" menu link and hide
	 * the default "Jetpack → Newsletter" submenu so there is no duplicate entry.
	 *
	 * The top-level item uses the Newsletter page URL as its menu slug, so it
	 * deep-links to the page Settings already registers — no new page or render
	 * callback is created here. Core add_menu_page() is used deliberately: the
	 * admin-ui Admin_Menu wrapper only creates submenus under `jetpack`, never a
	 * new top-level root.
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
			'admin.php?page=' . Settings::ADMIN_PAGE_SLUG,
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

		global $menu;

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

		$newsletter_url = 'admin.php?page=' . Settings::ADMIN_PAGE_SLUG;

		// The exit affordance is the chevron in the injected "Newsletters" header
		// (see maybe_render_mode_header), not a menu item.
		add_menu_page(
			__( 'Dashboard', 'jetpack-newsletter' ),
			__( 'Dashboard', 'jetpack-newsletter' ),
			'manage_options',
			'admin.php?page=' . self::PAGE_DASHBOARD,
			'',
			'dashicons-dashboard',
			3
		);
		add_menu_page(
			__( 'Subscribers', 'jetpack-newsletter' ),
			__( 'Subscribers', 'jetpack-newsletter' ),
			'manage_options',
			$newsletter_url,
			'',
			'dashicons-groups',
			4
		);
		add_menu_page(
			__( 'Settings', 'jetpack-newsletter' ),
			__( 'Settings', 'jetpack-newsletter' ),
			'manage_options',
			// The SPA router encodes its path+search into a single `p` param, so
			// encode the value rather than letting the nested `?`/`&` be parsed as
			// separate query args.
			$newsletter_url . '&p=' . rawurlencode( '/?tab=settings' ),
			'',
			'dashicons-admin-settings',
			5
		);
		// "Write" is a prominent button injected at the top of the menu (see
		// maybe_render_mode_header), not a list item.
		add_menu_page(
			__( 'Paid', 'jetpack-newsletter' ),
			__( 'Paid', 'jetpack-newsletter' ),
			'manage_options',
			'admin.php?page=' . self::PAGE_PAID,
			'',
			'dashicons-money-alt',
			6
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
		self::render_stub( __( 'Dashboard', 'jetpack-newsletter' ) );
	}

	/**
	 * Render the mode-only Paid stub page.
	 *
	 * @return void
	 */
	public static function render_paid_page() {
		self::render_stub( __( 'Paid', 'jetpack-newsletter' ) );
	}

	/**
	 * Render a placeholder screen for a mode-only page. Intentionally empty for
	 * now — real UIs (e.g. a custom payments screen) get built on top later.
	 *
	 * @param string $heading The page heading.
	 * @return void
	 */
	private static function render_stub( $heading ) {
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
	 * Restore the Newsletter page's expected <body> class while the mode is
	 * active, so its layout CSS (keyed on `body.jetpack_page_jetpack-newsletter`)
	 * still applies even though the page is registered as a hidden page.
	 *
	 * @param string $classes Space-separated admin body classes.
	 * @return string
	 */
	public static function maybe_add_body_class( $classes ) {
		if ( self::is_active_for_request() ) {
			$classes .= ' jetpack_page_jetpack-newsletter';
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
			#adminmenu .jetpack-newsletter-mode-header h3 {
				margin: 0;
				padding: 0;
				/* Menu text color: wpcom sidebar-text var, light fallback for core schemes. */
				color: var( --color-sidebar-text, #fff );
				font-size: 15px;
				font-weight: 600;
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
			body.folded #adminmenu .jetpack-newsletter-mode-header h3 {
				display: none;
			}
			@media only screen and ( min-width: 783px ) and ( max-width: 960px ) {
				.auto-fold #adminmenu .jetpack-newsletter-mode-header {
					justify-content: center;
					padding-left: 0;
					padding-right: 0;
				}
				.auto-fold #adminmenu .jetpack-newsletter-mode-header h3 {
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
				font-size: 15px;
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
				display: none;
				width: 20px;
				height: 20px;
				fill: currentColor;
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
			'<a href="%1$s" class="jetpack-newsletter-mode-exit" aria-label="%2$s"><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z"></path></svg></a><h3>%3$s</h3>',
			esc_url( admin_url() ),
			esc_attr__( 'Exit Newsletter Mode', 'jetpack-newsletter' ),
			/** "Newsletters" is a product surface name. */
			'Newsletters'
		);

		$write_markup = sprintf(
			'<a href="%1$s" class="jetpack-newsletter-mode-write-btn"><svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M20.1 5.1L16.9 2 6.2 12.7l-1.3 4.4 4.5-1.3L20.1 5.1zM4 20.8h8v-1.5H4v1.5z"></path></svg><span>%2$s</span></a>',
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
		if ( ! self::is_enabled() || ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		$page = sanitize_text_field( wp_unslash( $_GET['page'] ) );

		return in_array(
			$page,
			array( Settings::ADMIN_PAGE_SLUG, self::PAGE_DASHBOARD, self::PAGE_PAID ),
			true
		);
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
