<?php
/**
 * REST controller that proxies dashboard data-layer requests to the WPCOM analytics API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Forwards an authenticated dashboard request to the WPCOM analytics endpoint for the
 * connected site's blog ID, caches the successful response in a short-lived transient,
 * and returns it. Lets the extracted frontend's data layer talk to WPCOM without each
 * call leaving the WordPress origin.
 */
class Api_Proxy_Controller extends WP_REST_Controller {

	/**
	 * Package slug. Also the cache-key prefix (see SLUG-derived CACHE_PREFIX) — the only
	 * piece the source pulled from its dropped Utilities trait.
	 */
	private const SLUG = 'jetpack-premium-analytics';

	/**
	 * Transient key prefix, derived from the package slug.
	 *
	 * @var string
	 */
	private const CACHE_PREFIX = self::SLUG . '_proxy_';

	/**
	 * How long a successful response stays cached.
	 *
	 * @var int
	 */
	private const CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Timeout for the outbound WPCOM request, in seconds.
	 *
	 * @var int
	 */
	private const API_TIMEOUT = 20;

	/**
	 * Response headers worth forwarding back to the dashboard.
	 *
	 * @var string[]
	 */
	private const FORWARDED_HEADERS = array( 'x-wp-total', 'x-wp-totalpages' );

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = self::SLUG . '/v1';
		$this->rest_base = 'proxy';
	}

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
	 * Register the proxy route. The trailing capture group is the target analytics path.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<endpoint>.*)',
			array(
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- `register_rest_route()` requires mixed key/no-key for `$args`, and then https://github.com/phan/phan/issues/4852 puts the error on the wrong line.
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'handle_proxy_request' ),
					'permission_callback' => array( $this, 'check_permission' ),
					'args'                => array(
						'endpoint' => array(
							'description'       => __( 'The analytics sub-path to proxy.', 'jetpack-premium-analytics' ),
							'type'              => 'string',
							'required'          => true,
							'validate_callback' => array( $this, 'validate_endpoint' ),
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Only site administrators may reach the analytics data.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Confine the endpoint to a relative analytics sub-path so it cannot escape the
	 * `/sites/<id>/analytics/` prefix via traversal (`..`), an absolute path, or a scheme.
	 *
	 * @param mixed $value Raw endpoint param.
	 *
	 * @return bool
	 */
	public function validate_endpoint( $value ): bool {
		$value = (string) $value;

		if ( str_starts_with( $value, '/' ) || str_contains( $value, '..' ) || str_contains( $value, ':' ) ) {
			return false;
		}

		return (bool) preg_match( '#^[A-Za-z0-9._/-]+$#', $value );
	}

	/**
	 * Serve a cached payload when available, otherwise fetch from WPCOM and cache it.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_proxy_request( WP_REST_Request $request ) {
		$cache_key = $this->get_cache_key( $request );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $this->build_response( $cached );
		}

		if ( ! ( new Manager( self::SLUG ) )->is_connected() ) {
			return new WP_Error(
				'no_connection',
				__( 'Please connect Jetpack to load analytics data.', 'jetpack-premium-analytics' ),
				array( 'status' => 403 )
			);
		}

		try {
			$response = Client::wpcom_json_api_request_as_blog(
				$this->build_endpoint_url( $request ),
				'2',
				array(
					'method'  => 'GET',
					'timeout' => self::API_TIMEOUT,
				),
				null,
				'wpcom'
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				'api_error',
				__( 'Error processing the analytics request.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error communicating with the analytics service.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		return $this->cache_and_build_response( $response, $cache_key );
	}

	/**
	 * Build the WPCOM analytics path for the connected blog from the request.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return string
	 */
	protected function build_endpoint_url( WP_REST_Request $request ): string {
		$site_id      = (int) Jetpack_Options::get_option( 'id' );
		$endpoint_url = sprintf( '/sites/%d/analytics/%s', $site_id, (string) $request->get_param( 'endpoint' ) );

		$params = $this->get_forwarded_params( $request );
		if ( ! empty( $params ) ) {
			$endpoint_url .= '?' . http_build_query( $params );
		}

		return $endpoint_url;
	}

	/**
	 * Schema for the proxy endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema(): array {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'proxy',
			'type'       => 'object',
			'properties' => array(
				'endpoint' => array(
					'description' => __( 'The remote analytics endpoint to proxy.', 'jetpack-premium-analytics' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Cache a successful (200) response and return it to the caller.
	 *
	 * @param array  $http_response Raw response from the Jetpack client.
	 * @param string $cache_key     Transient key for this request signature.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function cache_and_build_response( array $http_response, string $cache_key ) {
		$status = (int) wp_remote_retrieve_response_code( $http_response );
		$data   = json_decode( wp_remote_retrieve_body( $http_response ), false );

		// A 200 with an undecodable body means the upstream is degraded; don't cache garbage.
		if ( 200 === $status && null === $data && JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'api_error',
				__( 'The analytics service returned an unreadable response.', 'jetpack-premium-analytics' ),
				array( 'status' => 502 )
			);
		}

		$payload = array(
			'data'    => $data,
			'status'  => $status,
			'headers' => $this->extract_forwarded_headers( wp_remote_retrieve_headers( $http_response ) ),
		);

		if ( 200 === $status ) {
			set_transient( $cache_key, $payload, self::CACHE_TTL );
		}

		return $this->build_response( $payload );
	}

	/**
	 * Rebuild a WP_REST_Response from a cached or freshly fetched payload.
	 *
	 * @param array $payload Stored payload with data, status, and headers.
	 *
	 * @return WP_REST_Response
	 */
	private function build_response( array $payload ): WP_REST_Response {
		$response = new WP_REST_Response( $payload['data'], (int) $payload['status'] );

		foreach ( (array) $payload['headers'] as $name => $value ) {
			$response->header( $name, $value );
		}

		return $response;
	}

	/**
	 * Keep only the response headers the dashboard needs (pagination totals).
	 *
	 * @param mixed $headers Response headers as returned by the HTTP API.
	 *
	 * @return array<string, string>
	 */
	private function extract_forwarded_headers( $headers ): array {
		if ( $headers instanceof \ArrayAccess || is_array( $headers ) ) {
			$forwarded = array();
			foreach ( self::FORWARDED_HEADERS as $name ) {
				if ( isset( $headers[ $name ] ) ) {
					$forwarded[ $name ] = (string) $headers[ $name ];
				}
			}
			return $forwarded;
		}

		return array();
	}

	/**
	 * Query params to forward to WPCOM, minus the WordPress routing param.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	private function get_forwarded_params( WP_REST_Request $request ): array {
		$params = $request->get_query_params();
		// Drop the params WordPress adds for its own routing — they're meaningless to WPCOM.
		unset( $params['rest_route'], $params['_locale'] );

		return is_array( $params ) ? $params : array();
	}

	/**
	 * Build the transient key from the request signature (endpoint + forwarded params).
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return string
	 */
	private function get_cache_key( WP_REST_Request $request ): string {
		$params = $this->get_forwarded_params( $request );
		ksort( $params );
		$signature = (string) $request->get_param( 'endpoint' ) . '|' . (string) wp_json_encode( $params, JSON_UNESCAPED_SLASHES );

		return self::CACHE_PREFIX . md5( $signature );
	}
}
