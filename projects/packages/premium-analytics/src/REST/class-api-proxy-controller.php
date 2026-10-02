<?php
/**
 * REST controller that proxies dashboard data-layer requests to the WPCOM analytics API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\WPCOM_Proxy\Proxy_Controller;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;

/**
 * The dashboard's configuration of the shared WordPress.com proxy: the prefix allowlist with a
 * capability per group, plus three paths only the dashboard needs, which override the package's
 * transport, body and header seams.
 *
 * One agnostic route serves the whole pass-through surface (analytics + the re-exposed
 * `stats-admin` endpoints), minus the blog ID in the URL:
 *
 *     proxy/v<version>/<prefix>/<subpath>   e.g. proxy/v1.1/wordads/earnings
 */
class Api_Proxy_Controller extends Proxy_Controller {

	/**
	 * Package slug. Also the cache-key prefix (see SLUG-derived CACHE_PREFIX).
	 */
	private const SLUG = 'jetpack-premium-analytics';

	/**
	 * Transient key prefix, derived from the package slug.
	 *
	 * @var string
	 */
	private const CACHE_PREFIX = self::SLUG . '_proxy_';

	/**
	 * Response headers worth forwarding back to the dashboard.
	 *
	 * @var string[]
	 */
	private const FORWARDED_HEADERS = array( 'x-wp-total', 'x-wp-totalpages' );

	/**
	 * Per-prefix configuration, the single source of truth for every proxied endpoint group.
	 *
	 * The keys double as the security boundary: a request is only routed (and the blog token only
	 * forwarded) if its first path segment is a key here. The shared fields (`capability`,
	 * `writes`, `cache_bust`, `path`, `pattern`) are documented on
	 * {@see Proxy_Controller::__construct()}. Two more are the dashboard's own:
	 *  - `inject_user_email` (bool, optional) Add the local user's email to the forwarded write body
	 *                  as `user_email`. The blog token carries no user, so a WPCOM endpoint that
	 *                  attributes a submission to a person cannot resolve one on its own (it falls
	 *                  back to the site's first administrator). The only body rewrite this proxy
	 *                  does; see `inject_user_email()`.
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
	 *    (DB reads, the Notices class, …) are NOT proxied — they get their own routes outside
	 *    `proxy/`; do not add them here. `inject_user_email` is the one exception, and stays one:
	 *    a rewrite that cannot be expressed as a flag on this table belongs in its own route.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private const PREFIX_CONFIG = array(
		// Gated like WooCommerce's own Analytics screens, which shop managers can read;
		// woocommerce-analytics made the same move away from manage_options (WOOA7S-551).
		'analytics'                     => array( 'capability' => 'view_woocommerce_reports' ),
		'stats'                         => array(
			'capability' => 'view_stats',
			'writes'     => array( 'stats/referrers/spam/' ),
		),
		'wordads'                       => array( 'capability' => 'activate_wordads' ),
		'subscribers'                   => array( 'capability' => 'view_stats' ),
		'site-has-never-published-post' => array( 'capability' => 'view_stats' ),
		'jetpack-stats'                 => array(
			'capability'        => 'view_stats',
			'writes'            => array( 'jetpack-stats/user-feedback' ),
			'inject_user_email' => true,
		),
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
			// Only a post's public likers and approved replies — never post content
			// (the blog token could otherwise read private posts for any view_stats user).
			'pattern'         => '[0-9]+/(?:likes|replies)',
			// Both endpoints serve public data without credentials, while likes
			// rejects blog-token auth; forward the constrained group unsigned,
			// mirroring stats-admin's Odyssey proxy for likes.
			'unauthenticated' => true,
		),
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			self::SLUG . '/v1',
			self::PREFIX_CONFIG,
			self::CACHE_PREFIX,
			array( 'connection_slug' => self::SLUG )
		);
	}

	/**
	 * Hook the controller's routes onto rest_api_init, and its cache prefix onto the stats
	 * package's transient cleanup cron.
	 *
	 * @return void
	 */
	public static function register(): void {
		( new self() )->register_hooks();
	}

