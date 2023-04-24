<?php
/**
 * Mapbox API helper.
 *
 * @package automattic/jetpack
 */

/**
 * Class Jetpack_Mapbox_Helper
 */
class Jetpack_Mapkit_Helper {

	/**
	 * Transient key for the WordPress.com Mapkit access token.
	 *
	 * @var string
	 */
	private static $transient_key = 'wpcom_mapkit_access_token';

	/**
	 * Get a Mapkit access token
	 *
	 * @return string An array containing the key (if any) and its source ("site" or "wpcom").
	 */
	public static function get_access_token() {
		$site_id = self::get_wpcom_site_id();

		// If there is a cached token, return it.
		$cached_token = get_transient( self::$transient_key );
		if ( $cached_token ) {
			return $cached_token;
		}

		// Override the referer header because it is used for the token generation.
		$headers = array(
			'Referer' => $_SERVER['HTTP_REFERER'] // phpcs:ignore -- `$_SERVER` ok.,
		);

		$args = array(
			'headers' => $headers,
		);

		$request_url = 'https://public-api.wordpress.com/wpcom/v2/sites/' . $site_id . '/mapkit';
		$response    = wp_remote_get( esc_url_raw( $request_url ), $args );
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return '';
		}

		$response_body             = json_decode( wp_remote_retrieve_body( $response ) );
		$wpcom_mapkit_access_token = $response_body->wpcom_mapkit_access_token;

		set_transient( self::$transient_key, $wpcom_mapkit_access_token, HOUR_IN_SECONDS );
		return $wpcom_mapkit_access_token;
	}

	/**
	 * Check if we're in WordPress.com.
	 *
	 * @return bool
	 */
	private static function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}

	/**
	 * Get the current site's WordPress.com ID.
	 *
	 * @return mixed The site's WordPress.com ID.
	 */
	private static function get_wpcom_site_id() {
		if ( self::is_wpcom() ) {
			return get_current_blog_id();
		} elseif ( method_exists( 'Jetpack', 'is_connection_ready' ) && Jetpack::is_connection_ready() ) {
			return Jetpack_Options::get_option( 'id' );
		}
		return false;
	}

}
