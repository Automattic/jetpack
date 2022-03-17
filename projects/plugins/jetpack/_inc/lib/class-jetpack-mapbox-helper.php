<?php
/**
 * Mapbox API helper.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Host;

/**
 * Class Jetpack_Mapbox_Helper
 */
class Jetpack_Mapbox_Helper {
	/**
	 * Site option key for the Mapbox service.
	 *
	 * @var string
	 */
	private static $site_option_key = 'mapbox_api_key';

	/**
	 * Transient key for the WordPress.com Mapbox access token.
	 *
	 * @var string
	 */
	private static $transient_key = 'wpcom_mapbox_access_token';

	/**
	 * Get the site's own Mapbox access token if set, or the WordPress.com's one otherwise.
	 *
	 * @return array An array containing the key (if any) and its source ("site" or "wpcom").
	 */
	public static function get_access_token() {
		// If the site provides its own Mapbox access token, return it.
		$service_api_key = Jetpack_Options::get_option( self::$site_option_key );
		if ( $service_api_key ) {
			return self::format_access_token( $service_api_key );
		}

		$site_id = self::get_wpcom_site_id();

		// If on WordPress.com, try to return the access token straight away.
		if ( self::is_wpcom() && defined( 'WPCOM_MAPBOX_ACCESS_TOKEN' ) ) {
			jetpack_require_lib( 'mapbox-blocklist' );
			return wpcom_is_site_blocked_from_map_block( $site_id )
				? self::format_access_token()
				: self::format_access_token( WPCOM_MAPBOX_ACCESS_TOKEN, 'wpcom' );
		}

		// If not on WordPress.com or Atomic, return an empty access token.
		if ( ! $site_id || ( ! self::is_wpcom() && ! ( new Host() )->is_woa_site() ) ) {
			return self::format_access_token();
		}

		// If there is a cached token, return it.
		$cached_token = get_transient( self::$transient_key );
		if ( $cached_token ) {
			return self::format_access_token( $cached_token, 'wpcom' );
		}

		// Otherwise get it from the WordPress.com endpoint.
		$request_url = 'https://public-api.wordpress.com/wpcom/v2/sites/' . $site_id . '/mapbox';
		$response    = wp_remote_get( esc_url_raw( $request_url ) );
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return self::format_access_token();
		}

		$response_body             = json_decode( wp_remote_retrieve_body( $response ) );
		$wpcom_mapbox_access_token = $response_body->wpcom_mapbox_access_token;

		set_transient( self::$transient_key, $wpcom_mapbox_access_token, HOUR_IN_SECONDS );
		return self::format_access_token( $wpcom_mapbox_access_token, 'wpcom' );
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

	/**
	 * Format an access token and its source into an array.
	 *
	 * @param string $key The API key.
	 * @param string $source The key's source ("site" or "wpcom").
	 * @return array
	 */
	private static function format_access_token( $key = '', $source = 'site' ) {
		return array(
			'key'    => $key,
			'source' => $source,
		);
	}
}
