<?php
/**
 * Google Drive helper.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Visitor;

/**
 * Class Jetpack_Google_Drive_Helper
 */
class Jetpack_Google_Drive_Helper {

	public static function get_connection() {
		// instagram uses this one:
		// $path     = sprintf( '/sites/%d/external-services', $site_id );

		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// check for gdrive helper class, call synchronously on .com
		}
		error_log( $site_id );
		// $request_path  = '/me/connections';
		$request_path  = sprintf( '/sites/%d/google-drive/sheets', $site_id );
		$wpcom_request = Client::wpcom_json_api_request_as_user(
			$request_path,
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		error_log( print_r( $wpcom_request, true ) );

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}
		$body = json_decode( wp_remote_retrieve_body( $wpcom_request ), true );

		if ( empty( $body['connections'] ) ) {
			return null;
		}

		$google_drive_connection = array_filter(
			$body['connections'],
			function ( $connection ) {
				return $connection['service'] === 'google-drive';
			}
		);

		if ( empty( $google_drive_connection ) ) {
			return null;
		}

		// array_filter always returns an array
		return array_pop( $google_drive_connection );
	}

	/**
	 * Check whether an Instagram access token is valid,
	 * or has been permanently deleted elsewhere.
	 *
	 * @param  int $access_token_id The ID of the external access token for Instagram.
	 * @return bool
	 */
	// public static function is_instagram_access_token_valid( $access_token_id ) {
	// 	$site_id = self::get_site_id();
	// 	if ( is_wp_error( $site_id ) ) {
	// 		return false;
	// 	}

	// 	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	// 		if ( ! class_exists( 'WPCOM_Instagram_Gallery_Helper' ) ) {
	// 			\require_lib( 'instagram-gallery-helper' );
	// 		}
	// 		$token = WPCOM_Instagram_Gallery_Helper::get_token( $access_token_id );
	// 		return ! is_wp_error( $token );
	// 	}

	// 	$response = Client::wpcom_json_api_request_as_blog(
	// 		sprintf( '/sites/%d/instagram/%d/check-token', $site_id, $access_token_id ),
	// 		2,
	// 		array( 'headers' => array( 'content-type' => 'application/json' ) ),
	// 		null,
	// 		'wpcom'
	// 	);
	// 	return 200 === wp_remote_retrieve_response_code( $response );
	// }

	/**
	 * Get the Instagram Gallery.
	 *
	 * @param  int $access_token_id The ID of the external access token for Instagram.
	 * @param  int $count           The number of Instagram posts to fetch.
	 * @return mixed
	 */
	// public static function get_instagram_gallery( $access_token_id, $count ) {
	// 	$site_id = self::get_site_id();
	// 	if ( is_wp_error( $site_id ) ) {
	// 		return $site_id;
	// 	}

	// 	$transient_key = self::TRANSIENT_KEY_PREFIX . $access_token_id;

	// 	// Check if the connection exists before trying to retrieve the cached gallery.
	// 	if ( ! self::is_instagram_access_token_valid( $access_token_id ) ) {
	// 		delete_transient( $transient_key );
	// 		return new WP_Error(
	// 			'instagram_connection_unavailable',
	// 			__( 'The requested Instagram connection is not available anymore.', 'jetpack' ),
	// 			403
	// 		);
	// 	}

	// 	$cached_gallery = get_transient( $transient_key );
	// 	if ( $cached_gallery ) {
	// 		$decoded_cached_gallery = json_decode( $cached_gallery );
	// 		// `images` can be an array of images or a string 'ERROR'.
	// 		$cached_count = is_array( $decoded_cached_gallery->images ) ? count( $decoded_cached_gallery->images ) : 0;
	// 		if ( $cached_count >= $count ) {
	// 			return $decoded_cached_gallery;
	// 		}
	// 	}

	// 	$response = Client::wpcom_json_api_request_as_blog(
	// 		sprintf( '/sites/%d/instagram/%d?count=%d', $site_id, $access_token_id, $count ),
	// 		2,
	// 		array( 'headers' => array( 'content-type' => 'application/json' ) ),
	// 		null,
	// 		'wpcom'
	// 	);
	// 	if ( is_wp_error( $response ) ) {
	// 		return $response;
	// 	}

	// 	$gallery = wp_remote_retrieve_body( $response );
	// 	set_transient( $transient_key, $gallery, HOUR_IN_SECONDS );
	// 	return json_decode( $gallery );
	// }

	/**
	 * Get the WPCOM or self-hosted site ID.
	 *
	 * @return mixed
	 */
	public static function get_site_id() {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		return (int) $site_id;
	}
}