	/**
	 * Forward an `unauthenticated` group's read without signing; everything else goes through the
	 * package's blog-signed transport.
	 *
	 * @param WP_REST_Request      $request    Request object.
	 * @param string               $wpcom_path WPCOM path without the forwarded query string.
	 * @param array<string, mixed> $opts       Forwarding opts.
	 * @return array|WP_Error Raw HTTP response, or an error.
	 */
	protected function request( WP_REST_Request $request, string $wpcom_path, array $opts ) {
		if ( ! empty( $opts['config']['unauthenticated'] ) && 'GET' === strtoupper( $request->get_method() ) ) {
			return $this->request_unauthenticated( $request, $wpcom_path, (string) ( $opts['version'] ?? '2' ), (string) ( $opts['base'] ?? 'wpcom' ) );
		}

		return parent::request( $request, $wpcom_path, $opts );
	}

	/**
	 * Add the local user's email to the body of a write to an `inject_user_email` group.
	 *
	 * @param string               $body The incoming request body.
	 * @param array<string, mixed> $opts Forwarding opts.
	 * @return string
	 */
	protected function prepare_body( string $body, array $opts ): string {
		return $this->inject_user_email( $body, $opts['config'] ?? array() );
	}

	/**
	 * Keep only the response headers the dashboard needs (pagination totals).
	 *
	 * @param mixed $headers Response headers as returned by the HTTP API.
	 * @return array<string, string>
	 */
	protected function extract_forwarded_headers( $headers ): array {
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
	 * Forward a read to WPCOM without signing, for `unauthenticated` endpoint groups. Mirrors
	 * stats-admin's Odyssey proxy (`get_single_post_likes()`): the target endpoint rejects
	 * blog-token auth but serves public data to credential-less requests. Private posts/sites
	 * return WPCOM's own restricted error — the same limitation Odyssey has.
	 *
	 * Unsigned forwards need no tokens, only the blog id baked into the path, so they skip the
	 * connection gate entirely.
	 *
	 * @param WP_REST_Request $request    Request object.
	 * @param string          $wpcom_path WPCOM path without the forwarded query string.
	 * @param string          $version    WPCOM API version.
	 * @param string          $base       WPCOM API base (`rest` or `wpcom`).
	 * @return array|WP_Error Raw HTTP response, or an error.
	 */
	private function request_unauthenticated( WP_REST_Request $request, string $wpcom_path, string $version, string $base ) {
		// The path embeds the blog id; without one the request would target site 0.
		if ( ! (int) Jetpack_Options::get_option( 'id' ) ) {
			return new WP_Error(
				'no_connection',
				__( 'Please connect Jetpack to load your data.', 'jetpack-premium-analytics-pkg' ),
				array( 'status' => 403 )
			);
		}

		$api_base = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		if ( empty( $api_base ) ) {
			$api_base = 'https://public-api.wordpress.com';
		}

		$response = wp_remote_get(
			sprintf( '%s/%s/v%s%s', $api_base, $base, $version, $this->append_forwarded_params( $request, $wpcom_path ) ),
			array( 'timeout' => $this->api_timeout )
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error communicating with the data service.', 'jetpack-premium-analytics-pkg' ),
				array( 'status' => 500 )
			);
		}

		return $response;
	}

	/**
	 * Add the local user's email to a forwarded write body, for a group declaring
	 * `inject_user_email`.
	 *
	 * Mirrors what stats-admin's own `post_user_feedback()` does: the request is signed with the
	 * blog token, so WPCOM sees no user and would attribute the submission to whichever
	 * administrator it finds first. A body that is neither empty nor a JSON object is returned
	 * untouched rather than replaced, so a malformed request still fails at WPCOM's own validation.
	 *
	 * @param string               $body   The request body to forward.
	 * @param array<string, mixed> $config The matched prefix config.
	 * @return string
	 */
	private function inject_user_email( string $body, array $config ): string {
		if ( empty( $config['inject_user_email'] ) ) {
			return $body;
		}

		$email = wp_get_current_user()->user_email;
		if ( ! $email ) {
			return $body;
		}

		$decoded = '' === $body ? array() : json_decode( $body, true );
		if ( ! is_array( $decoded ) ) {
			return $body;
		}

		// A JSON list is not a param bag, and adding a string key would reshape it into an object.
		if ( array() !== $decoded && array_keys( $decoded ) === range( 0, count( $decoded ) - 1 ) ) {
			return $body;
		}

		$decoded['user_email'] = $email;

		return (string) wp_json_encode( $decoded, JSON_UNESCAPED_SLASHES );
	}
}
