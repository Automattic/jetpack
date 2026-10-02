<?php
/**
 * REST controller that proxies allowlisted requests to the WordPress.com API.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Forwards an allowlisted request to the WordPress.com endpoint of the connected site,
 * signed as the blog, caches a successful read in a short-lived transient, and returns it.
 *
 * One route serves every allowed endpoint, with the WordPress.com API version in the path:
 *
 *     <namespace>/proxy/v<version>/<prefix>/<sub-path>   e.g. proxy/v1.1/stats/video-plays
 *
 * The product owning the route declares the prefixes it exposes (see {@see __construct()});
 * the blog token is never forwarded outside that table. A product with needs beyond the
 * table overrides {@see request()}, {@see prepare_body()} or {@see extract_forwarded_headers()}.
 *
 * @since $$next-version$$
 */
class Proxy_Controller extends WP_REST_Controller {

	/**
	 * Per-prefix configuration, the single source of truth for every proxied endpoint group.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	protected $prefix_config;

	/**
	 * Transient key prefix.
	 *
	 * @var string
	 */
	protected $cache_prefix;

	/**
	 * Plugin slug handed to the connection manager, or null for the default.
	 *
	 * @var string|null
	 */
	protected $connection_slug;

	/**
	 * How long a successful response stays cached, in seconds.
	 *
	 * @var int
	 */
	protected $cache_ttl;

	/**
	 * Timeout for the outbound WordPress.com request, in seconds.
	 *
	 * @var int
	 */
	protected $api_timeout;

	/**
	 * Constructor.
	 *
	 * The prefix table keys double as the security boundary: a request is only routed, and the
	 * blog token only forwarded, if its first path segment is a key. Keys are lowercase; they are
	 * matched case-insensitively. A request maps to `proxy/v<version>/<key>/<sub-path>` →
	 * `/sites/<blog-id>/<key>/<sub-path>`, and the caller chooses the version.
	 *
	 * Fields per entry:
	 *  - `capability` (string, required) Capability granting access. `manage_options` is always
	 *                  also accepted. A missing value fails closed.
	 *  - `writes`     (string[], optional) Sub-paths reachable with POST, the only write verb. A
	 *                  matcher ending in `/` covers that sub-path and anything under it; otherwise
	 *                  it covers that exact endpoint. Omit for a read-only group.
	 *  - `cache_bust` (bool, optional) If true, a successful POST clears the matching read cache.
	 *  - `path`       (string, optional) printf template (`%d` = blog id) for a group NOT under
	 *                  `/sites/<id>/`, e.g. `/upgrades?site=%d`. Such a group takes no sub-path.
	 *  - `pattern`    (string, optional) Regex the sub-path must fully match, for a group where
	 *                  only specific endpoints are safe to expose. Anchored on both ends and
	 *                  enforced in the route regex AND when the param is validated, because the
	 *                  route capture can be shadowed with `?endpoint=`.
	 *
	 * @param string                              $rest_namespace REST namespace the route lives in.
	 * @param array<string, array<string, mixed>> $prefix_config  The prefix table described above.
	 * @param string                              $cache_prefix   Transient key prefix, unique to the product.
	 * @param array<string, mixed>                $options        `connection_slug`, `cache_ttl` (seconds), `api_timeout` (seconds).
	 */
	public function __construct( string $rest_namespace, array $prefix_config, string $cache_prefix, array $options = array() ) {
		$this->namespace       = $rest_namespace;
		$this->rest_base       = 'proxy';
		$this->prefix_config   = $prefix_config;
		$this->cache_prefix    = $cache_prefix;
		$this->connection_slug = $options['connection_slug'] ?? null;
		$this->cache_ttl       = (int) ( $options['cache_ttl'] ?? 5 * MINUTE_IN_SECONDS );
		$this->api_timeout     = (int) ( $options['api_timeout'] ?? 20 );
	}

