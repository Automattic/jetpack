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
