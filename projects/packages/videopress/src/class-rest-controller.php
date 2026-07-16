<?php
/**
 * The VideoPress REST Controller.
 *
 * Registers the `/jetpack/v4/videopress/*` routes backing the
 * modernized wp-build dashboard. Currently exposes one route — a
 * user-signed proxy to the WPCOM `sites/{id}/stats/video-plays`
 * endpoint — needed by the Overview screen's KPI / trends / top-N
 * cards.
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
	}

	/**
	 * Query params accepted by the video-plays proxy. Forwarded verbatim
	 * to WPCOM after permission and shape validation. `complete_stats` and
	 * `check_stats_module` are always forced by the callback and are
	 * therefore not exposed as incoming params.
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
				'description' => __( 'Most recent day to include in results (YYYY-MM-DD).', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
				'format'      => 'date',
			),
			'start_date' => array(
				'description' => __( 'Starting date for range queries (YYYY-MM-DD).', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
				'format'      => 'date',
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
	 * Proxy the video-plays stats endpoint.
	 *
	 * Forwards the allowed query params to WPCOM (REST v1.1, blog-signed
	 * — matching the existing `Stats::fetch_video_plays` path) and forces
	 * `complete_stats=true`. `check_stats_module=false` is also forced so the
	 * report loads for standalone VideoPress sites without the Jetpack Stats
	 * module active, matching `Stats::fetch_video_plays`. In complete-stats
	 * mode, each day entry carries
	 * `total.views`, `total.impressions`, and `total.watch_time` (in hours)
	 * plus a per-video `data[]` array whose entries have `post_id`, `title`,
	 * `views`, `impressions`, `watch_time` (hours), and `retention_rate`.
	 * The `plays` field is NOT returned in complete-stats mode.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return mixed Decoded JSON response from WPCOM, or WP_Error on failure.
	 */
	public static function get_stats_video_plays( WP_REST_Request $request ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'videopress_stats_not_connected',
				esc_html__( 'This site is not connected to WordPress.com.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$params = array(
			'complete_stats'     => 'true',
			'check_stats_module' => 'false',
		);
		foreach ( array_keys( self::stats_video_plays_args() ) as $key ) {
			$value = $request->get_param( $key );
			if ( $value !== null && $value !== '' ) {
				$params[ $key ] = $value;
			}
		}

		$path     = sprintf(
			'sites/%d/stats/video-plays?%s',
			$blog_id,
			http_build_query( $params )
		);
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
