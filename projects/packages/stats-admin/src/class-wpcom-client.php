<?php
/**
 * A class that wraps `Automattic\Jetpack\Connection\Client` and handles cache and errors.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

/**
 * A class that wraps `Automattic\Jetpack\Connection\Client` and handles cache and errors.
 *
 * @package Automattic\Jetpack\Stats_Admin
 */
class WPCOM_Client {
	/**
	 * Query the WordPress.com REST API using the blog token cached.
	 *
	 * @param String $path The API endpoint relative path.
	 * @param String $version The API version.
	 * @param array  $args Request arguments.
	 * @param String $body Request body.
	 * @param String $base_api_path (optional) the API base path override, defaults to 'rest'.
	 * @param bool   $use_cache (optional) default to true.
	 * @param string $cache_key (optional) default to null meaning the function auto generates cache key.
	 * @return array|WP_Error $response Data.
	 */
	public static function request_as_blog_cached( $path, $version = '1.1', $args = array(), $body = null, $base_api_path = 'rest', $use_cache = true, $cache_key = null ) {
		// Only allow caching GET requests.
		$use_cache = $use_cache && ! ( isset( $args['method'] ) && strtoupper( $args['method'] ) !== 'GET' );

		// Arrays are serialized without considering the order of objects, but it's okay atm.
		$cache_key = $cache_key !== null ? $cache_key : 'STATS_REST_RESP_' . md5( implode( '|', array( $path, $version, wp_json_encode( $args ), wp_json_encode( $body ), $base_api_path ) ) );

		if ( $use_cache ) {
			$response_body_content = get_transient( $cache_key );
			if ( false !== $response_body_content ) {
				return json_decode( $response_body_content, true );
			}
		}

		$response_body = static::request_as_blog( $path, $version, $args, $body, $base_api_path );

		if ( is_wp_error( $response_body ) ) {
			return $response_body;
		}

		if ( $use_cache ) {
			// Cache the successful JSON response for 5 minutes.
			set_transient( $cache_key, wp_json_encode( $response_body ), 5 * MINUTE_IN_SECONDS );
		}

		return $response_body;
	}

	/**
	 * Query the WordPress.com REST API using the blog token
	 *
	 * @param String $path The API endpoint relative path.
	 * @param String $version The API version.
	 * @param array  $args Request arguments.
	 * @param String $body Request body.
	 * @param String $base_api_path (optional) the API base path override, defaults to 'rest'.
	 * @return array|WP_Error $response Data.
	 */
	public static function request_as_blog( $path, $version = '1.1', $args = array(), $body = null, $base_api_path = 'rest' ) {
		$response = Client::wpcom_json_api_request_as_blog(
			$path,
			$version,
			$args,
			$body,
			$base_api_path
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code         = wp_remote_retrieve_response_code( $response );
		$response_body_content = wp_remote_retrieve_body( $response );
		$response_body         = json_decode( $response_body_content, true );

		$error = static::get_wp_error( $response_body, (int) $response_code );
		if ( is_wp_error( $error ) ) {
			return $error;
		}

		return $response_body;
	}

	/**
	 * Build error object from remote response body and status code.
	 *
	 * @param array $response_body Remote response body.
	 * @param int   $response_code Http response code.
	 * @return WP_Error
	 */
	protected static function get_wp_error( $response_body, $response_code = 200 ) {
		$error_code = null;
		foreach ( array( 'code', 'error' ) as $error_code_key ) {
			if ( isset( $response_body[ $error_code_key ] ) ) {
				$error_code = $response_body[ $error_code_key ];
				break;
			}
		}

		// Sometimes the response code could be 200 but the response body still contains an error.
		if ( $error_code !== null || $response_code !== 200 ) {
			return new WP_Error(
				$error_code,
				isset( $response_body['message'] ) ? $response_body['message'] : 'unknown remote error',
				array( 'status' => $response_code )
			);
		}

		// No error.
		return null;
	}
}
