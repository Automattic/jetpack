<?php
/**
 * Class to handle the Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;

/**
 * Class that handles fetching and caching the Status of vulnerabilities check from the WPCOM servers
 */
class Status {

	/**
	 * WPCOM endpoint
	 *
	 * @var string
	 */
	const REST_API_BASE = '/sites/%d/jetpack-protect-status';

	/**
	 * Name of the option where status is stored
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_protect_status';

	/**
	 * Name of the option where the timestamp of the status is stored
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_NAME = 'jetpack_protect_status_time';

	/**
	 * Time in seconds that the cache should last
	 *
	 * @var int
	 */
	const OPTION_EXPIRES_AFTER = 43200; // 12 hours.

	/**
	 * Memoization for the current status
	 *
	 * @var null|array
	 */
	public static $status = null;

	/**
	 * Gets the current status of the Jetpack Protect checks
	 *
	 * @return array
	 */
	public static function get_status() {
		if ( self::$status !== null ) {
			return self::$status;
		}

		if ( ! self::should_use_cache() || self::is_cache_expired() ) {
			$status = self::fetch_from_server();
		} else {
			$status = self::get_from_options();
		}

		if ( is_wp_error( $status ) ) {
			$status = array(
				'error'         => true,
				'error_code'    => $status->get_error_code(),
				'error_message' => $status->get_error_message(),
			);
		}
		self::$status = $status;
		return $status;
	}

	/**
	 * Checks the current status to see if there are any vulnerabilities found
	 *
	 * @return boolean
	 */
	public static function has_vulnerabilities() {
		return 0 < self::get_total_vulnerabilities();
	}

	/**
	 * Gets the total number of vulnerabilities found
	 *
	 * @return integer
	 */
	public static function get_total_vulnerabilities() {
		$status = self::get_status();
		return isset( $status->num_vulnerabilities ) && is_int( $status->num_vulnerabilities ) ? $status->num_vulnerabilities : 0;
	}

	/**
	 * Get all vulnerabilities combined
	 *
	 * @return array
	 */
	public static function get_all_vulnerabilities() {
		return array_merge(
			self::get_wordpress_vulnerabilities(),
			self::get_themes_vulnerabilities(),
			self::get_plugins_vulnerabilities()
		);
	}

	/**
	 * Get vulnerabilities found for WordPress core
	 *
	 * @return array
	 */
	public static function get_wordpress_vulnerabilities() {
		return self::get_vulnerabilities( 'WordPress' );
	}

	/**
	 * Get vulnerabilities found for themes
	 *
	 * @return array
	 */
	public static function get_themes_vulnerabilities() {
		return self::get_vulnerabilities( 'themes' );
	}

	/**
	 * Get vulnerabilities found for plugins
	 *
	 * @return array
	 */
	public static function get_plugins_vulnerabilities() {
		return self::get_vulnerabilities( 'plugins' );
	}

	/**
	 * Get the vulnerabilities for one type of extension or core
	 *
	 * @param string $type What vulnerabilities you want to get. Possible values are 'WordPress', 'themes' and 'plugins'.
	 *
	 * @return array
	 */
	public static function get_vulnerabilities( $type ) {
		$status = self::get_status();
		if ( 'WordPress' === $type ) {
			return isset( $status->$type ) && ! empty( $status->$type->vulnerabilities ) ? $status->$type->vulnerabilities : array();
		}

		$vuls = array();
		if ( isset( $status->$type ) ) {
			foreach ( (array) $status->$type as $item ) {
				if ( ! empty( $item->vulnerabilities ) ) {
					$vuls = array_merge( $vuls, $item->vulnerabilities );
				}
			}
		}
		return $vuls;
	}

	/**
	 * Checks if the current cached status is expired and should be renewed
	 *
	 * @return boolean
	 */
	public static function is_cache_expired() {
		$option_timestamp = get_option( self::OPTION_TIMESTAMP_NAME );
		if ( ! $option_timestamp ) {
			return true;
		}
		return time() - $option_timestamp > self::OPTION_EXPIRES_AFTER;
	}

	/**
	 * Checks if we should consider the stored cache or bypass it
	 *
	 * @return boolean
	 */
	public static function should_use_cache() {
		return defined( 'JETPACK_PROTECT_DEV__BYPASS_CACHE' ) && JETPACK_PROTECT_DEV__BYPASS_CACHE ? false : true;
	}

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

		$api_url = sprintf( self::REST_API_BASE, $blog_id );

		if ( defined( 'JETPACK_PROTECT_DEV__API_RESPONSE_TYPE' ) && is_string( JETPACK_PROTECT_DEV__API_RESPONSE_TYPE ) ) {
			$api_url = add_query_arg( array( 'response_type' => JETPACK_PROTECT_DEV__API_RESPONSE_TYPE ), $api_url );
		}
		if ( defined( 'JETPACK_PROTECT_DEV__API_CORE_VULS' ) && is_int( JETPACK_PROTECT_DEV__API_CORE_VULS ) ) {
			$api_url = add_query_arg( array( 'core_vuls' => JETPACK_PROTECT_DEV__API_CORE_VULS ), $api_url );
		}
		return $api_url;
	}

	/**
	 * Fetches the status from WPCOM servers
	 *
	 * @return WP_Error|array
	 */
	public static function fetch_from_server() {
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
			return new WP_Error( 'failed_fetching_status', 'Failed to fetch Protect Status data from server', array( 'status' => $response_code ) );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		self::update_option( $body );
		return $body;
	}

	/**
	 * Gets the current cached status
	 *
	 * @return bool|array False if value is not found. Array with values if cache is found.
	 */
	public static function get_from_options() {
		return get_option( self::OPTION_NAME );
	}

	/**
	 * Updated the cached status and its timestamp
	 *
	 * @param array $status The new status to be cached.
	 * @return void
	 */
	public static function update_option( $status ) {
		// TODO: Sanitize $status.
		update_option( self::OPTION_NAME, $status );
		update_option( self::OPTION_TIMESTAMP_NAME, time() );
	}

}
