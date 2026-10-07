<?php
/**
 * Proxy for the WooCommerce analytics reports of WordPress.com.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Serves `/jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports/<report>`: a read of the same
 * path under the connected site on WordPress.com, signed with the blog token and cached briefly.
 *
 * For now it carries its own forward. The route has the shape of the proxy controller the
 * connection package is getting, so this class can shrink to a registration on it.
 *
 * @since $$next-version$$
 */
class Api_Proxy_Controller {

	/**
	 * REST namespace of the route.
	 */
	const REST_NAMESPACE = 'jetpack/v4/woocommerce-stats';

	/**
	 * Transient key prefix of the cached responses.
	 */
	const CACHE_PREFIX = 'jetpack_woocommerce_stats_proxy_';

	/**
	 * How long a successful response stays cached.
	 */
	private const CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Timeout of the request to WordPress.com, in seconds.
	 */
	private const API_TIMEOUT = 20;

	/**
	 * Response headers passed back to the caller.
	 */
	private const FORWARDED_HEADERS = array( 'x-wp-total', 'x-wp-totalpages' );

	/**
	 * Register the proxy route. Called on `rest_api_init`.
	 *
	 * @return void
	 */
	public static function init() {
		( new self() )->register_routes();
	}

	/**
	 * Register the cache prefix with the Stats package's transient cleanup, which runs from cron.
	 *
	 * @param mixed $prefixes Transient prefixes the cleanup sweeps.
	 * @return mixed
	 */
	public static function register_transient_cleanup_prefix( $prefixes ) {
		if ( is_array( $prefixes ) ) {
			$prefixes[] = self::CACHE_PREFIX;
		}

		return $prefixes;
	}

	/**
	 * Register the route. It only reads, and only below `analytics/reports/`.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/proxy/v2/(?P<endpoint>analytics/reports/.+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'endpoint' => array(
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( $this, 'validate_endpoint' ),
					),
				),
			)
		);
	}

	/**
	 * Whether the current user may read store reports, by the rule the WooCommerce section uses.
	 *
	 * @return bool
	 */
	public function check_permission() {
		// phpcs:ignore WordPress.WP.Capabilities.Unknown -- WooCommerce registers this capability.
		return current_user_can( 'manage_options' ) || current_user_can( 'view_woocommerce_reports' );
	}

	/**
	 * Whether the endpoint is a report path.
	 *
	 * Checked again here: a query-string `endpoint` shadows the route capture in `get_param()`.
	 *
	 * @param mixed $value Raw endpoint param.
	 * @return bool
	 */
	public function validate_endpoint( $value ) {
		$value = (string) $value;

		return ! str_contains( $value, '..' ) && (bool) preg_match( '#^analytics/reports/[\w.,/-]+$#', $value );
	}

	/**
	 * Answer a report from the cache, or from WordPress.com.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The response of WordPress.com with its status, or an error:
	 *                                   `no_connection` (403), the client's own with a 500, `api_error` (502).
	 */
	public function handle_request( WP_REST_Request $request ) {
		$path      = sprintf( '/sites/%d/%s', (int) Jetpack_Options::get_option( 'id' ), $request->get_param( 'endpoint' ) );
		$params    = $this->get_forwarded_params( $request );
		$cache_key = null === $request->get_param( 'force_refresh' ) ? $this->get_cache_key( $path, $params ) : null;

		$cached = null === $cache_key ? false : get_transient( $cache_key );
		if ( false !== $cached ) {
			return $this->build_response( $cached );
		}

		if ( ! ( new Manager() )->is_connected() ) {
			return new WP_Error(
				'no_connection',
				__( 'This site is not connected to WordPress.com.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 403 )
			);
		}

		$response = Client::wpcom_json_api_request_as_blog(
			$params ? $path . '?' . http_build_query( $params ) : $path,
			'2',
			array(
				'method'  => 'GET',
				'timeout' => self::API_TIMEOUT,
			),
			null,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			$response->add_data( array( 'status' => 500 ) );

			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), false );
		if ( 200 === $status && null === $data && JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'api_error',
				__( 'WordPress.com returned an unreadable response.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 502 )
			);
		}

		$payload = array(
			'data'    => $data,
			'status'  => $status,
			'headers' => $this->get_forwarded_headers( wp_remote_retrieve_headers( $response ) ),
		);
		if ( null !== $cache_key && 200 === $status ) {
			set_transient( $cache_key, $payload, self::CACHE_TTL );
		}

		return $this->build_response( $payload );
	}

	/**
	 * Build the REST response from a fetched or cached payload.
	 *
	 * @param array $payload `data`, `status` and `headers`.
	 * @return WP_REST_Response
	 */
	private function build_response( array $payload ) {
		$response = new WP_REST_Response( $payload['data'], (int) $payload['status'] );
		$response->set_headers( (array) $payload['headers'] );

		return $response;
	}

	/**
	 * The query params to forward: all but WordPress routing and the proxy's own.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array
	 */
	private function get_forwarded_params( WP_REST_Request $request ) {
		$params = $request->get_query_params();
		unset( $params['rest_route'], $params['_locale'], $params['endpoint'], $params['force_refresh'] );

		return $params;
	}

	/**
	 * The response headers worth keeping.
	 *
	 * @param mixed $headers Response headers as returned by the HTTP API.
	 * @return array<string, string>
	 */
	private function get_forwarded_headers( $headers ) {
		$forwarded = array();
		if ( ! is_array( $headers ) && ! $headers instanceof \ArrayAccess ) {
			return $forwarded;
		}

		foreach ( self::FORWARDED_HEADERS as $name ) {
			if ( isset( $headers[ $name ] ) ) {
				$forwarded[ $name ] = (string) $headers[ $name ];
			}
		}

		return $forwarded;
	}

	/**
	 * Transient key of a path and its params, whatever their order.
	 *
	 * @param string $path   WordPress.com path, without the query string.
	 * @param array  $params Forwarded query params.
	 * @return string
	 */
	private function get_cache_key( $path, array $params ) {
		ksort( $params );

		return self::CACHE_PREFIX . md5( $path . '|' . wp_json_encode( $params, JSON_UNESCAPED_SLASHES ) );
	}
}
