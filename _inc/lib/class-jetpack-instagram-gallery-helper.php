<?php
/**
 * Instagram Gallery block and API helper.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Class Jetpack_Instagram_Gallery_Helper
 */
class Jetpack_Instagram_Gallery_Helper {
	const TRANSIENT_KEY_PREFIX = 'jetpack_instagram_gallery_block_';

	/**
	 * Check whether an Instagram access token is valid,
	 * or has been permanently deleted elsewhere.
	 *
	 * @param  string $access_token The Instagram access token.
	 * @return bool
	 */
	public static function is_instagram_access_token_valid( $access_token ) {
		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Instagram_Gallery_Helper' ) ) {
				\jetpack_require_lib( 'instagram-gallery-helper' );
			}
			$token = WPCOM_Instagram_Gallery_Helper::get_token( $access_token );
			return ! is_wp_error( $token );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/instagram/%s/check-token', $site_id, $access_token ),
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
	 * @param  string $access_token The Instagram access token.
	 * @param  int    $count        The number of Instagram posts to fetch.
	 * @return mixed
	 */
	public static function get_instagram_gallery( $access_token, $count ) {
		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$transient_key = self::TRANSIENT_KEY_PREFIX . $access_token;

		// Check if the connection exists before trying to retrieve the cached gallery.
		if ( ! self::is_instagram_access_token_valid( $access_token ) ) {
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
			sprintf( '/sites/%d/instagram/%s?count=%d', $site_id, $access_token, (int) $count ),
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
