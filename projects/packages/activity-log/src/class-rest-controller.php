<?php
/**
 * The Activity Log REST Controller.
 *
 * Registers the `/jetpack/v4/activity-log/*` routes backing the admin
 * UI. Each route is a thin proxy to the corresponding WPCOM v2
 * endpoint, authenticated with the site's blog token.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Visitor;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use function current_user_can;
use function delete_site_transient;
use function esc_html__;
use function get_site_transient;
use function http_build_query;
use function is_wp_error;
use function json_decode;
use function register_rest_route;
use function rest_ensure_response;
use function set_site_transient;
use function wp_remote_retrieve_body;
use function wp_remote_retrieve_response_code;

/**
 * REST routes for the Activity Log UI.
 */
class REST_Controller {

	/**
	 * REST namespace used by this package.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * Max items returned per request on the free tier. Matches the "20 most
	 * recent events" copy used by Calypso's upsell callout.
	 *
	 * @var int
	 */
	const FREE_TIER_ITEM_CAP = 20;

	/**
	 * Site-transient TTL for the has-access capability check.
	 *
	 * @var int
	 */
	const CAPABILITY_CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Transient key prefix for the per-blog access cache.
	 *
	 * @var string
	 */
	const CAPABILITY_CACHE_KEY = 'jetpack_activity_log_has_access_';