	/**
	 * Hook the route onto `rest_api_init`, and the cache prefix onto the Stats package's
	 * transient cleanup cron.
	 *
	 * @return void
	 */
	public function register_hooks(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_filter( 'jetpack_stats_transient_cleanup_prefixes', array( $this, 'register_transient_cleanup_prefix' ) );
	}

	/**
	 * Register the cache prefix with the Stats package's transient cleanup cron, which sweeps
	 * expired entries on sites without a persistent object cache. The coupling is a hook name:
	 * without the Stats package the filter never fires.
	 *
	 * A non-array is returned untouched so the cleanup's own defaults still apply.
	 *
	 * @param mixed $prefixes Transient prefixes the cleanup cron will sweep.
	 * @return mixed
	 */
	public function register_transient_cleanup_prefix( $prefixes ) {
		if ( is_array( $prefixes ) ) {
			$prefixes[] = $this->cache_prefix;
		}

		return $prefixes;
	}

	/**
	 * Register the proxy route, anchored to the prefix table.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/v(?P<version>[0-9]+(?:\.[0-9]+)?)/(?P<endpoint>' . $this->allowed_endpoint_pattern() . ')',
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
						'description'       => __( 'WordPress.com API version to forward to (e.g. 1.1, 1.2, 2).', 'jetpack-connection' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( $this, 'validate_version' ),
					),
				),
			)
		);
	}

	/**
	 * Regex alternation of the allowed endpoints: each prefix followed by its `pattern`-constrained
	 * sub-path when set, or any sub-path otherwise.
	 *
	 * @return string
	 */
	protected function allowed_endpoint_pattern(): string {
		$alternatives = array();

		foreach ( $this->prefix_config as $prefix => $config ) {
			$suffix         = isset( $config['pattern'] ) ? '/' . $config['pattern'] : '(?:/.*)?';
			$alternatives[] = preg_quote( $prefix, '#' ) . $suffix;
		}

		return '(?:' . implode( '|', $alternatives ) . ')';
	}

	/**
	 * The prefix table entry for an endpoint's top-level prefix, or null if not allowed.
	 *
	 * @param string $endpoint The endpoint value (`get_param('endpoint')`).
	 * @return array<string, mixed>|null
	 */
	protected function config_for( string $endpoint ): ?array {
		$prefix = strtolower( explode( '/', $endpoint )[0] );

		return $this->prefix_config[ $prefix ] ?? null;
	}

	/**
	 * Permission callback: the prefix's capability grants access, and `manage_options` always does.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool
	 */
	public function check_data_permission( WP_REST_Request $request ): bool {
		$config = $this->config_for( (string) $request->get_param( 'endpoint' ) );
		if ( null === $config ) {
			return false;
		}

		// Fall back to `do_not_allow` so an entry missing `capability` fails closed.
		$capability = $config['capability'] ?? 'do_not_allow';

		// phpcs:ignore WordPress.WP.Capabilities.Unknown -- The capability comes from the prefix table.
		return current_user_can( 'manage_options' ) || current_user_can( $capability );
	}

	/**
	 * Confine an endpoint to a relative sub-path under an allowed prefix, rejecting traversal
	 * (`..`) and schemes (`:`). Commas are permitted since stats sub-paths carry them (UTM params).
	 *
	 * The prefix is re-checked here, not just in the route regex: WP's `get_param()` prefers
	 * GET/JSON/POST over the URL capture, so a caller could otherwise shadow the matched `endpoint`
	 * with `?endpoint=…`. This runs against the same value the handler forwards.
	 *
	 * @param mixed $value Raw endpoint param.
	 * @return bool
	 */
	public function validate_data_endpoint( $value ): bool {
		$value = (string) $value;

		if ( str_contains( $value, '..' ) ) {
			return false;
		}

		if ( ! preg_match( '#^[\w.,/-]+$#', $value ) ) {
			return false;
		}

		$config = $this->config_for( $value );
		if ( null === $config ) {
			return false;
		}

		$prefix = strtolower( explode( '/', $value )[0] );

		// A prefix with a fixed `path` takes no sub-path: build_data_path() would mis-route it.
		if ( isset( $config['path'] ) && $prefix !== rtrim( strtolower( $value ), '/' ) ) {
			return false;
		}

		if ( isset( $config['pattern'] ) && ! preg_match( '#^' . preg_quote( $prefix, '#' ) . '/' . $config['pattern'] . '$#i', rtrim( $value, '/' ) ) ) {
			return false;
		}

		return true;
	}

