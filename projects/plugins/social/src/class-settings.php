<?php
/**
 * Class to handle fetching the settings of Jetpack Social
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;

/**
 * Class that handles fetching the settings from the WPCOM servers
 */
class Settings {
	/**
	 * WPCOM endpoint
	 *
	 * @var string
	 */
	const REST_API_BASE = '/sites/%d/jetpack-social';

	/**
	 * Memoization for the current settings
	 *
	 * @var null|array
	 */
	public static $settings = null;

	/**
	 * Gets the WPCOM API endpoint
	 *
	 * @return WP_Error|string
	 */
	public static function get_api_url() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return new WP_Error( 'site_not_connected' );
		}

		return sprintf( self::REST_API_BASE, $blog_id );
	}

	/**
	 * Fetch settings
	 *
	 * @return WP_Error|array
	 */
	public static function get_settings() {
		if ( self::$settings !== null ) {
			return self::$settings;
		}

		$api_url = self::get_api_url();
		if ( is_wp_error( $api_url ) ) {
			return $api_url;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			self::get_api_url(),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return new WP_Error( 'failed_fetching_status', 'Failed to fetch Jetpack Social settings data from server', array( 'status' => $response_code ) );
		}

		self::$settings = json_decode( wp_remote_retrieve_body( $response ) );
		return self::$settings;
	}

	/**
	 * Checks if we should display the shares meter
	 *
	 * @return bool
	 */
	public static function should_display_shares_meter() {
		$settings = self::get_settings();

		if ( is_wp_error( $settings ) ) {
			return false;
		}

		return (bool) $settings->display_shares_meter;
	}
}
