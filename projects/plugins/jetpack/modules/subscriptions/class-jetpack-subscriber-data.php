<?php
/**
 * Shared subscriber counts and statistics.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Fetches subscriber data for subscription consumers.
 */
class Jetpack_Subscriber_Data {
	/**
	 * Preserve the public count envelope and the native WordPress.com cache.
	 *
	 * @return array
	 */
	public static function get_counts() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return array( 'value' => wpcom_fetch_subs_counts( true ) );
		}

		$cache_key  = 'wpcom_subscribers_totals';
		$subs_count = get_transient( $cache_key );
		if ( false === $subs_count || 'failed' === $subs_count['status'] ) {
			$xml = new Jetpack_IXR_Client();
			$xml->query( 'jetpack.fetchSubscriberCounts' );

			if ( $xml->isError() ) {
				$subs_count = array(
					'status'  => 'failed',
					'code'    => $xml->getErrorCode(),
					'message' => $xml->getErrorMessage(),
					'value'   => $subs_count['value'] ?? array(
						'total_subscribers' => 0,
						'email_subscribers' => 0,
						'social_followers'  => 0,
						'paid_subscribers'  => 0,
					),
				);
			} else {
				$subs_count = array(
					'status' => 'success',
					'value'  => $xml->getResponse(),
				);
			}
			set_transient( $cache_key, $subs_count, HOUR_IN_SECONDS );
		}
		return $subs_count;
	}

	/**
	 * Share counts and chart history between dashboard and ability requests.
	 *
	 * @return array|WP_Error
	 */
	public static function get_stats() {
		$cache_key = 'jetpack_newsletter_subscriber_stats_data';
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_connection_ready() ) {
			return new WP_Error(
				'jetpack_newsletter_not_connected',
				__( 'Subscriber stats are only available on Jetpack-connected sites. Connect Jetpack and retry.', 'jetpack' )
			);
		}

		$site_id = (int) Jetpack_Options::get_option( 'id' );
		if ( $site_id <= 0 ) {
			return new WP_Error(
				'jetpack_newsletter_not_connected',
				__( 'No Jetpack site ID is registered. Connect Jetpack and retry.', 'jetpack' )
			);
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/subscribers/stats', $site_id ),
			'2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'jetpack_newsletter_subscriber_stats_unavailable', $response->get_error_message() );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( 200 !== (int) wp_remote_retrieve_response_code( $response )
			|| ! is_array( $body ) || ! isset( $body['counts'] ) || ! is_array( $body['counts'] )
			|| ( isset( $body['aggregate'] ) && ! is_array( $body['aggregate'] ) )
		) {
			return new WP_Error(
				'jetpack_newsletter_subscriber_stats_unavailable',
				__( 'WordPress.com did not return subscriber stats. Retry shortly.', 'jetpack' )
			);
		}

		$stats = array(
			'counts'    => $body['counts'],
			'aggregate' => $body['aggregate'] ?? array(),
		);
		set_transient( $cache_key, $stats, HOUR_IN_SECONDS );
		return $stats;
	}
}
