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
 * Forwards an authenticated dashboard request to the WPCOM endpoint for the connected
 * site's blog ID, caches the successful response in a short-lived transient, and returns
 * it. Lets the extracted frontend's data layer talk to WPCOM without each call leaving the
 * WordPress origin.
 *
 * Two route families share one forwarding core:
 *  - the analytics catch-all (`proxy/<endpoint>` → `/sites/<id>/analytics/<endpoint>`); and
 *  - the Stats routes (declared in {@see get_stats_routes()}), which re-expose the
 *    `stats-admin` package's WPCOM pass-through endpoints under this namespace, minus the
 *    blog ID in the URL.
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
	 * Register the analytics catch-all and the Stats pass-through routes.
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

		foreach ( $this->get_stats_routes() as $route ) {
			$config = array(
				'methods'             => $route['methods'],
				'callback'            => function ( WP_REST_Request $request ) use ( $route ) {
					return $this->handle_stats_request( $request, $route );
				},
				'permission_callback' => $this->permission_callback_for( $route['permission'] ?? 'stats' ),
			);
			if ( isset( $route['args'] ) ) {
				$config['args'] = $route['args'];
			}

			register_rest_route( $this->namespace, '/' . $route['route'], $config );
		}
	}

	/**
	 * The Stats endpoints to re-expose, mirroring `stats-admin` minus the `/sites/<id>` URL
	 * segment. Each entry is a thin description the shared forwarder turns into a WPCOM call:
	 *
	 *  - `route`      Relative route regex; `%s` captures (named `subpath`) act as whitelists.
	 *  - `wpcom`      Path relative to `/sites/<id>/`; a `%s` is filled from the `subpath` param.
	 *  - `build`      Optional callable( int $site_id ): string for paths not under `/sites/<id>/`.
	 *  - `methods`    Allowed HTTP verbs (defaults handled per entry).
	 *  - `version`    WPCOM API version. Defaults to '2'.
	 *  - `base`       WPCOM API base ('rest' | 'wpcom'). Defaults to 'wpcom'.
	 *  - `permission` 'stats' (default) or 'wordads'.
	 *  - `cache`      Whether GET responses may be cached. Defaults to true.
	 *
	 * The single `stats/(?P<subpath>.+)` route absorbs every `/sites/<id>/stats/*` endpoint
	 * (per-resource stats, single post/video, email stats, UTM, devices, location views, and
	 * referrer-spam list/new/delete) the same way the analytics catch-all works.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function get_stats_routes(): array {
		$read  = WP_REST_Server::READABLE;
		$write = WP_REST_Server::EDITABLE;

		return array(
			array(
				'route'   => 'stats',
				'wpcom'   => 'stats',
				'methods' => $read,
				'version' => '1.1',
				'base'    => 'rest',
			),
			array(
				'route'   => 'stats/(?P<subpath>.+)',
				'wpcom'   => 'stats/%s',
				'methods' => $read . ',' . $write,
				'version' => '1.1',
				'base'    => 'rest',
				'args'    => array(
					'subpath' => array(
						'validate_callback' => array( $this, 'validate_subpath' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			),
			array(
				'route'   => 'subscribers/counts',
				'wpcom'   => 'subscribers/counts',
				'methods' => $read,
			),
			array(
				'route'   => 'site-has-never-published-post',
				'wpcom'   => 'site-has-never-published-post',
				'methods' => $read,
			),
			array(
				'route'   => 'jetpack-stats/usage',
				'wpcom'   => 'jetpack-stats/usage',
				'methods' => $read,
				'cache'   => false,
			),
			array(
				'route'         => 'jetpack-stats-dashboard/modules',
				'wpcom'         => 'jetpack-stats-dashboard/modules',
				'methods'       => $read . ',' . $write,
				'bust_on_write' => true,
			),
			array(
				'route'         => 'jetpack-stats-dashboard/module-settings',
				'wpcom'         => 'jetpack-stats-dashboard/module-settings',
				'methods'       => $read . ',' . $write,
				'bust_on_write' => true,
			),
			array(
				'route'   => 'commercial-classification',
				'wpcom'   => 'commercial-classification',
				'methods' => $write,
			),
			array(
				'route'      => 'wordads/(?P<subpath>earnings|stats)',
				'wpcom'      => 'wordads/%s',
				'methods'    => $read,
				'version'    => '1.1',
				'base'       => 'rest',
				'permission' => 'wordads',
			),
			array(
				'route'   => 'purchases',
				'methods' => $read,
				'version' => '1.2',
				'base'    => 'rest',
				'cache'   => false,
				'build'   => static function ( int $site_id ): string {
					return sprintf( '/upgrades?site=%d', $site_id );
				},
			),
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
	 * Administrators, or users who can view stats, may reach the Stats data.
	 *
	 * @return bool
	 */
	public function check_stats_permission(): bool {
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}

	/**
	 * Administrators, or users who can manage WordAds, may reach the WordAds data.
	 *
	 * @return bool
	 */
	public function check_wordads_permission(): bool {
		// phpcs:ignore WordPress.WP.Capabilities.Unknown
		return current_user_can( 'manage_options' ) || current_user_can( 'activate_wordads' );
	}

	/**
	 * Map a route's permission key to its callback.
	 *
	 * @param string $permission Permission key ('stats' | 'wordads').
	 *
	 * @return callable
	 */
	private function permission_callback_for( string $permission ): callable {
		if ( 'wordads' === $permission ) {
			return array( $this, 'check_wordads_permission' );
		}

		return array( $this, 'check_stats_permission' );
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
	 * Confine a Stats sub-path to a relative segment so it cannot escape `/sites/<id>/stats/`
	 * via traversal (`..`) or an absolute path. Broader than {@see validate_endpoint()}, since
	 * Stats sub-paths legitimately contain commas (e.g. the UTM params list).
	 *
	 * @param mixed $value Raw subpath param.
	 *
	 * @return bool
	 */
	public function validate_subpath( $value ): bool {
		$value = (string) $value;

		if ( '' === $value || str_starts_with( $value, '/' ) || str_contains( $value, '..' ) ) {
			return false;
		}

		return (bool) preg_match( '#^[\w.,/-]+$#', $value );
	}

	/**
	 * Proxy the analytics catch-all to `/sites/<id>/analytics/<endpoint>`.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_proxy_request( WP_REST_Request $request ) {
		$path = sprintf(
			'/sites/%d/analytics/%s',
			(int) Jetpack_Options::get_option( 'id' ),
			(string) $request->get_param( 'endpoint' )
		);

		return $this->forward( $request, $path, array() );
	}

	/**
	 * Proxy a declared Stats route to its WPCOM endpoint.
	 *
	 * @param WP_REST_Request      $request Request object.
	 * @param array<string, mixed> $route   The matched route description.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function handle_stats_request( WP_REST_Request $request, array $route ) {
		return $this->forward(
			$request,
			$this->build_stats_path( $request, $route ),
			array(
				'version'       => $route['version'] ?? '2',
				'base'          => $route['base'] ?? 'wpcom',
				'cache'         => $route['cache'] ?? true,
				'bust_on_write' => $route['bust_on_write'] ?? false,
			)
		);
	}

	/**
	 * Resolve a Stats route to its WPCOM path (without the forwarded query string).
	 *
	 * @param WP_REST_Request      $request Request object.
	 * @param array<string, mixed> $route   The matched route description.
	 *
	 * @return string
	 */
	private function build_stats_path( WP_REST_Request $request, array $route ): string {
		$site_id = (int) Jetpack_Options::get_option( 'id' );

		if ( isset( $route['build'] ) ) {
			return ( $route['build'] )( $site_id );
		}

		$relative = $route['wpcom'] ?? '';
		if ( str_contains( $relative, '%s' ) ) {
			$relative = sprintf( $relative, (string) $request->get_param( 'subpath' ) );
		}

		return sprintf( '/sites/%d/%s', $site_id, $relative );
	}

	/**
	 * Serve a cached payload when available, otherwise forward to WPCOM and cache the result.
	 *
	 * @param WP_REST_Request      $request    Request object.
	 * @param string               $wpcom_path WPCOM path without the forwarded query string.
	 * @param array<string, mixed> $opts       version | base | cache overrides.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function forward( WP_REST_Request $request, string $wpcom_path, array $opts ) {
		$version   = $opts['version'] ?? '2';
		$base      = $opts['base'] ?? 'wpcom';
		$method    = strtoupper( $request->get_method() );
		$is_read   = 'GET' === $method;
		$cacheable = $is_read && ( $opts['cache'] ?? true );

		$cache_key = $cacheable ? $this->get_cache_key( $request, $wpcom_path ) : null;
		if ( null !== $cache_key ) {
			$cached = get_transient( $cache_key );
			if ( false !== $cached ) {
				return $this->build_response( $cached );
			}
		}

		if ( ! ( new Manager( self::SLUG ) )->is_connected() ) {
			return new WP_Error(
				'no_connection',
				__( 'Please connect Jetpack to load your data.', 'jetpack-premium-analytics' ),
				array( 'status' => 403 )
			);
		}

		$args = array(
			'method'  => $method,
			'timeout' => self::API_TIMEOUT,
		);
		$body = null;
		if ( ! $is_read ) {
			$body            = $request->get_body();
			$args['headers'] = array( 'Content-Type' => 'application/json' );
		}

		try {
			$response = Client::wpcom_json_api_request_as_blog(
				$this->append_forwarded_params( $request, $wpcom_path ),
				$version,
				$args,
				$body,
				$base
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				'api_error',
				__( 'Error processing the request.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error communicating with the data service.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		// Mirror stats-admin: a successful write invalidates the matching (param-less) read cache.
		if ( ! $is_read && ( $opts['bust_on_write'] ?? false ) && 200 === (int) wp_remote_retrieve_response_code( $response ) ) {
			delete_transient( $this->cache_key_for( $wpcom_path, array() ) );
		}

		return $this->cache_and_build_response( $response, $cache_key );
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
	 * Cache a successful (200) response when a cache key is given, and return it to the caller.
	 *
	 * @param array       $http_response Raw response from the Jetpack client.
	 * @param string|null $cache_key     Transient key, or null to skip caching.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function cache_and_build_response( array $http_response, ?string $cache_key ) {
		$status = (int) wp_remote_retrieve_response_code( $http_response );
		$data   = json_decode( wp_remote_retrieve_body( $http_response ), false );

		// A 200 with an undecodable body means the upstream is degraded; don't cache garbage.
		if ( 200 === $status && null === $data && JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'api_error',
				__( 'The data service returned an unreadable response.', 'jetpack-premium-analytics' ),
				array( 'status' => 502 )
			);
		}

		$payload = array(
			'data'    => $data,
			'status'  => $status,
			'headers' => $this->extract_forwarded_headers( wp_remote_retrieve_headers( $http_response ) ),
		);

		if ( null !== $cache_key && 200 === $status ) {
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
	 * Append the forwarded query params to a WPCOM path, choosing the right separator.
	 *
	 * @param WP_REST_Request $request    Request object.
	 * @param string          $wpcom_path WPCOM path that may already carry a query string.
	 *
	 * @return string
	 */
	private function append_forwarded_params( WP_REST_Request $request, string $wpcom_path ): string {
		$params = $this->get_forwarded_params( $request );
		if ( empty( $params ) ) {
			return $wpcom_path;
		}

		$separator = str_contains( $wpcom_path, '?' ) ? '&' : '?';

		return $wpcom_path . $separator . http_build_query( $params );
	}

	/**
	 * Query params to forward to WPCOM, minus the WordPress routing params.
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
	 * Build the transient key from the request signature (target path + forwarded params).
	 *
	 * @param WP_REST_Request $request    Request object.
	 * @param string          $wpcom_path WPCOM path without the forwarded query string.
	 *
	 * @return string
	 */
	private function get_cache_key( WP_REST_Request $request, string $wpcom_path ): string {
		return $this->cache_key_for( $wpcom_path, $this->get_forwarded_params( $request ) );
	}

	/**
	 * Transient key for a target path and a set of forwarded params (order-independent).
	 *
	 * @param string $wpcom_path WPCOM path without the forwarded query string.
	 * @param array  $params     Forwarded query params.
	 *
	 * @return string
	 */
	private function cache_key_for( string $wpcom_path, array $params ): string {
		ksort( $params );
		$signature = $wpcom_path . '|' . (string) wp_json_encode( $params, JSON_UNESCAPED_SLASHES );

		return self::CACHE_PREFIX . md5( $signature );
	}
}
