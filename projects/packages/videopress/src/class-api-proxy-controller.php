<?php
/**
 * REST controller that proxies VideoPress data requests to WordPress.com.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Forwards an allowed read to the site's WordPress.com endpoint, signed as the
 * blog, and caches the successful response in a short-lived transient.
 *
 * One route serves every allowed endpoint, with the WordPress.com API version
 * in the path: `proxy/v<version>/<endpoint>`, as in `proxy/v1.1/stats/video-plays`.
 */
class Api_Proxy_Controller {

	/**
	 * Endpoints the proxy forwards: a regex fragment and the capability that reads it.
	 *
	 * The blog token never travels outside this table. `manage_options` reads
	 * every endpoint, whatever the capability listed.
	 *
	 * @var array<string, string>
	 */
	const ENDPOINTS = array(
		'stats/video-plays'  => 'view_stats',
		'stats/video/[0-9]+' => 'view_stats',
	);

	/**
	 * Transient key prefix.
	 *
	 * @var string
	 */
	const CACHE_PREFIX = 'jetpack_videopress_proxy_';

	/**
	 * How long a successful response stays cached, in seconds.
	 *
	 * @var int
	 */
	const CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Timeout for the outbound request, in seconds.
	 *
	 * @var int
	 */
	const API_TIMEOUT = 20;

	/**
	 * Hook the route registration on `rest_api_init`.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
	}

	/**
	 * Register the proxy route, anchored to the allowed endpoints.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/proxy/v(?P<version>[0-9]+(?:\.[0-9]+)?)/(?P<endpoint>' . implode( '|', array_keys( self::ENDPOINTS ) ) . ')',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'handle_request' ),
				'permission_callback' => array( __CLASS__, 'check_permission' ),
				'args'                => array(
					'endpoint' => array(
						'description'       => __( 'WordPress.com endpoint to forward to, relative to the site.', 'jetpack-videopress-pkg' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( __CLASS__, 'validate_endpoint' ),
					),
					'version'  => array(
						'description'       => __( 'WordPress.com API version to forward to.', 'jetpack-videopress-pkg' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( __CLASS__, 'validate_version' ),
					),
				),
			)
		);
	}

	/**
	 * Register the cache prefix with the Stats package's transient cleanup.
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
	 * Whether the endpoint is one the proxy forwards.
	 *
	 * Runs on the `get_param()` value, which a `?endpoint=` query can shadow,
	 * so the route regex alone does not hold the allowlist.
	 *
	 * @param mixed $value Raw endpoint param.
	 * @return bool
	 */
	public static function validate_endpoint( $value ) {
		return null !== self::get_endpoint_capability( (string) $value );
	}

	/**
	 * Whether the value is a WordPress.com API version, as in `1.1` or `2`.
	 *
	 * @param mixed $value Raw version param.
	 * @return bool
	 */
	public static function validate_version( $value ) {
		return (bool) preg_match( '#^[0-9]+(?:\.[0-9]+)?$#D', (string) $value );
	}

	/**
	 * Permission callback: the endpoint's capability, or `manage_options`.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return bool
	 */
	public static function check_permission( WP_REST_Request $request ) {
		$capability = self::get_endpoint_capability( (string) $request->get_param( 'endpoint' ) );
		if ( null === $capability ) {
			return false;
		}

		return current_user_can( 'manage_options' ) || current_user_can( $capability );
	}

	/**
	 * Serve the cached response when there is one, otherwise forward the request
	 * to WordPress.com and cache a successful response.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_request( WP_REST_Request $request ) {
		$version = (string) $request->get_param( 'version' );
		$params  = self::get_forwarded_params( $request );
		$path    = sprintf(
			'/sites/%d/%s',
			(int) Jetpack_Options::get_option( 'id' ),
			(string) $request->get_param( 'endpoint' )
		);

		$cache_key = null === $request->get_param( 'force_refresh' )
			? self::get_cache_key( $path, $version, $params )
			: null;

		if ( null !== $cache_key ) {
			$cached = get_transient( $cache_key );
			if ( is_array( $cached ) && array_key_exists( 'data', $cached ) ) {
				return new WP_REST_Response( $cached['data'], 200 );
			}
		}

		if ( ! ( new Connection_Manager() )->is_connected() ) {
			return new WP_Error(
				'no_connection',
				__( 'This site is not connected to WordPress.com.', 'jetpack-videopress-pkg' ),
				array( 'status' => 403 )
			);
		}

		$response = Client::wpcom_json_api_request_as_blog(
			empty( $params ) ? $path : $path . '?' . http_build_query( $params ),
			$version,
			array(
				'method'  => 'GET',
				'timeout' => self::API_TIMEOUT,
			),
			null,
			// WordPress.com serves v2 under `wpcom` and v1.x under `rest`.
			2 === (int) $version ? 'wpcom' : 'rest'
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Unable to fetch VideoPress stats.', 'jetpack-videopress-pkg' ),
				array( 'status' => 500 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		// Decoded as objects so an empty `{}` does not come back as `[]`.
		$data = json_decode( wp_remote_retrieve_body( $response ), false );

		if ( 200 === $status && null === $data && JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'api_error',
				__( 'Unable to fetch VideoPress stats.', 'jetpack-videopress-pkg' ),
				array( 'status' => 502 )
			);
		}

		if ( null !== $cache_key && 200 === $status ) {
			set_transient( $cache_key, array( 'data' => $data ), self::CACHE_TTL );
		}

		return new WP_REST_Response( $data, $status );
	}

	/**
	 * The capability that reads an endpoint, or null when the proxy does not forward it.
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 * @return string|null
	 */
	private static function get_endpoint_capability( $endpoint ) {
		foreach ( self::ENDPOINTS as $pattern => $capability ) {
			if ( preg_match( '#^' . $pattern . '$#D', $endpoint ) ) {
				return $capability;
			}
		}

		return null;
	}

	/**
	 * Query params to forward, without WordPress routing params nor the proxy's own.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return array
	 */
	private static function get_forwarded_params( WP_REST_Request $request ) {
		$params = $request->get_query_params();
		unset( $params['rest_route'], $params['_locale'], $params['endpoint'], $params['version'], $params['force_refresh'] );

		return $params;
	}

	/**
	 * Transient key for a path, an API version and the forwarded params, in any order.
	 *
	 * @param string $path    WordPress.com path, without the query string.
	 * @param string $version WordPress.com API version.
	 * @param array  $params  Forwarded query params.
	 * @return string
	 */
	private static function get_cache_key( $path, $version, array $params ) {
		ksort( $params );

		return self::CACHE_PREFIX . md5( implode( '|', array( $path, $version, (string) wp_json_encode( $params, JSON_UNESCAPED_SLASHES ) ) ) );
	}
}
