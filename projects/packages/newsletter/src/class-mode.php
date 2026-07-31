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
	 * Query arg marking a shared wp-admin screen as reached from the mode's nav.
	 *
	 * Posts and Comments are core screens the whole of wp-admin links to, so —
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
	}

	/**
	 * Whether the current request targets one of the mode's own wp-build
	 * AdminPage page (the Dashboard). Its menu slug doubles as its
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

		return self::PAGE_DASHBOARD === $page;
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
	 * mode-only Dashboard page. Drives the decluttered nav, injected
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
			if ( in_array( $page, array( Settings::ADMIN_PAGE_SLUG, self::PAGE_DASHBOARD ), true ) ) {
				return true;
			}
		}

		// Posts / Comments live on their own core scripts (no ?page= param). Those
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
