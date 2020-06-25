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

		$cached_gallery = get_transient( $transient_key );
		if ( $cached_gallery ) {
			$decoded_cached_gallery = json_decode( $cached_gallery );
			$cached_count           = count( $decoded_cached_gallery->images );
			if ( $cached_count >= $count ) {
				return $decoded_cached_gallery;
			}
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Instagram_Gallery_Helper' ) ) {
				\jetpack_require_lib( 'instagram-gallery-helper' );
			}

			$gallery = WPCOM_Instagram_Gallery_Helper::get_gallery( $access_token, $count );
			if ( is_wp_error( $gallery ) ) {
				return $gallery;
			}

			$encoded_gallery = wp_json_encode( $gallery );

			// Make sure the gallery is an object.
			$gallery_object = json_decode( $encoded_gallery );

			// Avoid caching the gallery if the fetch failed for unknown reasons.
			if ( property_exists( $gallery_object, 'images' ) && 'ERROR' !== $gallery_object->images ) {
				set_transient( $transient_key, $encoded_gallery, HOUR_IN_SECONDS );
			}

			return $gallery_object;
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
