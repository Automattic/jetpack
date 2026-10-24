<?php
/**
 * Provisioner backed by the planned WordPress.com endpoints.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Calls `wpcom/v2/sites/{blog_id}/jetpack-send/*` over the Jetpack connection.
 */
class Wpcom_Provisioner implements Provisioner {

	/**
	 * Type.
	 *
	 * @return string
	 */
	public function get_type() {
		return 'wpcom';
	}

	/**
	 * Provision through WordPress.com.
	 *
	 * @param string $domain Sending domain.
	 * @return array|WP_Error
	 */
	public function provision( $domain ) {
		return $this->request( 'POST', 'provision', array( 'domain' => $domain ) );
	}

	/**
	 * Usage through WordPress.com.
	 *
	 * @param array $account Stored account.
	 * @return array|WP_Error
	 */
	public function get_usage( array $account ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Endpoint is site-scoped.
		return $this->request( 'GET', 'usage' );
	}

	/**
	 * Deprovision through WordPress.com.
	 *
	 * @param array $account Stored account.
	 * @return true|WP_Error
	 */
	public function deprovision( array $account ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Endpoint is site-scoped.
		$result = $this->request( 'POST', 'deprovision', array() );
		return is_wp_error( $result ) ? $result : true;
	}

	/**
	 * Call a Send endpoint as the blog.
	 *
	 * @param string     $method   HTTP method.
	 * @param string     $endpoint Endpoint under `jetpack-send/`.
	 * @param array|null $body     Request body.
	 * @return array|WP_Error
	 */
	private function request( $method, $endpoint, $body = null ) {
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-send/%s', (int) \Jetpack_Options::get_option( 'id' ), $endpoint ),
			'2',
			array(
				'method'  => $method,
				'timeout' => 30,
			),
			$body,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$data = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		if ( 200 !== $code || ! is_array( $data ) ) {
			return new WP_Error(
				is_array( $data ) && isset( $data['code'] ) ? (string) $data['code'] : 'jetpack_send_wpcom_error',
				is_array( $data ) && isset( $data['message'] ) ? (string) $data['message'] : __( 'WordPress.com could not complete the request.', 'jetpack-send-pkg' ),
				array( 'status' => $code ? $code : 502 )
			);
		}

		return $data;
	}
}
