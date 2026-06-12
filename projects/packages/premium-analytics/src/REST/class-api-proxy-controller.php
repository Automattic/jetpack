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
 *  - the analytics catch-all (`proxy/<endpoint>` → `/sites/<id>/analytics/<endpoint>`, v2); and
 *  - an agnostic data proxy that re-exposes the `stats-admin` package's WPCOM pass-through
 *    endpoints under this namespace, minus the blog ID in the URL. Rather than registering
 *    each endpoint, it accepts any sub-path under an allowed top-level prefix (see
 *    {@see ALLOWED_PREFIXES}) and lets the caller pick the WPCOM API `version`; the proxy
 *    stays endpoint-agnostic while the prefix allowlist + write policy keep the blast radius
 *    of the blog token bounded.
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
	 * Top-level resource groups the data proxy may reach under `/sites/<id>/` (plus the
	 * site-less `upgrades`). This is the security boundary: the route only matches these
	 * prefixes, so the blog token can never be driven against the whole WPCOM site API.
	 *
	 * @var string[]
	 */
	private const ALLOWED_PREFIXES = array(
		'stats',
		'wordads',
		'subscribers',
		'jetpack-stats',
		'jetpack-stats-dashboard',
		'commercial-classification',
		'upgrades',
	);

	/**
	 * Sub-paths the data proxy may reach with a non-GET (write) method. Everything else is
	 * read-only — reads can only surface this site's own data, but writes are confined to the
	 * few endpoints the dashboard legitimately mutates.
	 *
	 * @var string[]
	 */
	private const WRITE_PREFIXES = array(
		'jetpack-stats-dashboard/',
		'commercial-classification',
		'stats/referrers/spam/',
	);

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
	 * Register the analytics catch-all and the agnostic data proxy.
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

		register_rest_route(
			$this->namespace,
			'/(?P<endpoint>(?:' . $this->allowed_prefix_pattern() . ')(?:/.*)?)',
			array(
				'methods'             => WP_REST_Server::READABLE . ',' . WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'handle_data_request' ),
				'permission_callback' => array( $this, 'check_data_permission' ),
				'args'                => array(
					'endpoint' => array(
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( $this, 'validate_data_endpoint' ),
					),
					'version'  => array(
						'description'       => __( 'WPCOM API version to forward to (e.g. 1.1, 1.2, 2).', 'jetpack-premium-analytics' ),
						'type'              => 'string',
						'default'           => '2',
						'validate_callback' => array( $this, 'validate_version' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Regex alternation of the allowed prefixes, used to anchor the data route.
	 *
	 * @return string
	 */
	private function allowed_prefix_pattern(): string {
		return implode(
			'|',
			array_map(
				static function ( string $prefix ): string {
					return preg_quote( $prefix, '#' );
				},
				self::ALLOWED_PREFIXES
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
	 * Permission for the data proxy: WordAds endpoints need the WordAds capability, the rest
	 * the general stats capability.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function check_data_permission( WP_REST_Request $request ): bool {
		if ( str_starts_with( (string) $request->get_param( 'endpoint' ), 'wordads' ) ) {
			return $this->check_wordads_permission();
		}

		return $this->check_stats_permission();
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
	 * Confine the analytics endpoint to a relative sub-path so it cannot escape the
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
	 * Confine a data endpoint to a relative sub-path, rejecting traversal (`..`). Broader than
	 * {@see validate_endpoint()} since stats sub-paths legitimately contain commas (UTM params).
	 * The allowed top-level prefix is already enforced by the route regex.
	 *
	 * @param mixed $value Raw endpoint param.
	 *
	 * @return bool
	 */
	public function validate_data_endpoint( $value ): bool {
		$value = (string) $value;

		if ( str_contains( $value, '..' ) ) {
			return false;
		}

		return (bool) preg_match( '#^[\w.,/-]+$#', $value );
	}

	/**
	 * A WPCOM API version is one or two dot-separated numbers (e.g. `2`, `1.1`).
	 *
	 * @param mixed $value Raw version param.
	 *
	 * @return bool
	 */
	public function validate_version( $value ): bool {
		return (bool) preg_match( '#^[0-9]+(\.[0-9]+)?$#', (string) $value );
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
	 * Proxy a data request to its WPCOM endpoint, at the caller-chosen API version.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_data_request( WP_REST_Request $request ) {
		$endpoint = (string) $request->get_param( 'endpoint' );

		if ( 'GET' !== strtoupper( $request->get_method() ) && ! $this->is_write_allowed( $endpoint ) ) {
			return new WP_Error(
				'rest_read_only',
				__( 'This endpoint is read-only.', 'jetpack-premium-analytics' ),
				array( 'status' => 405 )
			);
		}

		$version = (string) $request->get_param( 'version' );

		return $this->forward(
			$request,
			$this->build_data_path( $endpoint ),
			array(
				// WPCOM exposes v2 under the `wpcom` base and v1.x under the `rest` base.
				'version'       => $version,
				'base'          => '2' === $version ? 'wpcom' : 'rest',
				'bust_on_write' => $this->busts_cache( $endpoint ),
			)
		);
	}

	/**
	 * Build the WPCOM path for a data endpoint.
	 *
	 * @param string $endpoint The validated, allowed sub-path.
	 *
	 * @return string
	 */
	private function build_data_path( string $endpoint ): string {
		$site_id = (int) Jetpack_Options::get_option( 'id' );

		// `upgrades` (purchases) is the one endpoint not scoped under `/sites/<id>/`.
		if ( 'upgrades' === $endpoint ) {
			return sprintf( '/upgrades?site=%d', $site_id );
		}

		return sprintf( '/sites/%d/%s', $site_id, $endpoint );
	}

	/**
	 * Whether a non-GET method may be forwarded for this endpoint.
	 *
	 * @param string $endpoint The validated sub-path.
	 *
	 * @return bool
	 */
	private function is_write_allowed( string $endpoint ): bool {
		foreach ( self::WRITE_PREFIXES as $prefix ) {
			if ( $endpoint === $prefix || str_starts_with( $endpoint, $prefix ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether a successful write to this endpoint should invalidate the matching read cache.
	 *
	 * @param string $endpoint The validated sub-path.
	 *
	 * @return bool
	 */
	private function busts_cache( string $endpoint ): bool {
		return str_starts_with( $endpoint, 'jetpack-stats-dashboard/' );
	}

	/**
	 * Serve a cached payload when available, otherwise forward to WPCOM and cache the result.
	 *
	 * @param WP_REST_Request      $request    Request object.
	 * @param string               $wpcom_path WPCOM path without the forwarded query string.
	 * @param array<string, mixed> $opts       version | base | bust_on_write | cache overrides.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function forward( WP_REST_Request $request, string $wpcom_path, array $opts ) {
		$version   = $opts['version'] ?? '2';
		$base      = $opts['base'] ?? 'wpcom';
		$method    = strtoupper( $request->get_method() );
		$is_read   = 'GET' === $method;
		$cacheable = $is_read
			&& ( $opts['cache'] ?? true )
			&& null === $request->get_param( 'force_refresh' );

		$cache_key = $cacheable ? $this->cache_key_for( $wpcom_path, $version, $base, $this->get_forwarded_params( $request ) ) : null;
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
			delete_transient( $this->cache_key_for( $wpcom_path, $version, $base, array() ) );
		}

		return $this->cache_and_build_response( $response, $cache_key );
	}

	/**
	 * Schema for the analytics proxy endpoint.
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
	 * Query params to forward to WPCOM, minus the WordPress routing params and the proxy's own
	 * control param (`version`).
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	private function get_forwarded_params( WP_REST_Request $request ): array {
		$params = $request->get_query_params();
		// Drop the params WordPress adds for its own routing, plus the proxy's own version selector.
		unset( $params['rest_route'], $params['_locale'], $params['version'] );

		return is_array( $params ) ? $params : array();
	}

	/**
	 * Transient key for a target path + API version/base + forwarded params (order-independent).
	 * Version and base are part of the key so the same path at different versions doesn't collide.
	 *
	 * @param string $wpcom_path WPCOM path without the forwarded query string.
	 * @param string $version    WPCOM API version.
	 * @param string $base       WPCOM API base.
	 * @param array  $params     Forwarded query params.
	 *
	 * @return string
	 */
	private function cache_key_for( string $wpcom_path, string $version, string $base, array $params ): string {
		ksort( $params );
		$signature = implode( '|', array( $wpcom_path, $version, $base, (string) wp_json_encode( $params, JSON_UNESCAPED_SLASHES ) ) );

		return self::CACHE_PREFIX . md5( $signature );
	}
}
