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
	 * Get a list of stored Instagram connections for the current user.
	 *
	 * @return mixed
	 */
	public static function get_instagram_connections() {
		if ( self::is_wpcom() ) {
			if ( ! class_exists( 'WPCOM_Instagram_Gallery_Helper' ) ) {
				\jetpack_require_lib( 'instagram-gallery-helper' );
			}
			return WPCOM_Instagram_Gallery_Helper::get_connections();
		}

		$response = Client::wpcom_json_api_request_as_user( '/me/connections' );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$body = json_decode( wp_remote_retrieve_body( $response ) );

		$connections = array();
		foreach ( $body->connections as $connection ) {
			if ( 'instagram-basic-display' === $connection->service && 'ok' === $connection->status ) {
				$connections[] = array(
					'token'    => (string) $connection->ID,
					'username' => $connection->external_name,
				);
			}
		}
		return $connections;
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

		$cached_gallery = get_transient( $transient_key );
		if ( $cached_gallery ) {
			$decoded_cached_gallery = json_decode( $cached_gallery );
			$cached_count           = count( $decoded_cached_gallery->images );
			if ( $cached_count >= $count ) {
				return $decoded_cached_gallery;
			}
		}

		if ( self::is_wpcom() ) {
			if ( ! class_exists( 'WPCOM_Instagram_Gallery_Helper' ) ) {
				\jetpack_require_lib( 'instagram-gallery-helper' );
			}

			$gallery = WPCOM_Instagram_Gallery_Helper::get_gallery( $access_token, $count );
			if ( is_wp_error( $gallery ) ) {
				return $gallery;
			}

			$encoded_gallery = wp_json_encode( $gallery );

			set_transient( $transient_key, $encoded_gallery, HOUR_IN_SECONDS );

			// Make sure the gallery is an object.
			return json_decode( $encoded_gallery );
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
		$site_id = self::is_wpcom() ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		return (int) $site_id;
	}

	/**
	 * Check if we're in WordPress.com.
	 *
	 * @return bool
	 */
	private static function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}}