	/**
	 * A WordPress.com API version is one or two dot-separated numbers (e.g. `2`, `1.1`).
	 *
	 * @param mixed $value Raw version param.
	 * @return bool
	 */
	public function validate_version( $value ): bool {
		return (bool) preg_match( '#^[0-9]+(\.[0-9]+)?$#', (string) $value );
	}

	/**
	 * Proxy a request to its WordPress.com endpoint, at the caller-chosen API version.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_data_request( WP_REST_Request $request ) {
		$endpoint = (string) $request->get_param( 'endpoint' );
		$method   = strtoupper( $request->get_method() );

		// Reads are open across the allowed prefixes; only POST may mutate, and only on the
		// write allowlist. Everything else is rejected locally.
		if ( 'GET' !== $method && ! ( 'POST' === $method && $this->is_write_allowed( $endpoint ) ) ) {
			return new WP_Error(
				'rest_read_only',
				__( 'This endpoint is read-only.', 'jetpack-connection' ),
				array( 'status' => 405 )
			);
		}

		$version = (string) $request->get_param( 'version' );

		return $this->forward(
			$request,
			$this->build_data_path( $endpoint ),
			array(
				'version'       => $version,
				'base'          => $this->base_for_version( $version ),
				'bust_on_write' => $this->busts_cache( $endpoint ),
				'config'        => $this->config_for( $endpoint ) ?? array(),
			)
		);
	}

	/**
	 * The WordPress.com API base for a version: v2 lives under `wpcom`, v1.x under `rest`.
	 *
	 * @param string $version WordPress.com API version.
	 * @return string
	 */
	protected function base_for_version( string $version ): string {
		return 2 === (int) $version ? 'wpcom' : 'rest';
	}

	/**
	 * Build the WordPress.com path for an endpoint.
	 *
	 * @param string $endpoint The validated, allowed sub-path.
	 * @return string
	 */
	protected function build_data_path( string $endpoint ): string {
		$site_id = (int) Jetpack_Options::get_option( 'id' );

		$config = $this->config_for( $endpoint );
		if ( null !== $config && isset( $config['path'] ) ) {
			return sprintf( $config['path'], $site_id );
		}

		return sprintf( '/sites/%d/%s', $site_id, $endpoint );
	}

