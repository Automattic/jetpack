<?php
/**
 * REST controller for turning the Premium Analytics dashboard on and off for a site.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\PremiumAnalytics\Analytics;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_REST_NAMESPACE;

require_once __DIR__ . '/../rest-namespace.php';

/**
 * Exposes `wpcom/v2/premium-analytics/status` (GET + POST).
 *
 * This is the one route that has to exist while the dashboard is switched off, so it is registered
 * from callers that run before — and independently of — the enablement check. Everything else the
 * package serves is registered by {@see \Automattic\Jetpack\PremiumAnalytics\Dashboard_Support_Routes},
 * which only boots once the dashboard is already on.
 *
 * The route reads and writes the site's own opt-in option, and nothing else. It deliberately does
 * not try to report whether the dashboard is *effectively* on: a rollout sticker can force it on
 * without touching the option, and on WordPress.com Simple the host resolves that gate on
 * `plugins_loaded`, before public-api has switched to the target blog — so the boot-time answer
 * belongs to the wrong site by the time a REST callback runs. Reading the option inside the
 * callback is correct on every platform, because the blog switch has happened by then.
 *
 * Writing cannot take effect in the request that writes it: Jetpack resolves the flag once, on
 * `plugins_loaded`. Clients are expected to reload.
 *
 * @since $$next-version$$
 */
class Status_Controller {

	/**
	 * Hook the controller's routes onto rest_api_init.
	 *
	 * Safe to call more than once: the callback is static, so WordPress collapses repeat calls
	 * rather than registering the routes twice.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function register(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register the status route.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function register_routes(): void {
		register_rest_route(
			DASHBOARD_REST_NAMESPACE,
			'/premium-analytics/status',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_status' ),
					'permission_callback' => array( __CLASS__, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_status' ),
					'permission_callback' => array( __CLASS__, 'check_permission' ),
					'args'                => array(
						'enabled' => array(
							'required'    => true,
							'type'        => 'boolean',
							'description' => __( 'Whether the Premium Analytics dashboard is enabled for this site.', 'jetpack-premium-analytics-pkg' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Whether the caller may read or change the site's dashboard enablement.
	 *
	 * A blog token stands for WordPress.com acting on the site's behalf, which is how a rollout is
	 * driven from our side. A user token has to belong to someone who administers the site: this
	 * switches on a whole admin surface, so `view_stats` is not enough.
	 *
	 * @since $$next-version$$
	 *
	 * @return true|WP_Error True when allowed, WP_Error otherwise.
	 */
	public static function check_permission() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}

		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to change the analytics dashboard for this site.', 'jetpack-premium-analytics-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Report the site's stored opt-in.
	 *
	 * @since $$next-version$$
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_status() {
		return rest_ensure_response( array( 'enabled' => self::is_opted_in() ) );
	}

	/**
	 * Store the site's opt-in.
	 *
	 * Reports the option back rather than echoing the request, so a caller can tell what was
	 * actually stored. Note that a site carrying the rollout sticker keeps the dashboard whatever
	 * this says — the sticker is a separate signal that the option cannot override.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public static function update_status( WP_REST_Request $request ) {
		update_option( Analytics::ENABLED_OPTION, $request->get_param( 'enabled' ) ? 1 : 0 );

		return rest_ensure_response( array( 'enabled' => self::is_opted_in() ) );
	}

	/**
	 * Read the stored opt-in.
	 *
	 * @return bool
	 */
	private static function is_opted_in(): bool {
		return (bool) get_option( Analytics::ENABLED_OPTION );
	}
}
