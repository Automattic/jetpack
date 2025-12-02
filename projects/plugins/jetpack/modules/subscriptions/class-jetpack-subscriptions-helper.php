<?php
/**
 * Subscriptions Helper
 *
 * This class provides helper functions for the Subscriptions module.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Class Jetpack_Subscriptions_Helper
 */
class Jetpack_Subscriptions_Helper {
	/**
	 * Fetch subscriber statistics from WordPress.com API.
	 * Results are cached for 5 minutes to reduce API requests.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $site_id The site ID to fetch stats for.
	 * @return array|WP_Error Associative array with subscriber stats on success, WP_Error on failure.
	 *                        Returns array with keys: 'email_subscribers', 'paid_subscribers', 'all_subscribers', 'aggregate'.
	 */
	public static function fetch_subscriber_stats( $site_id ) {
		if ( ! $site_id ) {
			return new WP_Error( 'invalid_site_id', __( 'Invalid site ID provided.', 'jetpack' ) );
		}

		// Check cache first.
		$cache_key = 'jetpack_subscriber_stats_' . $site_id;
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$stats_path = sprintf( '/sites/%d/subscribers/stats', $site_id );
		$response   = Client::wpcom_json_api_request_as_blog(
			$stats_path,
			'2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$stats_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $stats_code ) {
			return new WP_Error(
				'http_error',
				sprintf(
					/* translators: %d is the HTTP response code */
					__( 'HTTP error %d when fetching subscriber stats.', 'jetpack' ),
					$stats_code
				),
				array( 'status' => $stats_code )
			);
		}

		$subscriber_counts = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $subscriber_counts ) ) {
			return new WP_Error( 'invalid_response', __( 'Invalid response format from API.', 'jetpack' ) );
		}

		$stats = array(
			'email_subscribers' => 0,
			'paid_subscribers'  => 0,
			'all_subscribers'   => 0,
			'aggregate'         => array(),
		);

		if ( isset( $subscriber_counts['counts']['email_subscribers'] ) ) {
			$stats['email_subscribers'] = (int) $subscriber_counts['counts']['email_subscribers'];
		}

		if ( isset( $subscriber_counts['counts']['paid_subscribers'] ) ) {
			$stats['paid_subscribers'] = (int) $subscriber_counts['counts']['paid_subscribers'];
		}

		if ( isset( $subscriber_counts['counts']['all_subscribers'] ) ) {
			$stats['all_subscribers'] = (int) $subscriber_counts['counts']['all_subscribers'];
		}

		if ( isset( $subscriber_counts['aggregate'] ) && is_array( $subscriber_counts['aggregate'] ) ) {
			$stats['aggregate'] = $subscriber_counts['aggregate'];
		}

		// Cache successful responses for 5 minutes.
		set_transient( $cache_key, $stats, 5 * MINUTE_IN_SECONDS );

		return $stats;
	}

	/**
	 * Fetch subscribers from WordPress.com API.
	 * Results are cached for 5 minutes to reduce API requests.
	 *
	 * @since $$next-version$$
	 *
	 * @param int   $site_id The site ID to fetch subscribers for.
	 * @param array $query_params Optional. Array of query parameters to add to the request.
	 *                            Common params: 'page', 'per_page', 'filter'.
	 * @return array|WP_Error Associative array with subscriber data on success, WP_Error on failure.
	 */
	public static function fetch_subscribers( $site_id, $query_params = array() ) {
		if ( ! $site_id ) {
			return new WP_Error( 'invalid_site_id', __( 'Invalid site ID provided.', 'jetpack' ) );
		}

		// Build cache key based on site_id and query parameters.
		// Sort keys to ensure deterministic cache keys regardless of parameter order.
		$sorted_params = $query_params;
		ksort( $sorted_params );
		$cache_key = 'jetpack_subscribers_' . $site_id . '_' . md5( wp_json_encode( $sorted_params ) );

		// Check cache first.
		$cached = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$api_path = sprintf( '/sites/%d/subscribers/', $site_id );

		// Build query string from parameters.
		if ( ! empty( $query_params ) ) {
			$api_path = add_query_arg( $query_params, $api_path );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			$api_path,
			'2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				'http_error',
				sprintf(
					/* translators: %d is the HTTP response code */
					__( 'HTTP error %d when fetching subscribers.', 'jetpack' ),
					$response_code
				),
				array( 'status' => $response_code )
			);
		}

		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $response_body ) ) {
			return new WP_Error( 'invalid_response', __( 'Invalid response format from API.', 'jetpack' ) );
		}

		// Cache successful responses for 5 minutes.
		set_transient( $cache_key, $response_body, 5 * MINUTE_IN_SECONDS );

		return $response_body;
	}
}