	/**
	 * Query params accepted by the list endpoint. Shape matches Calypso's
	 * ActivityLogParams so the ported UI can forward its filter state
	 * verbatim.
	 *
	 * @return array
	 */
	private static function list_args() {
		return array(
			'number'      => array(
				'description' => __( 'Number of items to return per page.', 'jetpack-activity-log' ),
				'type'        => 'integer',
				'minimum'     => 1,
				'maximum'     => 1000,
			),
			'page'        => array(
				'description' => __( '1-indexed page number.', 'jetpack-activity-log' ),
				'type'        => 'integer',
				'minimum'     => 1,
			),
			'sort_order'  => array(
				'description' => __( 'Sort direction.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'enum'        => array( 'asc', 'desc' ),
			),
			'after'       => array(
				'description' => __( 'ISO 8601 lower bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'before'      => array(
				'description' => __( 'ISO 8601 upper bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'group'       => array(
				'description' => __( 'Only return events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'not_group'   => array(
				'description' => __( 'Exclude events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'text_search' => array(
				'description' => __( 'Full-text search string.', 'jetpack-activity-log' ),
				'type'        => 'string',
			),
		);
	}

	/**
	 * Query params accepted by the group-counts endpoint. A subset of the
	 * list params — no pagination or sort, no text search.
	 *
	 * @return array
	 */
	private static function group_counts_args() {
		return array(
			'number'    => array(
				'description' => __( 'Cap on the number of events considered when counting groups.', 'jetpack-activity-log' ),
				'type'        => 'integer',
				'minimum'     => 1,
				'maximum'     => 1000,
			),
			'after'     => array(
				'description' => __( 'ISO 8601 lower bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'before'    => array(
				'description' => __( 'ISO 8601 upper bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'group'     => array(
				'description' => __( 'Only count events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'not_group' => array(
				'description' => __( 'Exclude events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
		);
	}

	/**
	 * Register the Activity Log REST routes.
	 *
	 * Hooked on `rest_api_init` by {@see Jetpack_Activity_Log::initialize()}.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/activity-log',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_activity_log' ),
				'permission_callback' => array( __CLASS__, 'permissions_callback' ),
				'args'                => self::list_args(),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/activity-log/count/group',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_activity_log_group_counts' ),
				'permission_callback' => array( __CLASS__, 'permissions_callback' ),
				'args'                => self::group_counts_args(),
			)
		);
	}

	/**
	 * Permission callback. Mirrors the menu gating — any admin on a
	 * non-multisite install with a user-level WPCOM connection can read
	 * the log. A user-level connection is required because the upstream
	 * WPCOM endpoint is user-gated (it needs to identify *which* admin
	 * is asking); signing as the blog gets rejected with "Only
	 * Administrators can query information about the current site."
	 *
	 * @return bool|WP_Error
	 */
	public static function permissions_callback() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error(
				'activity_log_user_not_connected',
				esc_html__( 'Your WordPress.com account is not connected to this site. Connect it to use the Activity Log.', 'jetpack-activity-log' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Whether the site's current plan unlocks the full activity log.
	 *
	 * Reads the WPCOM `/sites/{id}/rewind` state endpoint (same signal
	 * `Jetpack_Backup::has_backup_plan()` uses) and caches the boolean for
	 * {@see self::CAPABILITY_CACHE_TTL} seconds in a site transient so the
	 * list endpoint doesn't pay the round-trip on every pagination page.
	 * The cache is per-blog (fine for multisite) and keyed on `blog_id`.
	 *
	 * @return bool True when the site has a paid Backup-enabled plan.
	 */
	public static function has_activity_logs_access() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return false;
		}

		$cache_key = self::CAPABILITY_CACHE_KEY . $blog_id;
		$cached    = get_site_transient( $cache_key );
		if ( false !== $cached ) {
			return 'yes' === $cached;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/rewind?force=wpcom', $blog_id ),
			'2',
			array( 'timeout' => 2 ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			// Fail closed: assume no access if we can't reach WPCOM. Cache for
			// a short window to avoid hammering the endpoint on every call.
			set_site_transient( $cache_key, 'no', 10 );
			return false;
		}

		$body   = json_decode( wp_remote_retrieve_body( $response ) );
		$state  = is_object( $body ) && isset( $body->state ) ? (string) $body->state : '';
		$has_it = $state !== '' && $state !== 'unavailable';
		set_site_transient( $cache_key, $has_it ? 'yes' : 'no', self::CAPABILITY_CACHE_TTL );
		return $has_it;
	}

	/**
	 * Clear the cached has-access flag. Exposed so front-end flows that
	 * know the plan just changed (e.g. a successful checkout redirect) can
	 * force a refresh on the next request.
	 *
	 * @return void
	 */
	public static function clear_access_cache() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( $blog_id ) {
			delete_site_transient( self::CAPABILITY_CACHE_KEY . $blog_id );
		}
	}

	/**
	 * Free-tier params that survive the filter strip in
	 * {@see self::get_activity_log()}. Anything outside this list is
	 * nulled out before the request reaches WPCOM.
	 *
	 * @var string[]
	 */
	const FREE_TIER_ALLOWED_PARAMS = array( 'number', 'page', 'sort_order' );

	/**
	 * Proxy the paginated activity list.
	 *
	 * Enforces the free-tier boundary server-side. When the site doesn't
	 * have access:
	 *
	 *   1. `number` is clamped to {@see self::FREE_TIER_ITEM_CAP}.
	 *   2. `page` is forced to 1.
	 *   3. All filter inputs (`after`, `before`, `group`, `not_group`,
	 *      `text_search`) are dropped.
	 *
	 * Together these mean a client-side bypass (DevTools, direct
	 * `wp.apiFetch`) is bounded to "the 20 most recent events overall" —
	 * the same dataset the locked-down UI surfaces. Without (3),
	 * date-walking via `before` would let a free-tier caller page through
	 * the entire history 20 rows at a time.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return mixed
	 */
	public static function get_activity_log( WP_REST_Request $request ) {
		if ( ! self::has_activity_logs_access() ) {
			// Mutating the request in-place is deliberate: any
			// downstream `rest_request_*` filter sees the clamped
			// values, not the caller's originals. For a security
			// clamp that's the right side of the trade — no filter
			// can undo the limit.
			$requested = (int) $request->get_param( 'number' );
			$request->set_param(
				'number',
				$requested > 0 ? min( $requested, self::FREE_TIER_ITEM_CAP ) : self::FREE_TIER_ITEM_CAP
			);
			$request->set_param( 'page', 1 );

			foreach ( array_keys( self::list_args() ) as $key ) {
				if ( ! in_array( $key, self::FREE_TIER_ALLOWED_PARAMS, true ) ) {
					$request->set_param( $key, null );
				}
			}
		}
		return self::proxy_get( '/activity', $request, array_keys( self::list_args() ) );
	}

	/**
	 * Proxy the group-counts endpoint.
	 *
	 * Deliberately not tier-clamped — the free-tier list clamp
	 * (`number` → 20 / `page` → 1) is the security boundary; the group
	 * counts are cosmetic metadata that powers the filter dropdown. A
	 * stable, full-history count keeps the dropdown from flickering as
	 * users type in the search field, matching Calypso's behavior at
	 * `wp-calypso:client/dashboard/sites/logs-activity/dataviews/
	 * index.tsx:100-102`.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return mixed
	 */
	public static function get_activity_log_group_counts( WP_REST_Request $request ) {
		return self::proxy_get( '/activity/count/group', $request, array_keys( self::group_counts_args() ) );
	}

	/**
	 * Shared helper: forward whitelisted query params from $request to the
	 * equivalent WPCOM v2 path under `/sites/{blog_id}`.
	 *
	 * @param string          $wpcom_path    Path relative to the site, starting with "/".
	 * @param WP_REST_Request $request       Incoming request.
	 * @param array           $allowed_keys  Params to forward. Any unset keys are dropped.
	 * @return mixed Decoded JSON response from WPCOM, or WP_Error on failure.
	 */
	private static function proxy_get( $wpcom_path, WP_REST_Request $request, array $allowed_keys ) {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'activity_log_not_connected',
				esc_html__( 'This site is not connected to WordPress.com.', 'jetpack-activity-log' ),
				array( 'status' => 400 )
			);
		}

		$params = array();
		foreach ( $allowed_keys as $key ) {
			$value = $request->get_param( $key );
			if ( $value !== null ) {
				$params[ $key ] = $value;
			}
		}

		$path = sprintf( '/sites/%d%s', (int) $blog_id, $wpcom_path );
		if ( ! empty( $params ) ) {
			$path .= '?' . http_build_query( $params );
		}

		// Sign as the current user, not the blog: the upstream /sites/{id}/activity
		// endpoint checks that a specific admin is asking. Forward the visitor IP
		// so WPCOM logs match the existing /jetpack/v4/site/activity proxy.
		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'activity_log_request_failed',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status ) {
			return new WP_Error(
				'activity_log_request_failed',
				isset( $body['message'] ) ? (string) $body['message'] : esc_html__( 'Unable to fetch activity log.', 'jetpack-activity-log' ),
				array( 'status' => $status ? $status : 500 )
			);
		}

		return rest_ensure_response( $body );
	}
}
