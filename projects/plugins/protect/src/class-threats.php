<?php
/**
 * Class to handle Threats
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;

/**
 * Class that handles management of individual threats.
 */
class Threats {
	/**
	 * Gets the base "Alerts" (Threats) endpoint.
	 *
	 * @return WP_Error|string
	 */
	private static function get_api_base() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return new WP_Error( 'site_not_connected' );
		}

		$api_url = sprintf( '/sites/%d/alerts', $blog_id );

		return $api_url;
	}

	/**
	 * Update Threat
	 *
	 * @param string $threat_id The threat ID.
	 * @param array  $updates   The keys/values to update.
	 *
	 * @return bool
	 */
	public static function update_threat( $threat_id, $updates ) {
		$api_base = self::get_api_base( $threat_id );
		if ( is_wp_error( $api_base ) ) {
			return false;
		}

		$response = Client::wpcom_json_api_request_as_user(
			"$api_base/$threat_id",
			'2',
			array( 'method' => 'POST' ),
			wp_json_encode( $updates ),
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code ) {
			return false;
		}

		// clear the now out-of-date cache
		Scan_Status::delete_option();

		return true;
	}

	/**
	 * Ignore Threat
	 *
	 * @param string $threat_id The threat ID.
	 *
	 * @return bool
	 */
	public static function ignore_threat( $threat_id ) {
		return self::update_threat( $threat_id, array( 'ignore' => true ) );
	}

	/**
	 * Fix Threats
	 *
	 * @param array<string> $threat_ids Threat IDs.
	 *
	 * @return bool|array
	 */
	public static function fix_threats( $threat_ids ) {
		$api_base = self::get_api_base();
		if ( is_wp_error( $api_base ) ) {
			return false;
		}

		$response = Client::wpcom_json_api_request_as_user(
			"$api_base/fix",
			'2',
			array( 'method' => 'POST' ),
			wp_json_encode(
				array(
					'threat_ids' => $threat_ids,
				)
			),
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code ) {
			return false;
		}

		// clear the now out-of-date cache
		Scan_Status::delete_option();

		$parsed_response = json_decode( $response['body'] );

		if ( ! $parsed_response ) {
			return false;
		}

		return $parsed_response;
	}

	/**
	 * Fix Threats Status
	 *
	 * @param array<string> $threat_ids Threat IDs.
	 *
	 * @return bool|array
	 */
	public static function fix_threats_status( $threat_ids ) {
		$api_base = self::get_api_base();
		if ( is_wp_error( $api_base ) ) {
			return false;
		}

		$response = Client::wpcom_json_api_request_as_user(
			add_query_arg( 'threat_ids', $threat_ids, "$api_base/fix" ),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code ) {
			return false;
		}

		$parsed_response = json_decode( $response['body'] );

		if ( ! $parsed_response ) {
			return false;
		}

		// clear the potentially out-of-date cache
		Scan_Status::delete_option();

		return $parsed_response;
	}

	/**
	 * Scan enqueue
	 *
	 * @return bool
	 */
	public static function scan() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return false;
		}

		$api_base = sprintf( '/sites/%d/scan', $blog_id );

		if ( is_wp_error( $api_base ) ) {
			return false;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			"$api_base/enqueue",
			'2',
			array( 'method' => 'POST' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code ) {
			return false;
		}

		// clear the now out-of-date cache
		Scan_Status::delete_option();

		return true;
	}

}
