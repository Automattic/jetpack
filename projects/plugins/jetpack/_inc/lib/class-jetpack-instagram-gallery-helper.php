<?php
/**
 * Instagram Gallery block and API helper.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

/**
 * Class Jetpack_Instagram_Gallery_Helper
 */
class Jetpack_Instagram_Gallery_Helper {
	const TRANSIENT_KEY_PREFIX = 'jetpack_instagram_gallery_block_';

	/**
	 * Check whether an Instagram access token is valid,
	 * or has been permanently deleted elsewhere.
	 *
	 * @param  int $access_token_id The ID of the external access token for Instagram.
	 * @return bool
	 */
	public static function is_instagram_access_token_valid( $access_token_id ) {
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Instagram_Gallery_Helper' ) ) {
				\require_lib( 'instagram-gallery-helper' );
			}
			$token = WPCOM_Instagram_Gallery_Helper::get_token( $access_token_id );
			return ! is_wp_error( $token );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/instagram/%d/check-token', $site_id, $access_token_id ),
			2,
			array( 'headers' => array( 'content-type' => 'application/json' ) ),
			null,
			'wpcom'
		);
		return 200 === wp_remote_retrieve_response_code( $response );
	}

	/**
	 * Get the Instagram Gallery.
	 *
	 * @param  int $access_token_id The ID of the external access token for Instagram.
	 * @param  int $count           The number of Instagram posts to fetch.
	 * @return mixed
	 */
	public static function get_instagram_gallery( $access_token_id, $count ) {
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$transient_key = self::TRANSIENT_KEY_PREFIX . $access_token_id;

		// Check if the connection exists before trying to retrieve the cached gallery.
		if ( ! self::is_instagram_access_token_valid( $access_token_id ) ) {
			delete_transient( $transient_key );
			return new WP_Error(
				'instagram_connection_unavailable',
				__( 'The requested Instagram connection is not available anymore.', 'jetpack' ),
				403
			);
		}

		$cached_gallery = get_transient( $transient_key );
		if ( $cached_gallery ) {
			$decoded_cached_gallery = json_decode( $cached_gallery );
			// `images` can be an array of images or a string 'ERROR'.
			$cached_count = is_array( $decoded_cached_gallery->images ) ? count( $decoded_cached_gallery->images ) : 0;
			if ( $cached_count >= $count ) {
				return $decoded_cached_gallery;
			}
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/instagram/%d?count=%d', $site_id, $access_token_id, $count ),
			2,
			array( 'headers' => array( 'content-type' => 'application/json' ) ),
			null,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$gallery = wp_remote_retrieve_body( $response );
		set_transient( $transient_key, $gallery, HOUR_IN_SECONDS );
		return json_decode( $gallery );
	}
}
