<?php
/**
 * REST routes for DNS host detection and local record lookups.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * `GET jetpack-send/v1/dns-host` and `GET jetpack-send/v1/dns-lookup`; both require `manage_options`.
 */
class Dns_REST_Controller {

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			REST_Controller::API_NAMESPACE,
			'/dns-host',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_dns_host' ),
				'permission_callback' => array( REST_Controller::class, 'can_manage' ),
				'args'                => array(
					'refresh' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);
		register_rest_route(
			REST_Controller::API_NAMESPACE,
			'/dns-lookup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_dns_lookup' ),
				'permission_callback' => array( REST_Controller::class, 'can_manage' ),
				'args'                => array(),
			)
		);
	}

	/**
	 * GET /dns-host: who runs the account domain's DNS (Dns_Host::get()).
	 *
	 * @param WP_REST_Request $request Request; `refresh` re-runs detection.
	 * @return \WP_REST_Response|WP_Error The DnsHost payload, or `jetpack_send_not_set_up` (400).
	 */
	public static function get_dns_host( WP_REST_Request $request ) {
		$host = Dns_Host::get( (bool) $request->get_param( 'refresh' ) );
		return is_wp_error( $host ) ? $host : rest_ensure_response( $host );
	}

	/**
	 * GET /dns-lookup: each required record's state, from local lookups only (Dns_Lookup::check()).
	 *
	 * @return \WP_REST_Response|WP_Error The DnsLookup payload, or `jetpack_send_not_set_up` (400).
	 */
	public static function get_dns_lookup() {
		$account = Account::get();
		if ( ! $account ) {
			return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send first.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}
		return rest_ensure_response( Dns_Lookup::check( $account ) );
	}
}
