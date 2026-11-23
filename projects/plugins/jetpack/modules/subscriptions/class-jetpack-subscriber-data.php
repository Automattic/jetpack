<?php
/**
 * Shared subscriber counts and statistics.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Fetches subscriber data for subscription consumers.
 */
class Jetpack_Subscriber_Data {
	/**
	 * Get cached counts or statistics, or fresh user-authenticated totals.
	 *
	 * @param string $kind Counts or stats.
	 * @param bool   $force_refresh Bypass the cache.
	 * @param bool   $as_user Fetch counts as the current user without reading or writing the cache.
	 * @return array|WP_Error|null
	 */
	public static function get( $kind = 'counts', $force_refresh = false, $as_user = false ) {
		switch ( $kind ) {
			case 'counts':
				return $as_user ? self::get_user_totals() : self::get_counts( $force_refresh );
			case 'stats':
				return self::get_stats( $force_refresh );
			default:
				return new WP_Error( 'jetpack_subscriber_data_invalid_kind', __( 'Unknown subscriber data kind.', 'jetpack' ) );
		}
	}

	/**
	 * Preserve the public count envelope and the native WordPress.com cache.
	 *
	 * @param bool $force_refresh Bypass the cache.
	 * @return array
	 */
	private static function get_counts( $force_refresh ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return array( 'value' => wpcom_fetch_subs_counts( true ) );
		}

		$cache_key  = 'wpcom_subscribers_totals';
		$subs_count = get_transient( $cache_key );
		if ( $force_refresh || false === $subs_count || 'failed' === $subs_count['status'] ) {
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
	 * @param bool $force_refresh Bypass the cache.
	 * @return array|WP_Error
	 */
	private static function get_stats( $force_refresh ) {
		$cache_key = 'jetpack_newsletter_subscriber_stats_data';
		$cached    = get_transient( $cache_key );
		if ( ! $force_refresh && is_array( $cached ) ) {
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
			|| ! is_numeric( $body['counts']['all_subscribers'] ?? null )
			|| ! is_numeric( $body['counts']['email_subscribers'] ?? null )
			|| ! is_numeric( $body['counts']['paid_subscribers'] ?? null )
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

	/**
	 * Keep subscriber-management totals fresh after mutations.
	 *
	 * @return array|WP_Error|null
	 */
	private static function get_user_totals() {
		$blog_id = Connection_Manager::get_site_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/subscribers/counts', (int) $blog_id ),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( $status >= 400 ) {
			return new WP_Error(
				'subscribers_totals_failed',
				is_array( $body ) && isset( $body['message'] ) ? $body['message'] : __( 'Could not fetch subscriber totals.', 'jetpack' ),
				array( 'status' => $status )
			);
		}
		return $body;
	}
}
