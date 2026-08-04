<?php
/**
 * REST API endpoint exposing a single subscriber's newsletter category subscriptions.
 *
 * @package automattic/jetpack
 * @since 16.1
 */

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions
 *
 * Proxies `GET /sites/{blog_id}/newsletter-categories/subscriptions/{id}` so the Newsletter
 * dashboard can show which categories a subscriber receives emails for. WP.com owns the
 * implementation, but flags it as a site-specific, WP.com-only endpoint — meaning it only exists
 * under `/wpcom/v2/sites/{blog_id}/…` on public-api and is unreachable from a Jetpack site's own
 * REST API without this proxy.
 */
class WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/newsletter-categories/subscriptions';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 *
	 * Unlike its sibling newsletter-categories endpoints, this route is not registered on WP.com
	 * Simple: WP.com already registers its own implementation at this exact path there, and a
	 * second registration would shadow it.
	 */
	public function register_routes() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<subscription_id>[0-9]+)',
			array(
				'show_in_index'       => true,
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_newsletter_categories_subscriptions' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'args'                => array(
					'subscription_id' => array(
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					),
					'type'            => array(
						'required'          => false,
						'validate_callback' => function ( $param ) {
							return 'wpcom' === $param;
						},
					),
				),
			)
		);
	}

	/**
	 * Proxy the request to WP.com, forwarding the id as a path segment.
	 *
	 * The id is a subscription id by default, or a WP.com user id when `type=wpcom` is passed —
	 * WP.com resolves the latter to the matching subscription. Query params (including `type`) are
	 * forwarded by the proxy trait.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return mixed|WP_Error Response from WP.com, or an error.
	 */
	public function get_newsletter_categories_subscriptions( $request ) {
		return $this->proxy_request_to_wpcom_as_user( $request, (string) (int) $request->get_param( 'subscription_id' ) );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions' );
