<?php
/**
 * The number of threats shown next to the Protect menu item and in the admin bar.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Menu_Badges\Menu_Badges;
use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use Automattic\Jetpack\Protect_Status\Status;
use WP_Error;
use WP_REST_Response;

/**
 * Shows the stored threat count while rendering, and refreshes it from the browser.
 *
 * Rendering never waits on WordPress.com: an expired or missing count is fetched by a script after the page loads.
 */
class Threat_Count {

	/**
	 * Handle of the script that refreshes the count.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-protect-threat-count';

	/**
	 * Document event the script fires with the fresh count, for the admin bar notice.
	 *
	 * @var string
	 */
	const EVENT = 'jetpack-protect-threat-count';

	/**
	 * REST route, under `jetpack/v4`, that returns a fresh count.
	 *
	 * @var string
	 */
	const REST_ROUTE = '/protect-dashboard/threat-count';

	/**
	 * Transient set while the count is not refreshed after a failed status fetch.
	 *
	 * @var string
	 */
	const BACKOFF_TRANSIENT = 'jetpack_protect_dashboard_threat_count_backoff';

	/**
	 * Wire the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_route' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_refresh' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_refresh' ) );
	}

	/**
	 * The stored count, even if it has expired.
	 *
	 * @return int|null Null when no status has been stored yet.
	 */
	public static function get_cached() {
		try {
			$status = Status::get_cached_status();
		} catch ( \Throwable $e ) {
			// This runs on every admin page, so a malformed stored status must not take them all down.
			return null;
		}
		return null === $status ? null : count( Dashboard_Threats::without_resolved( $status->threats, $status->last_checked ?? null ) );
	}

	/**
	 * Show the stored count next to the "Protect" item, for users who can open the page.
	 *
	 * A missing count registers a hidden badge, which the refresh script reveals.
	 *
	 * @return void
	 */
	public static function register_menu_badge() {
		if ( ! Dashboard::can_manage() ) {
			return;
		}

		Menu_Badges::init();
		// The same ID as the Jetpack Protect plugin's entry, so the threats are not counted twice.
		Notification_Counts::register(
			Dashboard::MENU_SLUG,
			array(
				'menu_slug' => Dashboard::MENU_SLUG,
				'count'     => (int) self::get_cached(),
				'type'      => 'count',
			)
		);
	}

	/**
	 * Whether the stored count should be refreshed from the browser.
	 *
	 * @return bool
	 */
	public static function needs_refresh() {
		return ! get_transient( self::BACKOFF_TRANSIENT ) && Status::is_cached_status_expired();
	}

	/**
	 * Load the refresh script on pages showing the menu badge or the admin bar, when the count is stale.
	 *
	 * @return void
	 */
	public static function maybe_enqueue_refresh() {
		if ( ( ! is_admin() && ! is_admin_bar_showing() ) || ! Dashboard::can_manage() || ! self::needs_refresh() ) {
			return;
		}

		$dependencies = array( 'wp-api-fetch' );
		if ( is_admin() ) {
			// The menu badge script only loads in wp-admin; elsewhere only the admin bar is updated.
			Menu_Badges::enqueue_client();
			$dependencies[] = 'jetpack-menu-badges';
		}
		Assets::register_script(
			self::SCRIPT_HANDLE,
			'js/threat-count.js',
			__FILE__,
			array(
				'dependencies' => $dependencies,
				'in_footer'    => true,
				'enqueue'      => true,
			)
		);
		wp_localize_script(
			self::SCRIPT_HANDLE,
			'jetpackProtectThreatCountConfig',
			array(
				'path'     => 'jetpack/v4' . self::REST_ROUTE,
				'menuSlug' => Dashboard::MENU_SLUG,
				'event'    => self::EVENT,
			)
		);
	}

	/**
	 * Register the route the refresh script calls.
	 *
	 * @return void
	 */
	public static function register_rest_route() {
		register_rest_route(
			'jetpack/v4',
			self::REST_ROUTE,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_fresh_count' ),
				'permission_callback' => array( Dashboard::class, 'can_manage' ),
			)
		);
	}

	/**
	 * The count, fetching the status from WordPress.com when the stored one has expired.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_fresh_count() {
		try {
			$status = Status::get_status();
		} catch ( \Throwable $e ) {
			$status = (object) array( 'error' => true );
		}
		if ( ! empty( $status->error ) ) {
			// A failed fetch is not stored, so without this every page load would ask WordPress.com again.
			set_transient( self::BACKOFF_TRANSIENT, 1, 5 * MINUTE_IN_SECONDS );
			return new WP_Error(
				'jetpack_protect_threat_count_unavailable',
				__( 'The number of threats could not be fetched.', 'jetpack-protect-pkg' ),
				array( 'status' => 503 )
			);
		}

		return rest_ensure_response( array( 'count' => count( Dashboard_Threats::without_resolved( $status->threats, $status->last_checked ?? null ) ) ) );
	}
}
