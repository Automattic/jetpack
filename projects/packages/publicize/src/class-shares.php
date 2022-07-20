<?php
/**
 * Class to handle all shares-related functionality.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;

/**
 * Class to handle all shares-related functionality.
 */
class Shares {
	/**
	 * WPCOM endpoint
	 *
	 * @var string
	 */
	const REST_API_BASE = '/sites/%d/jetpack-social';

	/**
	 * Memoization for the current WPCOM data.
	 *
	 * @var null|array
	 */
	public $data = null;

	/**
	 * Gets the WPCOM API endpoint
	 *
	 * @return WP_Error|string
	 */
	public function get_api_url() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return new WP_Error( 'site_not_connected' );
		}

		return sprintf( self::REST_API_BASE, $blog_id );
	}

	/**
	 * Fetch data from WPCOM
	 *
	 * @return WP_Error|array
	 */
	private function get_data_from_wpcom() {
		$api_url = $this->get_api_url();

		if ( is_wp_error( $api_url ) ) {
			return $api_url;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			$this->get_api_url(),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return new WP_Error( 'failed_fetching_status', 'Failed to fetch Jetpack Social data from server', array( 'status' => $response_code ) );
		}

		$this->data = json_decode( wp_remote_retrieve_body( $response ) );
		return $this->data;
	}

	/**
	 * Get data, either cached or from WPCOM.
	 *
	 * @return WP_Error|array
	 */
	public function get_data() {
		if ( $this->data !== null ) {
			return $this->data;
		}

		return $this->get_data_from_wpcom();
	}

	/**
	 * Checks if the share limit is enabled.
	 *
	 * @return bool
	 */
	public function is_share_limit_enabled() {
		$data = $this->get_data();

		if ( is_wp_error( $data ) ) {
			return false;
		}

		return (bool) $data->is_share_limit_enabled;
	}
}
