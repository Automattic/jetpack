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
	 * Only a plan that includes Scan gets the Protect dashboard, which is unavailable beside the standalone Protect plugin.
	 *
	 * @return bool
	 */
	public static function offers_enable() {
		return self::has_feature() && parent::offers_enable();
	}

	/**
	 * Offer to turn the Protect dashboard on wherever should_register() kept the page for that.
	 *
	 * @param int $blog_id Blog ID.
	 * @return string One of the STATE_* constants.
	 */
	public static function get_state( $blog_id ) {
		if ( self::offers_enable() ) {
			return self::is_awaiting_connection() ? self::STATE_IN_PROGRESS : self::STATE_ENABLE;
		}

		return parent::get_state( $blog_id );
	}

	/**
	 * Whether a dashboard that has never been on is waiting for the connection, as just after a transfer.
	 *
	 * Nobody turned it off: maybe_activate_protect_dashboard_module() turns it on once the connection is ready.
	 *
	 * @return bool
	 */
	public static function is_awaiting_connection() {
		return ! get_option( self::DASHBOARD_MODULE_ACTIVATED_OPTION ) && ! ( new Connection_Manager() )->is_connected();
	}

	/**
	 * The resolved prompt, plus whether it waits for the connection.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$state = parent::get_initial_state();

		if ( self::STATE_IN_PROGRESS === $state['state'] && self::is_atomic() ) {
			$state['awaitingConnection'] = true;
		}

		return $state;
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
}

add_action( 'init', array( WPCOM_Scan::class, 'init' ) );
add_action( 'admin_post_' . WPCOM_Scan::ENABLE_ACTION, array( WPCOM_Scan::class, 'handle_enable' ) );
// After Jetpack::activate_new_modules() on init 10, and before admin_menu registers the page.
add_action( 'init', array( WPCOM_Scan::class, 'maybe_activate_protect_dashboard_module' ), 20 );
