<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- Feature entry file, named after the feature, also holds the WPCOM_Scan bootstrap class.
/**
 * An in-wp-admin Protect page for WordPress.com Simple and WoA sites.
 * Prompts for a plan upgrade or activation of Scan.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;

require_once __DIR__ . '/../wpcom-hosting-feature-page/class-wpcom-hosting-feature-page.php';

/**
 * Registers the Protect admin page and its wp-build assets.
 */
class WPCOM_Scan extends WPCOM_Hosting_Feature_Page {

	/**
	 * The slug the Jetpack plugin is expected to serve Protect from on WoA once Scan is live.
	 */
	const MENU_SLUG = 'jetpack-protect';

	/**
	 * The Jetpack plugin module that serves MENU_SLUG with the Protect package's dashboard.
	 */
	const DASHBOARD_MODULE = 'protect-dashboard';

	/**
	 * Set once the Protect dashboard has been on, so a site that turns it off later keeps it off.
	 */
	const DASHBOARD_MODULE_ACTIVATED_OPTION = 'wpcom_protect_dashboard_activated';

	/**
	 * As declared in routes/wpcom-scan/package.json.
	 */
	const WP_BUILD_PAGE = 'wpcom-scan';

	/**
	 * Product name, do not translate.
	 */
	const PAGE_TITLE = 'Jetpack Protect';

	/**
	 * Product name, do not translate.
	 */
	const MENU_TITLE = 'Protect';

	/**
	 * SCAN_SELF_SERVE, not SCAN: SCAN also covers Personal and Premium plans, which run scans
	 * without exposing Scan's UI. It is also what the dashboard's Scan page gates on.
	 */
	const FEATURE = 'SCAN_SELF_SERVE';

	/**
	 * The admin-post action, and nonce action, that turns the Protect dashboard back on.
	 */
	const ENABLE_ACTION = 'wpcom_enable_protect_dashboard';

	/**
	 * The `enable_failed` reason when the site is not connected to WordPress.com, which the module requires.
	 */
	const ENABLE_ERROR_CONNECTION = 'connection';

	/**
	 * The `enable_failed` reason for any other refusal.
	 */
	const ENABLE_ERROR_UNKNOWN = 'unknown';

	/**
	 * Also claim the slug on a WoA site whose plan includes Scan but whose Protect dashboard is off,
	 * so a link into it gets a way to turn it back on rather than core's access error.
	 *
	 * @return bool
	 */
	public static function should_register() {
		if ( ! self::is_atomic() || ! self::has_feature() ) {
			return parent::should_register();
		}

		return is_admin() && self::is_dashboard_module_off();
	}

	/**
	 * Whether the Jetpack plugin offers the Protect dashboard here, but it is turned off.
	 *
	 * @return bool
	 */
	public static function is_dashboard_module_off() {
		$modules = new Modules();

		// Unavailable beside the standalone Protect plugin, which serves the slug itself.
		return ! $modules->is_active( self::DASHBOARD_MODULE )
			&& in_array( self::DASHBOARD_MODULE, $modules->get_available(), true );
	}

	/**
	 * Offer to turn the Protect dashboard on wherever should_register() kept the page for that.
	 *
	 * @param int $blog_id Blog ID.
	 * @return string One of the STATE_* constants.
	 */
	public static function get_state( $blog_id ) {
		if ( self::is_atomic() && self::has_feature() && self::is_dashboard_module_off() ) {
			return self::STATE_ENABLE;
		}

		return parent::get_state( $blog_id );
	}

	/**
	 * The resolved prompt, plus the link that turns the Protect dashboard on.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$state = parent::get_initial_state();

		if ( self::STATE_ENABLE === $state['state'] ) {
			$state['enableUrl'] = add_query_arg(
				array(
					'action'   => self::ENABLE_ACTION,
					'_wpnonce' => wp_create_nonce( self::ENABLE_ACTION ),
				),
				admin_url( 'admin-post.php' )
			);
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only flag set by handle_enable()'s redirect.
			$error                = isset( $_GET['enable_failed'] ) ? sanitize_key( wp_unslash( $_GET['enable_failed'] ) ) : '';
			$state['enableError'] = in_array( $error, array( self::ENABLE_ERROR_CONNECTION, self::ENABLE_ERROR_UNKNOWN ), true ) ? $error : null;
		}

		return $state;
	}

	/**
	 * Turn the Protect dashboard on, then return to its page, which it now serves.
	 *
	 * @return never
	 */
	public static function handle_enable() {
		check_admin_referer( self::ENABLE_ACTION );

		if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
			wp_die( esc_html__( 'Sorry, you are not allowed to turn on Protect.', 'jetpack-mu-wpcom' ), '', 403 );
		}