	/**
	 * Whether a POST may be forwarded for this endpoint, per the prefix's `writes`.
	 *
	 * @param string $endpoint The validated sub-path.
	 * @return bool
	 */
	protected function is_write_allowed( string $endpoint ): bool {
		$endpoint = strtolower( $endpoint );
		$config   = $this->config_for( $endpoint );

		foreach ( $config['writes'] ?? array() as $matcher ) {
			$matcher = strtolower( $matcher );
			$matches = str_ends_with( $matcher, '/' )
				? str_starts_with( $endpoint, $matcher )
				: $endpoint === $matcher;
			if ( $matches ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether a successful write to this endpoint should invalidate the matching read cache.
	 *
	 * @param string $endpoint The validated sub-path.
	 * @return bool
	 */
	protected function busts_cache( string $endpoint ): bool {
		$config = $this->config_for( $endpoint );

		return ! empty( $config['cache_bust'] );
	}

	/**
	 * Serve a cached payload when available, otherwise forward to WordPress.com and cache the result.
	 *
	 * @param WP_REST_Request      $request    Request object.
	 * @param string               $wpcom_path WordPress.com path without the forwarded query string.
	 * @param array<string, mixed> $opts       `version`, `base`, `bust_on_write`, `config` (the prefix entry).
	 * @return WP_REST_Response|WP_Error
	 */
	protected function forward( WP_REST_Request $request, string $wpcom_path, array $opts ) {
		$version = $opts['version'] ?? '2';
		$base    = $opts['base'] ?? 'wpcom';
		$is_read = 'GET' === strtoupper( $request->get_method() );

		$cache_key = $is_read && null === $request->get_param( 'force_refresh' )
			? $this->cache_key_for( $wpcom_path, $version, $base, $this->get_forwarded_params( $request ) )
			: null;
		if ( null !== $cache_key ) {
			$cached = get_transient( $cache_key );
			if ( false !== $cached ) {
				return $this->build_response( $cached );
			}
		}

		$response = $this->request( $request, $wpcom_path, $opts );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$this->maybe_bust_read_cache( $response, ! $is_read, $opts, $wpcom_path, $version, $base );

		return $this->cache_and_build_response( $response, $cache_key );
	}

	/**
	 * Send the request to WordPress.com, signed as the blog.
	 *
	 * The transport seam: a product that must reach an endpoint another way, for a group its
	 * table marks, overrides this and falls back to the parent for the rest.
	 *
	 * @param WP_REST_Request      $request    Request object.
	 * @param string               $wpcom_path WordPress.com path without the forwarded query string.
	 * @param array<string, mixed> $opts       Forwarding opts, as passed to {@see forward()}.
	 * @return array|WP_Error Raw HTTP response, or an error.
	 */
	protected function request( WP_REST_Request $request, string $wpcom_path, array $opts ) {
		if ( ! ( new Manager( $this->connection_slug ) )->is_connected() ) {
			return new WP_Error(
				'no_connection',
				__( 'Please connect Jetpack to load your data.', 'jetpack-connection' ),
				array( 'status' => 403 )
			);
		}

		$method = strtoupper( $request->get_method() );
		$args   = array(
			'method'  => $method,
			'timeout' => $this->api_timeout,
		);
		$body   = null;
		if ( 'GET' !== $method ) {
			$body            = $this->prepare_body( $request->get_body(), $opts );
			$args['headers'] = array( 'Content-Type' => 'application/json' );
		}

		try {
			$response = Client::wpcom_json_api_request_as_blog(
				$this->append_forwarded_params( $request, $wpcom_path ),
				$opts['version'] ?? '2',
				$args,
				$body,
				$opts['base'] ?? 'wpcom'
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				'api_error',
				__( 'Error processing the request.', 'jetpack-connection' ),
				array( 'status' => 500 )
			);
		}

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error communicating with the data service.', 'jetpack-connection' ),
				array( 'status' => 500 )
			);
		}

		return $response;
	}

	/**
	 * The body to forward with a write. Forwarded untouched by default; a product that must
	 * rewrite a body for a group its table marks overrides this.
	 *
	 * @param string               $body The incoming request body.
	 * @param array<string, mixed> $opts Forwarding opts, as passed to {@see forward()}.
	 * @return string
	 */
	protected function prepare_body( string $body, array $opts ): string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The seam's signature, for subclasses.
		return $body;
	}

	/**
	 * Response headers worth forwarding back to the client. None by default.
	 *
	 * @param mixed $headers Response headers as returned by the HTTP API.
	 * @return array<string, string>
	 */
	protected function extract_forwarded_headers( $headers ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The seam's signature, for subclasses.
		return array();
	}

	/**
	 * A successful write invalidates the matching (param-less) read cache, so the next GET reflects
	 * the change. It busts only when the request was a write, the prefix opted in (`bust_on_write`),
	 * and WordPress.com returned 200.
	 *
	 * @param array                $http_response Raw response from the Jetpack client.
	 * @param bool                 $is_write      Whether the request used a write (non-GET) method.
	 * @param array<string, mixed> $opts          Forwarding opts (reads `bust_on_write`).
	 * @param string               $wpcom_path    WordPress.com path without the forwarded query string.
	 * @param string               $version       WordPress.com API version.
	 * @param string               $base          WordPress.com API base.
	 * @return void
	 */
	protected function maybe_bust_read_cache( array $http_response, bool $is_write, array $opts, string $wpcom_path, string $version, string $base ): void {
		if ( ! $is_write || empty( $opts['bust_on_write'] ) ) {
			return;
		}

		if ( 200 !== (int) wp_remote_retrieve_response_code( $http_response ) ) {
			return;
		}

		delete_transient( $this->cache_key_for( $wpcom_path, $version, $base, array() ) );
	}

