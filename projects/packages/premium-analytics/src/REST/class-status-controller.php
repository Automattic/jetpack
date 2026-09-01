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
 * Writing the option cannot take effect in the request that writes it: Jetpack resolves the flag
 * once, on `plugins_loaded`, long before a REST callback runs. Clients are expected to reload.
 */
class Status_Controller {

	/**
	 * Hook the controller's routes onto rest_api_init.
	 *
	 * @return void
	 */
	public static function register(): void {
		$controller = new self();
		add_action( 'rest_api_init', array( $controller, 'register_routes' ) );
	}

	/**
	 * Register the status route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			DASHBOARD_REST_NAMESPACE,
			'/premium-analytics/status',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_status' ),
					'permission_callback' => array( $this, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_status' ),
					'permission_callback' => array( $this, 'check_permission' ),
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
	 * switches a whole admin surface on, so `view_stats` is not enough.
	 *
	 * @return true|WP_Error True when allowed, WP_Error otherwise.
	 */
	public function check_permission() {
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
	 * Report whether the dashboard is enabled for this site.
	 *
	 * Reports what the host actually decided rather than re-reading the option, so a site switched
	 * on by the rollout sticker reports as enabled too.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_status() {
		return rest_ensure_response( array( 'enabled' => Analytics::is_enabled() ) );
	}

	/**
	 * Turn the dashboard on or off for this site.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function update_status( WP_REST_Request $request ) {
		$enabled = (bool) $request->get_param( 'enabled' );

		update_option( Analytics::ENABLED_OPTION, $enabled ? 1 : 0 );

		return rest_ensure_response( array( 'enabled' => $enabled ) );
	}
}
