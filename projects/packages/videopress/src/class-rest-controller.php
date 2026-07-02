<?php
/**
 * The VideoPress REST Controller.
 *
 * Registers the `/jetpack/v4/videopress/*` routes backing the
 * modernized wp-build dashboard. Exposes blog-signed proxies to the
 * WPCOM `sites/{id}/stats/video-plays` endpoint (Overview screen's
 * KPI / trends / top-N cards, and — filtered client-side to one video —
 * the per-video analytics screen's KPIs and chart) and the WPCOM
 * `sites/{id}/stats/video/{post_id}` endpoint (that screen's "Posts
 * featuring this video" card, via its `pages[]` list).
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * REST routes for the modernized VideoPress admin UI.
 */
class Rest_Controller {

	/**
	 * REST namespace used by this package's modernization routes.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4/videopress';

	/**
	 * Hook the route registration on `rest_api_init`.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
	}

	/**
	 * Register the VideoPress REST routes.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/stats/video-plays',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_stats_video_plays' ),
				'permission_callback' => array( __CLASS__, 'permissions_callback' ),
				'args'                => self::stats_video_plays_args(),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/stats/video/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_stats_video' ),
				'permission_callback' => array( __CLASS__, 'permissions_callback' ),
				'args'                => self::stats_video_args(),
			)
		);
	}

	/**
	 * Query params accepted by the video-plays proxy. Forwarded verbatim
	 * to WPCOM after permission and shape validation; `complete_stats` is
	 * always forced to `true` (the only mode the Overview cares about)
	 * and is therefore not exposed as an incoming param.
	 *
	 * @return array
	 */
	private static function stats_video_plays_args() {
		return array(
			'period'     => array(
				'description' => __( 'Period unit: day, week, month, or year.', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
				'enum'        => array( 'day', 'week', 'month', 'year' ),
			),
			'num'        => array(
				'description' => __( 'Number of periods to include.', 'jetpack-videopress-pkg' ),
				'type'        => 'integer',
				'minimum'     => 1,
				'maximum'     => 365,
			),
			'date'       => array(
				'description'       => __( 'Most recent day to include in results (YYYY-MM-DD).', 'jetpack-videopress-pkg' ),
				'type'              => 'string',
				'format'            => 'date',
				'validate_callback' => array( __CLASS__, 'validate_date_arg' ),
			),
			'start_date' => array(
				'description'       => __( 'Starting date for range queries (YYYY-MM-DD).', 'jetpack-videopress-pkg' ),
				'type'              => 'string',
				'format'            => 'date',
				'validate_callback' => array( __CLASS__, 'validate_date_arg' ),
			),
		);
	}

	/**
	 * Query params accepted by the per-video stats proxy. `post_id` is
	 * captured from the route path; the rest are forwarded verbatim to
	 * WPCOM after permission and shape validation.
	 *
	 * @return array
	 */
	private static function stats_video_args() {
		return array(
			'post_id'  => array(
				'description' => __( 'ID of the video to fetch stats for.', 'jetpack-videopress-pkg' ),
				'type'        => 'integer',
				'required'    => true,
			),
			'period'   => array(
				'description' => __( 'Period unit: day, week, month, or year.', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
				'enum'        => array( 'day', 'week', 'month', 'year' ),
				'default'     => 'day',
			),
			'num'      => array(
				'description' => __( 'Number of periods to include.', 'jetpack-videopress-pkg' ),
				'type'        => 'integer',
				'minimum'     => 1,
				'maximum'     => 365,
				'default'     => 30,
			),
			'end_date' => array(
				'description'       => __( 'Most recent day to include in results (YYYY-MM-DD).', 'jetpack-videopress-pkg' ),
				'type'              => 'string',
				'format'            => 'date',
				'validate_callback' => array( __CLASS__, 'validate_date_arg' ),
			),
		);
	}

	/**
	 * Permission callback. Admin-gated. The upstream call is blog-signed,
	 * matching the existing `Stats::fetch_video_plays` path; no user-level
	 * WPCOM connection is required.
	 *
	 * @return bool
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Validate a YYYY-MM-DD date arg. Core's schema validation does not
	 * enforce `format: date` (`rest_validate_value_from_schema()` only
	 * checks date-time, email, ip, uuid, and hex-color), so without this
	 * any string would pass validation and be forwarded to WPCOM verbatim.
	 *
	 * @param mixed $value Incoming param value.
	 * @return bool Whether the value is a valid calendar date.
	 */
	public static function validate_date_arg( $value ) {
		if ( ! is_string( $value ) || ! preg_match( '/^(\d{4})-(\d{2})-(\d{2})$/', $value, $matches ) ) {
			return false;
		}
		return checkdate( (int) $matches[2], (int) $matches[3], (int) $matches[1] );
	}

	/**
	 * Proxy the video-plays stats endpoint.
	 *
	 * Forwards the whitelisted query params to WPCOM (REST v1.1, blog-signed
	 * — matching the existing `Stats::fetch_video_plays` path) and forces
	 * `complete_stats=true`. In complete-stats mode, each day entry carries
	 * `total.views`, `total.impressions`, and `total.watch_time` (in hours)
	 * plus a per-video `data[]` array whose entries have `post_id`, `title`,
	 * `views`, `impressions`, `watch_time` (hours), and `retention_rate`.
	 * The `plays` field is NOT returned in complete-stats mode.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return mixed Decoded JSON response from WPCOM, or WP_Error on failure.
	 */
	public static function get_stats_video_plays( WP_REST_Request $request ) {
		$blog_id = self::get_connected_blog_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$params = array_merge(
			array( 'complete_stats' => 'true' ),
			self::forward_request_params( $request, array_keys( self::stats_video_plays_args() ) )
		);

		return self::proxy_wpcom_get(
			sprintf(
				'sites/%d/stats/video-plays?%s',
				$blog_id,
				http_build_query( $params )
			)
		);
	}

	/**
	 * Proxy the per-video stats endpoint backing the analytics screen's
	 * "Posts featuring this video" card.
	 *
	 * Forwards the whitelisted query params to WPCOM (REST v1.1, blog-signed
	 * — same path as `get_stats_video_plays`) for a single video. The
	 * upstream response is returned as a tolerant passthrough — typically
	 * `{ data: [ [ date, plays ], ... ], pages: [ url, ... ] }` — with no
	 * reshaping, so new upstream fields flow through untouched. The client
	 * consumes `pages[]`; the screen's chart derives from the video-plays
	 * proxy above instead.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return mixed Decoded JSON response from WPCOM, or WP_Error on failure.
	 */
	public static function get_stats_video( WP_REST_Request $request ) {
		$blog_id = self::get_connected_blog_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$params = self::forward_request_params( $request, array( 'period', 'num', 'end_date' ) );

		return self::proxy_wpcom_get(
			sprintf(
				'sites/%d/stats/video/%d?%s',
				$blog_id,
				(int) $request->get_param( 'post_id' ),
				http_build_query( $params )
			)
		);
	}

	/**
	 * The connected WPCOM blog ID, or a 400 WP_Error when the site has no
	 * blog-level connection (the proxies are blog-signed, so there is
	 * nothing to sign with).
	 *
	 * @return int|WP_Error Blog ID, or WP_Error when not connected.
	 */
	private static function get_connected_blog_id() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'videopress_stats_not_connected',
				esc_html__( 'This site is not connected to WordPress.com.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}
		return $blog_id;
	}

	/**
	 * Collect the given request params for forwarding, skipping any that
	 * are unset or empty. Values have already passed the route's arg
	 * validation by the time callbacks run.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @param string[]        $keys    Param names to forward.
	 * @return array Param name → value, ready for `http_build_query()`.
	 */
	private static function forward_request_params( WP_REST_Request $request, array $keys ) {
		$params = array();
		foreach ( $keys as $key ) {
			$value = $request->get_param( $key );
			if ( $value !== null && $value !== '' ) {
				$params[ $key ] = $value;
			}
		}
		return $params;
	}

	/**
	 * Perform a blog-signed WPCOM GET and normalize failures: transport
	 * errors become a 500 WP_Error, non-200 upstream statuses surface the
	 * upstream message (when present) under the upstream status code, and
	 * 200 bodies pass through decoded.
	 *
	 * @param string $path WPCOM REST v1.1 path, including query string.
	 * @return mixed Decoded JSON response from WPCOM, or WP_Error on failure.
	 */
	private static function proxy_wpcom_get( $path ) {
		$response = Client::wpcom_json_api_request_as_blog( $path );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'videopress_stats_request_failed',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status ) {
			$message = is_array( $body ) && isset( $body['message'] )
				? (string) $body['message']
				: esc_html__( 'Unable to fetch VideoPress stats.', 'jetpack-videopress-pkg' );
			return new WP_Error(
				'videopress_stats_request_failed',
				$message,
				array( 'status' => $status ? $status : 500 )
			);
		}

		return rest_ensure_response( $body );
	}
}