		$url = self::get_page_url();

		if ( self::is_atomic() && self::has_feature() && self::is_dashboard_module_off() ) {
			$modules = new Modules();
			$modules->activate( self::DASHBOARD_MODULE, false, false );

			// Read back: activate() returns true even when its write to the saved list is filtered away.
			if ( ! $modules->is_active( self::DASHBOARD_MODULE ) ) {
				$error = ( new Connection_Manager() )->is_connected() ? self::ENABLE_ERROR_UNKNOWN : self::ENABLE_ERROR_CONNECTION;
				$url   = add_query_arg( 'enable_failed', $error, $url );
			}
		}

		wp_safe_redirect( $url );
		exit( 0 );
	}

	/**
	 * Calypso's Scan page, since nothing serves this slug on WoA once Scan is live.
	 *
	 * Drop this override to land back on `jetpack-protect` once the Jetpack plugin serves it.
	 *
	 * @param string|null $new_host The site's address after a transfer, when it changes.
	 * @return string
	 */
	public static function get_live_feature_url( $new_host = null ) {
		$host = $new_host ?? wp_parse_url( home_url(), PHP_URL_HOST );

		return 'https://wordpress.com/scan/' . rawurlencode( (string) $host );
	}

	/**
	 * Keep the Jetpack plugin's Protect dashboard off a WoA site whose plan lacks Scan, so this page's upgrade prompt keeps the slug.
	 *
	 * @param array $modules Available modules, keyed by slug.
	 * @return array
	 */
	public static function filter_available_modules( $modules ) {
		if ( ! self::has_feature() ) {
			unset( $modules[ self::DASHBOARD_MODULE ] );
		}

		return $modules;
	}

	/**
	 * Turn the Protect dashboard on once for a WoA site that can have it.
	 *
	 * WoA sites passed the module's First Introduced version while it was unavailable there, so Jetpack's upgrade never turned it on.
	 *
	 * @return void
	 */
	public static function maybe_activate_protect_dashboard_module() {
		if ( ! self::is_atomic() || ! is_admin() || get_option( self::DASHBOARD_MODULE_ACTIVATED_OPTION ) ) {
			return;
		}

		$modules = new Modules();
		// Unavailable without the Jetpack plugin, without self-serve Scan, or beside the standalone Protect plugin, so it is retried once offered.
		if ( ! in_array( self::DASHBOARD_MODULE, $modules->get_available(), true ) ) {
			return;
		}

		$was_active = $modules->is_active( self::DASHBOARD_MODULE );
		if ( ! $was_active ) {
			$modules->activate( self::DASHBOARD_MODULE, false, false );
		}

		// Checked again rather than trusting activate(), which also refuses while the connection is not ready.
		if ( ! $modules->is_active( self::DASHBOARD_MODULE ) ) {
			return;
		}

		update_option( self::DASHBOARD_MODULE_ACTIVATED_OPTION, true, false );

		// This page already claimed the slug at init 10, but the dashboard only loads on the next request.
		if ( ! $was_active && self::is_page_request() ) {
			wp_safe_redirect( self::get_page_url() );
			exit( 0 );
		}
	}

	/**
	 * Keep the Jetpack plugin's Protect page out of the sidebar while Calypso's Scan owns the nav.
	 *
	 * Matched on the item's module: the standalone Protect plugin shares the slug and keeps its entry.
	 *
	 * @param array $states     Map of Jetpack menu item key to visibility state.
	 * @param array $menu_items The registered Jetpack menu items.
	 * @return array
	 */
	public static function filter_admin_menu_visibility( $states, $menu_items ) {
		// With the standalone Protect plugin active, its users keep a Protect entry, whichever page serves it.
		if ( class_exists( 'Jetpack_Protect' ) ) {
			return $states;
		}

		foreach ( (array) $menu_items as $item ) {
			if ( self::MENU_SLUG === ( $item['menu_slug'] ?? null ) && self::DASHBOARD_MODULE === ( $item['args']['module'] ?? null ) ) {
				$states[ $item['args']['key'] ?? self::MENU_SLUG ] = 'hidden';
			}
		}

		return $states;
	}
}

add_action( 'init', array( WPCOM_Scan::class, 'init' ) );
add_action( 'admin_post_' . WPCOM_Scan::ENABLE_ACTION, array( WPCOM_Scan::class, 'handle_enable' ) );
add_filter( 'jetpack_admin_menu_visibility', array( WPCOM_Scan::class, 'filter_admin_menu_visibility' ), 10, 2 );
// After Jetpack::activate_new_modules() on init 10, and before admin_menu registers the page.
add_action( 'init', array( WPCOM_Scan::class, 'maybe_activate_protect_dashboard_module' ), 20 );
