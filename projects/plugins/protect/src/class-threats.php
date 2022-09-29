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

class Threats {
	/**
	 * Gets the Scan API endpoint
	 *
	 * @param string $threat_id
	 * @return WP_Error|string
	 */
	private static function get_api_url( $threat_id ) {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return new WP_Error( 'site_not_connected' );
		}

		$api_url = sprintf( '/sites/%d/alerts/%d', $blog_id, $threat_id );

		return $api_url;
	}

	/**
	 * Update Threat
	 *
	 * @param string $threat_id
	 * @param array  $updates
	 *
	 * @return bool
	 */
	public static function update_threat( $threat_id, $updates ) {
		$api_url = self::get_api_url( $threat_id );
		if ( is_wp_error( $api_url ) ) {
			return $api_url;
		}

		$response = Client::wpcom_json_api_request_as_user(
			self::get_api_url( $threat_id ),
			'2',
			array( 'method' => 'POST' ),
			json_encode( $updates ),
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
	 * @param string $threat_id
	 *
	 * @return bool
	 */
	public static function ignore_threat( $threat_id ) {
		return self::update_threat( $threat_id, array( 'ignore' => true ) );
	}

}
