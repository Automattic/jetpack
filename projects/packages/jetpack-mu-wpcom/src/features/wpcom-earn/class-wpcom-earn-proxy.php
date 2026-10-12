<?php
/**
 * Forwards the Monetize page's WordPress.com API calls on Atomic, where the
 * site's own REST API does not serve them.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Visitor;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * A passthrough to an allowlist of WordPress.com endpoints, signed as the current user.
 *
 * Simple sites already reach these endpoints directly, so this registers on Atomic only.
 */
class WPCOM_Earn_Proxy {

	/**
	 * REST namespace.
	 */
	const REST_NAMESPACE = 'wpcom/v2';

	/**
	 * Route base; the upstream API and path follow it.
	 */
	const REST_BASE = 'earn-proxy';

	/**
	 * Upstream endpoints the page may reach: per API, the methods and path pattern allowed.
	 *
	 * Paths are relative to the site, `/sites/<id>/`, except under `me/`, which is per user.
	 */
	const ALLOWLIST = array(
		'wpcom/v2'  => array(
			array( 'GET', 'memberships/status' ),
			array( 'GET|POST', 'memberships/products' ),
			array( 'POST', 'memberships/product' ),
			array( 'POST|DELETE', 'memberships/product/\d+' ),
			array( 'GET|POST', 'memberships/coupons' ),
			array( 'PUT|DELETE', 'memberships/coupon/\d+' ),
			array( 'GET', 'memberships/earnings' ),
			array( 'GET', 'memberships/subscribers' ),
			array( 'GET', 'wordads/payments' ),
		),
		'rest/v1.1' => array(
			array( 'POST', 'memberships/subscriptions/\d+/cancel' ),
			array( 'GET', 'connected_account/stripe/disconnect' ),
			array( 'GET', 'wordads/account' ),
			array( 'POST', 'wordads/approve' ),
			array( 'GET|POST', 'wordads/settings' ),
			array( 'GET', 'wordads/earnings' ),
			array( 'GET', 'me/peer-referral-link' ),
			array( 'POST', 'me/peer-referral-link-enable' ),
		),
	);

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/(?P<api>wpcom/v2|rest/v1\.1)/(?P<path>[a-z0-9_\-/]+)',
			array(
				'methods'             => array( WP_REST_Server::READABLE, WP_REST_Server::CREATABLE, 'PUT', WP_REST_Server::DELETABLE ),
				'callback'            => array( static::class, 'proxy' ),
				'permission_callback' => array( static::class, 'permission_check' ),
			)
		);
	}

	/**
	 * Whether the allowlist lets this method reach this upstream path.
	 *
	 * @param string $method HTTP method.
	 * @param string $api    Upstream API, a key of ALLOWLIST.
	 * @param string $path   Upstream path, relative to the site or to `me/`.
	 * @return bool
	 */
	public static function is_allowed( $method, $api, $path ) {
		foreach ( self::ALLOWLIST[ $api ] ?? array() as list( $methods, $pattern ) ) {
			if ( in_array( $method, explode( '|', $methods ), true ) && preg_match( '#^' . $pattern . '$#', $path ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Admins only, and only to allowlisted endpoints.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return true|WP_Error
	 */
	public static function permission_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to do that.', 'jetpack-mu-wpcom' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( ! static::is_allowed( $request->get_method(), (string) $request['api'], (string) $request['path'] ) ) {
			return new WP_Error(
				'rest_forbidden_endpoint',
				__( 'This endpoint cannot be proxied.', 'jetpack-mu-wpcom' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Forward the request to WordPress.com as the current user and relay the answer.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return mixed|WP_Error The upstream body, or an error carrying the upstream status.
	 */
	public static function proxy( $request ) {
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error(
				'rest_unauthorized',
				__( 'Please connect your user account to WordPress.com', 'jetpack-mu-wpcom' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$path     = (string) $request['path'];
		$upstream = str_starts_with( $path, 'me/' ) ? '/' . $path : '/sites/' . (int) \Jetpack_Options::get_option( 'id' ) . '/' . $path;

		// Added under plain permalinks; WordPress.com has no use for it.
		$query = $request->get_query_params();
		unset( $query['rest_route'] );

		list( $base_api_path, $version ) = 'wpcom/v2' === $request['api'] ? array( 'wpcom', '2' ) : array( 'rest', '1.1' );

		$response = Client::wpcom_json_api_request_as_user(
			add_query_arg( $query, $upstream ),
			$version,
			array(
				'method'  => $request->get_method(),
				'headers' => array(
					'Content-Type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			),
			$request->get_body() ? $request->get_body() : null,
			$base_api_path
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			$error = is_array( $body ) ? $body : array();

			// v2 errors carry `code`; v1.1 errors carry it as `error`.
			return new WP_Error(
				$error['code'] ?? $error['error'] ?? 'unknown_error',
				$error['message'] ?? __( 'An unknown error occurred.', 'jetpack-mu-wpcom' ),
				array( 'status' => $status )
			);
		}

		return $body;
	}
}
