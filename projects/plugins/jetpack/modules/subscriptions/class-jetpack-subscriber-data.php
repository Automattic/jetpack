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
	 * Transient key for counts, separate from the old cache's hour-long failures.
	 */
	const COUNTS_CACHE_KEY = 'jetpack_subscriber_counts';

	/**
	 * Preserve the public count envelope and the native WordPress.com cache.
	 *
	 * @return array
	 */
	public static function get_counts() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return array( 'value' => wpcom_fetch_subs_counts( true ) );
		}

		$subs_count = get_transient( self::COUNTS_CACHE_KEY );
		if ( false === $subs_count ) {
			$xml = new Jetpack_IXR_Client();
			$xml->query( 'jetpack.fetchSubscriberCounts' );
			$is_error = $xml->isError();
			$value    = $is_error ? null : $xml->getResponse();

			if ( ! is_array( $value ) || ! isset( $value['total_subscribers'] ) || ! isset( $value['social_followers'] ) ) {
				$subs_count = array(
					'status'  => 'failed',
					'code'    => $is_error ? $xml->getErrorCode() : 'invalid_response',
					'message' => $is_error ? $xml->getErrorMessage() : '',
					'value'   => array(
						'total_subscribers' => 0,
						'email_subscribers' => 0,
						'social_followers'  => 0,
						'paid_subscribers'  => 0,
					),
				);
			} else {
				$subs_count = array(
					'status' => 'success',
					'value'  => $value,
				);
			}
			$ttl = 'failed' === $subs_count['status'] ? 5 * MINUTE_IN_SECONDS : HOUR_IN_SECONDS;
			set_transient( self::COUNTS_CACHE_KEY, $subs_count, $ttl );
		}
		return $subs_count;
	}

	/**
	 * Share counts and chart history between dashboard and ability requests.
	 *
	 * @return array|WP_Error
	 */
	public static function get_stats() {
		// WordPress.com answers in-process from its own cache, which it clears when subscribers change.
		$use_cache = ! ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$cache_key = 'jetpack_newsletter_subscriber_stats_data';
		$cached    = $use_cache ? get_transient( $cache_key ) : false;
		if ( is_array( $cached ) ) {
			return isset( $cached['error'] )
				? new WP_Error( 'jetpack_newsletter_subscriber_stats_unavailable', $cached['error'] )
				: $cached;
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

		$error = null;
		$body  = null;
		if ( is_wp_error( $response ) ) {
			$error = $response->get_error_message();
		} else {
			$body = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( 200 !== (int) wp_remote_retrieve_response_code( $response )
				|| ! is_array( $body ) || ! isset( $body['counts'] ) || ! is_array( $body['counts'] )
				|| ( isset( $body['aggregate'] ) && ! is_array( $body['aggregate'] ) )
			) {
				$error = __( 'WordPress.com did not return subscriber stats. Retry shortly.', 'jetpack' );
			}
		}

		if ( null !== $error ) {
			if ( $use_cache ) {
				set_transient( $cache_key, array( 'error' => $error ), 5 * MINUTE_IN_SECONDS );
			}
			return new WP_Error( 'jetpack_newsletter_subscriber_stats_unavailable', $error );
		}

		$stats = array(
			'counts'    => $body['counts'],
			'aggregate' => $body['aggregate'] ?? array(),
		);
		if ( $use_cache ) {
			set_transient( $cache_key, $stats, HOUR_IN_SECONDS );
		}
		return $stats;
	}
}