	/**
	 * Cache a successful (200) response when a cache key is given, and return it to the caller.
	 *
	 * @param array       $http_response Raw response from the Jetpack client.
	 * @param string|null $cache_key     Transient key, or null to skip caching.
	 * @return WP_REST_Response|WP_Error
	 */
	protected function cache_and_build_response( array $http_response, ?string $cache_key ) {
		$status = (int) wp_remote_retrieve_response_code( $http_response );
		$data   = json_decode( wp_remote_retrieve_body( $http_response ), false );

		// A 200 with an undecodable body means the upstream is degraded; don't cache garbage.
		if ( 200 === $status && null === $data && JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'api_error',
				__( 'The data service returned an unreadable response.', 'jetpack-connection' ),
				array( 'status' => 502 )
			);
		}

		$payload = array(
			'data'    => $data,
			'status'  => $status,
			'headers' => $this->extract_forwarded_headers( wp_remote_retrieve_headers( $http_response ) ),
		);

		if ( null !== $cache_key && 200 === $status ) {
			set_transient( $cache_key, $payload, $this->cache_ttl );
		}

		return $this->build_response( $payload );
	}

	/**
	 * Rebuild a WP_REST_Response from a cached or freshly fetched payload.
	 *
	 * @param array $payload Stored payload with data, status, and headers.
	 * @return WP_REST_Response
	 */
	protected function build_response( array $payload ): WP_REST_Response {
		$response = new WP_REST_Response( $payload['data'], (int) $payload['status'] );

		foreach ( (array) $payload['headers'] as $name => $value ) {
			$response->header( $name, $value );
		}

		return $response;
	}

	/**
	 * Append the forwarded query params to a WordPress.com path, choosing the right separator.
	 *
	 * @param WP_REST_Request $request    Request object.
	 * @param string          $wpcom_path WordPress.com path that may already carry a query string.
	 * @return string
	 */
	protected function append_forwarded_params( WP_REST_Request $request, string $wpcom_path ): string {
		$params = $this->get_forwarded_params( $request );
		if ( empty( $params ) ) {
			return $wpcom_path;
		}

		$separator = str_contains( $wpcom_path, '?' ) ? '&' : '?';

		return $wpcom_path . $separator . http_build_query( $params );
	}

	/**
	 * Query params to forward, minus the WordPress routing params, the proxy's own control params
	 * (`endpoint`, `version`, `force_refresh`, which a caller could also pass as query params) and
	 * `site`, since the proxy pins the site itself. Dropping them also keeps them out of the cache key.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array
	 */
	protected function get_forwarded_params( WP_REST_Request $request ): array {
		$params = $request->get_query_params();
		unset( $params['rest_route'], $params['_locale'], $params['site'], $params['endpoint'], $params['version'], $params['force_refresh'] );

		return is_array( $params ) ? $params : array();
	}

	/**
	 * Transient key for a target path + API version/base + forwarded params, in any order.
	 *
	 * @param string $wpcom_path WordPress.com path without the forwarded query string.
	 * @param string $version    WordPress.com API version.
	 * @param string $base       WordPress.com API base.
	 * @param array  $params     Forwarded query params.
	 * @return string
	 */
	protected function cache_key_for( string $wpcom_path, string $version, string $base, array $params ): string {
		ksort( $params );
		$signature = implode( '|', array( $wpcom_path, $version, $base, (string) wp_json_encode( $params, JSON_UNESCAPED_SLASHES ) ) );

		return $this->cache_prefix . md5( $signature );
	}
}
