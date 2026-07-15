<?php
/**
 * REST controller that proxies dashboard data-layer requests to the WPCOM analytics API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Constants;
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
 * One agnostic route serves the whole pass-through surface (analytics + the re-exposed
 * `stats-admin` endpoints), minus the blog ID in the URL:
 *
 *     proxy/v<version>/<prefix>/<subpath>   e.g. proxy/v1.1/wordads/earnings
 *
 * The `proxy/` segment marks a transparent WPCOM forward (future local endpoints live
 * elsewhere under the namespace). Rather than registering each endpoint, it accepts any
 * sub-path under an allowed top-level prefix (see {@see PREFIX_CONFIG}); the caller picks the
 * WPCOM API `version` in the path (the base is derived: v2 → wpcom, v1.x → rest). The proxy
 * stays endpoint-agnostic while the prefix allowlist + write-method policy keep the blast
 * radius of the blog token bounded.
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
	 * Per-prefix configuration — the single source of truth for every proxied endpoint group.
	 * The route regex, permission check, write gate, cache-busting, and path builder all read
	 * from this table, so an endpoint group is defined here and nowhere else.
	 *
	 * The keys double as the security boundary: a request is only routed (and the blog token only
	 * forwarded) if its first path segment is a key here — so the proxy can never be driven
	 * against the whole WPCOM site API. Keep keys lowercase; they are matched case-insensitively.
	 *
	 * A request maps to `proxy/v<version>/<key>/<sub-path>` →
	 * `/sites/<blog-id>/<key>/<sub-path>` (the caller chooses `<version>`; the base is derived).
	 *
	 * Fields per entry:
	 *  - `capability` (string, required) Capability granting access. `manage_options` is always
	 *                  also accepted, so a value of `manage_options` means "admins only". A
	 *                  missing/unknown value fails closed (denies).
	 *  - `writes`     (string[], optional) Sub-paths reachable with POST (the only write verb).
	 *                  Each matcher: trailing `/` = that sub-path and anything under it; no
	 *                  trailing `/` = that exact endpoint only. Omit for a read-only group.
	 *  - `cache_bust` (bool, optional) If true, a successful POST clears the matching read cache.
	 *                  Only meaningful alongside `writes`.
	 *  - `path`       (string, optional) printf template (`%d` = blog id) for groups NOT under
	 *                  `/sites/<id>/` (e.g. `upgrades` → `/upgrades?site=%d`). A group with a
	 *                  fixed `path` takes no sub-path. Omit for the normal `/sites/<id>/<key>/…`.
	 *  - `pattern`    (string, optional) Regex the sub-path (after `<key>/`) must fully match,
	 *                  for groups where only specific endpoints are safe to expose (e.g. `posts`
	 *                  → only `<id>/likes`, never post content). Anchored on both ends and
	 *                  enforced in the route regex AND in `validate_data_endpoint()` (the route
	 *                  capture can be shadowed with `?endpoint=`). Omit to allow the whole group.
	 *  - `unauthenticated` (bool, optional) Forward reads WITHOUT signing (plain HTTP, like
	 *                  stats-admin's Odyssey proxy does for post likes). For WPCOM endpoints
	 *                  that reject blog-token auth but serve public data without credentials.
	 *                  Reads only; the group's `capability` still gates the local request.
	 *
	 * Maintaining endpoints (this table is the only edit needed for a pass-through endpoint):
	 *  - ADD a group:   add a key with at least `capability`. Reads work immediately at
	 *                   `proxy/v<version>/<key>/<sub-path>`. The frontend picks the WPCOM version.
	 *  - ALLOW writes:  add `writes` (and `cache_bust` if a write should freshen a cached read).
	 *  - CHANGE access: edit `capability` (e.g. tighten a group to `manage_options`).
	 *  - REMOVE a group: delete its key — the route stops matching it and it 404s.
	 *  - Cover it with a row in `data_endpoint_matrix()` (capability / writable / WPCOM path).
	 *  - NOTE: this is for transparent WPCOM forwards only. Endpoints needing local processing
	 *    (DB reads, body rewrites, the Notices class, …) are NOT proxied — they get their own
	 *    routes outside `proxy/`; do not add them here.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private const PREFIX_CONFIG = array(
		'analytics'                     => array( 'capability' => 'manage_options' ),
		'stats'                         => array(
			'capability' => 'view_stats',
			'writes'     => array( 'stats/referrers/spam/' ),
		),
		'wordads'                       => array( 'capability' => 'activate_wordads' ),
		'subscribers'                   => array( 'capability' => 'view_stats' ),
		'site-has-never-published-post' => array( 'capability' => 'view_stats' ),
		'jetpack-stats'                 => array( 'capability' => 'view_stats' ),
		'jetpack-stats-dashboard'       => array(
			'capability' => 'view_stats',
			'writes'     => array( 'jetpack-stats-dashboard/' ),
			'cache_bust' => true,
		),
		'commercial-classification'     => array(
			'capability' => 'view_stats',
			'writes'     => array( 'commercial-classification' ),
		),
		'upgrades'                      => array(
			'capability' => 'view_stats',
			'path'       => '/upgrades?site=%d',
		),
		'posts'                         => array(
			'capability'      => 'view_stats',
			// Only a post's likers list — never post content (the blog token could
			// otherwise read private posts for any view_stats user).
			'pattern'         => '[0-9]+/likes',
			// The likes endpoint rejects blog-token auth ("That API call is not
			// allowed for this account") but serves public posts without
			// credentials; forward unsigned, mirroring stats-admin's Odyssey proxy.
			'unauthenticated' => true,
		),
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = self::SLUG . '/v1';
	}

	/**
	 * Hook the controller's routes onto rest_api_init, and register its cache prefix with the
	 * stats package's transient cleanup cron.
	 *
	 * @return void
	 */
	public static function register(): void {
		$controller = new self();
		add_action( 'rest_api_init', array( $controller, 'register_routes' ) );
		add_filter( 'jetpack_stats_transient_cleanup_prefixes', array( $controller, 'register_transient_cleanup_prefix' ) );
	}

	/**
	 * Register the proxy cache prefix with the stats package's transient cleanup cron, so expired
	 * proxy transients are swept on sites without a persistent object cache (where WordPress's lazy
	 * GC never reaches the rarely re-read, param-keyed entries). The coupling is loose: the filter
	 * is just a hook name, so if the stats package isn't loaded it never fires and nothing breaks.
	 *
	 * Appends only when handed a valid array; a non-array (from a misbehaving upstream filter) is
	 * returned untouched so the stats consumer's own fall-back-to-defaults normalization still runs
	 * instead of being masked into dropping the default stats prefix.
	 *
	 * @param mixed $prefixes Transient prefixes the stats cleanup cron will sweep.
	 *
	 * @return mixed
	 */
	public function register_transient_cleanup_prefix( $prefixes ) {
		if ( is_array( $prefixes ) ) {
			$prefixes[] = self::CACHE_PREFIX;
		}

		return $prefixes;
	}

	/**
	 * Register the agnostic data proxy route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		// proxy/v<version>/<prefix>/<subpath> — the `proxy/` segment marks a transparent WPCOM
		// pass-through (local endpoints live elsewhere under the namespace), the version is part
		// of the path (matching WPCOM's own `rest/v1.1` / `wpcom/v2` structure), and the prefix
		// allowlist is anchored into the route.
		register_rest_route(
			$this->namespace,
			'/proxy/v(?P<version>[0-9]+(?:\.[0-9]+)?)/(?P<endpoint>' . $this->allowed_endpoint_pattern() . ')',
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
						'required'          => true,
						'validate_callback' => array( $this, 'validate_version' ),
					),
				),
			)
		);
	}

	/**
	 * Regex alternation of the allowed endpoints, used to anchor the data route: each
	 * {@see PREFIX_CONFIG} key followed by its `pattern`-constrained sub-path when set, or any
	 * sub-path otherwise.
	 *
	 * @return string
	 */
	private function allowed_endpoint_pattern(): string {
		$alternatives = array();

		foreach ( self::PREFIX_CONFIG as $prefix => $config ) {
			$suffix         = isset( $config['pattern'] ) ? '/' . $config['pattern'] : '(?:/.*)?';
			$alternatives[] = preg_quote( $prefix, '#' ) . $suffix;
		}

		return '(?:' . implode( '|', $alternatives ) . ')';
	}

	/**
	 * The {@see PREFIX_CONFIG} entry for an endpoint's top-level prefix, or null if not allowed.
	 *
	 * @param string $endpoint The endpoint value (`get_param('endpoint')`).
	 *
	 * @return array<string, mixed>|null
	 */
	private function config_for( string $endpoint ): ?array {
		$prefix = strtolower( explode( '/', $endpoint )[0] );

		return self::PREFIX_CONFIG[ $prefix ] ?? null;
	}

	/**
	 * Permission for the data proxy: the prefix's configured capability grants access, and
	 * `manage_options` always does (so `analytics`, whose capability is `manage_options`, stays
	 * admin-only). The capability comes from {@see PREFIX_CONFIG}.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function check_data_permission( WP_REST_Request $request ): bool {
		$config = $this->config_for( (string) $request->get_param( 'endpoint' ) );
		if ( null === $config ) {
			return false;
		}

		// Fall back to `do_not_allow` so a config entry missing `capability` fails closed.
		$capability = $config['capability'] ?? 'do_not_allow';

		// phpcs:ignore WordPress.WP.Capabilities.Unknown -- capability is from the PREFIX_CONFIG allowlist.
		return current_user_can( 'manage_options' ) || current_user_can( $capability );
	}

	/**
	 * Confine a data endpoint to a relative sub-path under an allowed prefix, rejecting traversal
	 * (`..`) and schemes (`:`). Commas are permitted since stats sub-paths legitimately contain
	 * them (UTM params).
	 *
	 * The prefix is re-checked here, not just in the route regex: WP's `get_param()` prefers
	 * GET/JSON/POST over the URL route capture, so a caller could otherwise shadow the matched
	 * `endpoint` with `?endpoint=…` and escape the allowlist. This runs against the same
	 * `get_param()` value the handler forwards, so it closes the hole whichever source wins.
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

		if ( ! preg_match( '#^[\w.,/-]+$#', $value ) ) {
			return false;
		}

		$config = $this->config_for( $value );
		if ( null === $config ) {
			return false;
		}

		// A prefix with a fixed `path` (e.g. site-less `upgrades`) takes no sub-path, so reject
		// `<prefix>/<anything>` — build_data_path() ignores sub-paths there and would mis-route.
		if ( isset( $config['path'] ) ) {
			$prefix = strtolower( explode( '/', $value )[0] );
			if ( $prefix !== rtrim( strtolower( $value ), '/' ) ) {
				return false;
			}
		}

		// A `pattern`-constrained prefix only exposes matching sub-paths. Re-checked here, not
		// just in the route regex, because `get_param()` can be shadowed with `?endpoint=`.
		if ( isset( $config['pattern'] ) ) {
			$prefix = strtolower( explode( '/', $value )[0] );
			if ( ! preg_match( '#^' . preg_quote( $prefix, '#' ) . '/' . $config['pattern'] . '$#i', rtrim( $value, '/' ) ) ) {
				return false;
			}
		}

		return true;
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
	 * Proxy a data request to its WPCOM endpoint, at the caller-chosen API version.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_data_request( WP_REST_Request $request ) {
		$endpoint = (string) $request->get_param( 'endpoint' );
		$method   = strtoupper( $request->get_method() );

		// Reads are open across the allowed prefixes; only POST may mutate, and only the
		// few endpoints on the write allowlist. Everything else is rejected locally.
		if ( 'GET' !== $method && ! ( 'POST' === $method && $this->is_write_allowed( $endpoint ) ) ) {
			return new WP_Error(
				'rest_read_only',
				__( 'This endpoint is read-only.', 'jetpack-premium-analytics' ),
				array( 'status' => 405 )
			);
		}

		$version = (string) $request->get_param( 'version' );

		$config = $this->config_for( $endpoint );

		return $this->forward(
			$request,
			$this->build_data_path( $endpoint ),
			array(
				'version'         => $version,
				'base'            => $this->base_for_version( $version ),
				'bust_on_write'   => $this->busts_cache( $endpoint ),
				'unauthenticated' => ! empty( $config['unauthenticated'] ),
			)
		);
	}

	/**
	 * The WPCOM API base for a version: v2 lives under `wpcom`, v1.x under `rest`. Derived from
	 * the major component so dotted forms (e.g. `2.0`) map correctly.
	 *
	 * @param string $version WPCOM API version.
	 *
	 * @return string
	 */
	private function base_for_version( string $version ): string {
		return 2 === (int) $version ? 'wpcom' : 'rest';
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

		// A prefix with a fixed `path` (e.g. site-less `upgrades`) is not scoped under /sites/<id>/.
		$config = $this->config_for( $endpoint );
		if ( null !== $config && isset( $config['path'] ) ) {
			return sprintf( $config['path'], $site_id );
		}

		return sprintf( '/sites/%d/%s', $site_id, $endpoint );
	}

	/**
	 * Whether a non-GET method may be forwarded for this endpoint, per the prefix's `writes`.
	 * A `writes` entry ending in `/` matches that sub-path prefix; otherwise it matches exactly.
	 *
	 * @param string $endpoint The validated sub-path.
	 *
	 * @return bool
	 */
	private function is_write_allowed( string $endpoint ): bool {
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
	 *
	 * @return bool
	 */
	private function busts_cache( string $endpoint ): bool {
		$config = $this->config_for( $endpoint );

		return ! empty( $config['cache_bust'] );
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

		// Unsigned forwards need no tokens — only the blog id baked into the path —
		// so they skip the connection gate (its blog-token requirement) entirely.
		if ( ! empty( $opts['unauthenticated'] ) && $is_read ) {
			$response = $this->request_unauthenticated( $request, $wpcom_path, $version, $base );
			if ( is_wp_error( $response ) ) {
				return $response;
			}

			return $this->cache_and_build_response( $response, $cache_key );
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

		$this->maybe_bust_read_cache( $response, ! $is_read, $opts, $wpcom_path, $version, $base );

		return $this->cache_and_build_response( $response, $cache_key );
	}

	/**
	 * Forward a read to WPCOM without signing, for `unauthenticated` endpoint groups. Mirrors
	 * stats-admin's Odyssey proxy (`get_single_post_likes()`): the target endpoint rejects
	 * blog-token auth but serves public data to credential-less requests. Private posts/sites
	 * return WPCOM's own restricted error — the same limitation Odyssey has.
	 *
	 * @param WP_REST_Request $request    Request object.
	 * @param string          $wpcom_path WPCOM path without the forwarded query string.
	 * @param string          $version    WPCOM API version.
	 * @param string          $base       WPCOM API base (`rest` or `wpcom`).
	 *
	 * @return array|WP_Error Raw HTTP response, or an error.
	 */
	private function request_unauthenticated( WP_REST_Request $request, string $wpcom_path, string $version, string $base ) {
		// The path embeds the blog id; without one the request would target site 0.
		if ( ! (int) Jetpack_Options::get_option( 'id' ) ) {
			return new WP_Error(
				'no_connection',
				__( 'Please connect Jetpack to load your data.', 'jetpack-premium-analytics' ),
				array( 'status' => 403 )
			);
		}

		$api_base = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		if ( empty( $api_base ) ) {
			$api_base = 'https://public-api.wordpress.com';
		}

		$response = wp_remote_get(
			sprintf( '%s/%s/v%s%s', $api_base, $base, $version, $this->append_forwarded_params( $request, $wpcom_path ) ),
			array( 'timeout' => self::API_TIMEOUT )
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error communicating with the data service.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		return $response;
	}

	/**
	 * Mirror stats-admin: a successful write invalidates the matching (param-less) read cache, so
	 * the next GET reflects the change instead of serving the cached pre-write value. It busts only
	 * when the request was a write, the prefix opted in (`bust_on_write`), and WPCOM returned 200.
	 *
	 * This is a pure function of the response and route context — it takes the raw client response
	 * rather than reaching out to WPCOM itself, so the full bust decision is unit-testable without
	 * a live connection.
	 *
	 * @param array                $http_response Raw response from the Jetpack client.
	 * @param bool                 $is_write      Whether the request used a write (non-GET) method.
	 * @param array<string, mixed> $opts          Forwarding opts (reads `bust_on_write`).
	 * @param string               $wpcom_path    WPCOM path without the forwarded query string.
	 * @param string               $version       WPCOM API version.
	 * @param string               $base          WPCOM API base.
	 *
	 * @return void
	 */
	private function maybe_bust_read_cache( array $http_response, bool $is_write, array $opts, string $wpcom_path, string $version, string $base ): void {
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
	 * Query params to forward to WPCOM, minus the WordPress routing params, the proxy's own
	 * control params (`endpoint`, `version`, `force_refresh` — which a caller could also pass as
	 * query params since `get_param()` prefers GET), and `site` (the proxy pins the site itself,
	 * so a caller-supplied `site` must not reach the `upgrades` query string). Dropping the
	 * control params also keeps them out of the cache key.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	private function get_forwarded_params( WP_REST_Request $request ): array {
		$params = $request->get_query_params();
		unset( $params['rest_route'], $params['_locale'], $params['site'], $params['endpoint'], $params['version'], $params['force_refresh'] );

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
