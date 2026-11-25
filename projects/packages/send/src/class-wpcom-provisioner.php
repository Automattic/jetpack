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
		return self::note_provision( $domain, $this->request( 'POST', 'provision', array( 'domain' => $domain ) ) );
	}

	/**
	 * Usage through WordPress.com.
	 *
	 * @param array $account Stored account.
	 * @return array|WP_Error
	 */
	public function get_usage( array $account ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Endpoint is site-scoped.
		return self::note_usage( $this->request( 'GET', 'usage' ) );
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
	 * Note a provisioning result in the debug log. Never the key.
	 *
	 * @param string         $domain Sending domain.
	 * @param array|WP_Error $result provision()'s result.
	 * @return array|WP_Error The result, unchanged.
	 */
	private static function note_provision( $domain, $result ) {
		$failed = is_wp_error( $result );
		$status = $failed ? $result->get_error_code() : 'created';
		Debug_Log::add(
			$failed ? 'error' : 'info',
			'account',
			'account.provision',
			$failed
				/* translators: %s: an error code. */
				? sprintf( __( 'Sending account failed: %s.', 'jetpack-send-pkg' ), $status )
				: __( 'Sending account created.', 'jetpack-send-pkg' ),
			array(
				'provider' => 'wpcom',
				'domain'   => (string) $domain,
				'status'   => $status,
				'code'     => $failed ? $status : '',
			)
		);
		return $result;
	}

	/**
	 * Note usage in the debug log.
	 *
	 * @param array|WP_Error $usage get_usage()'s result.
	 * @return array|WP_Error The result, unchanged.
	 */
	private static function note_usage( $usage ) {
		// Read on every Overview visit, so it's noted only when the number or the limit moved.
		if ( is_array( $usage ) && Debug_Log::changed( 'usage', (int) ( $usage['total_usage'] ?? 0 ) . '/' . (int) ( $usage['monthly_limit'] ?? 0 ) ) ) {
			$used  = (int) ( $usage['total_usage'] ?? 0 );
			$limit = (int) ( $usage['monthly_limit'] ?? 0 );
			Debug_Log::add(
				'debug',
				'account',
				'account.usage',
				$limit < 0
					/* translators: %d: emails used this period. */
					? sprintf( __( 'Usage: %d, no monthly limit.', 'jetpack-send-pkg' ), $used )
					/* translators: 1: emails used this period, 2: the plan's limit. */
					: sprintf( __( 'Usage: %1$d of %2$d.', 'jetpack-send-pkg' ), $used, $limit ),
				array(
					'used'       => $used,
					'limit'      => $limit,
					'period_end' => (string) ( $usage['period_end'] ?? '' ),
				)
			);
		}
		return $usage;
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
