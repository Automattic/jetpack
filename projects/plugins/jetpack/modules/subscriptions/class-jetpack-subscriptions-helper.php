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

		return $stats;
	}
}
