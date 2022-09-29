<?php
/**
 * VideoPress Stats Endpoints
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_REST_Response;

/**
 * VideoPress stats rest api class
 */
class VideoPress_Rest_Api_V1_Stats {
	/**
	 * Initializes the endpoints
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( static::class, 'register_rest_endpoints' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'videopress/v1',
			'stats',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => static::class . '::get_stats',
				'permission_callback' => static::class . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks wether the user have permissions to see stats
	 *
	 * @return boolean
	 */
	public static function permissions_callback() {
		return current_user_can( 'read' ); // TODO: confirm this
	}

	/**
	 * Endpoint for getting the general VideoPress stats for the site.
	 *
	 * Returns the plays for all the videos, for today and since the beggining of times.
	 *
	 * @return WP_Rest_Response - The response object.
	 */
	public static function get_stats() {
		$today_plays = static::get_today_plays();

		if ( is_wp_error( $today_plays ) ) {
			// TODO: Improve status code.
			return rest_ensure_response( $today_plays );
		}

		$data = array(
			'plays' => array(
				'today' => $today_plays,
			),
		);

		return rest_ensure_response( $data );
	}

	/**
	 * Returns the counter of today's plays for all videos.
	 *
	 * @return int|WP_Error the total of plays for today, or WP_Error on failure.
	 */
	protected static function get_today_plays() {
		$error = new WP_Error(
			'videopress_stats_error',
			__( "Could not fetch today's stats from the service", 'jetpack-videopress-pkg' )
		);

		$blog_id = VideoPressToken::blog_id();

		$path = sprintf(
			'sites/%d/stats/video-plays',
			$blog_id
		);

		$response = Client::wpcom_json_api_request_as_blog( $path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) ) {
			return $error;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return $error;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( ! $data || ! isset( $data['days'] ) || count( $data['days'] ) === 0 ) {
			return $error;
		}

		/*
		 * The only result here is today's stats
		 */
		$today_stats = array_pop( $data['days'] );

		return $today_stats['total_plays'];
	}
}
