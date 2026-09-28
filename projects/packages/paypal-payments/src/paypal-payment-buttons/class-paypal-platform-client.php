<?php
/**
 * PayPal calls made through WordPress.com on a referred seller's behalf.
 *
 * A seller onboarded through Partner Referrals (THIRD_PARTY) holds no API
 * credentials on the site. Automattic's platform credentials live on
 * WordPress.com, so every PayPal call for that seller is made there, signed
 * with a PayPal-Auth-Assertion naming the seller.
 *
 * @package automattic/jetpack-paypal-payments
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Platform_Client
 */
class PayPal_Platform_Client {

	/**
	 * WordPress.com route that forwards one Payment Links & Buttons call.
	 *
	 * @var string
	 */
	const WPCOM_REQUEST_ROUTE = '/paypal/platform/request';

	/**
	 * WordPress.com route that reads a referred seller's integration status.
	 *
	 * @var string
	 */
	const WPCOM_MERCHANT_INTEGRATION_ROUTE = '/paypal/platform/merchant-integration';

	/**
	 * Make one Payment Links & Buttons call for the connected seller.
	 *
	 * PayPal's own status and body come back in the shape wp_remote_request()
	 * returns, so callers read the answer the same way as a direct call.
	 *
	 * @param string     $method     HTTP method (GET, POST, PUT, DELETE).
	 * @param string     $path       PayPal API path, with any query string.
	 * @param array|null $body       Request body for POST and PUT.
	 * @param string     $request_id PayPal-Request-Id idempotency key.
	 * @return array|\WP_Error A wp_remote_request()-shaped response, or WP_Error when the call never reached PayPal.
	 */
	public static function request( $method, $path, $body = null, $request_id = '' ) {
		$merchant_id = PayPal_Partner_Onboarding::get_merchant_id();
		if ( '' === $merchant_id ) {
			return new \WP_Error(
				'paypal_no_credentials',
				__( 'PayPal API credentials are not configured. Please connect your PayPal account.', 'jetpack-paypal-payments' )
			);
		}

		$result = self::call_wpcom(
			'POST',
			self::WPCOM_REQUEST_ROUTE,
			array(
				'environment' => PayPal_OAuth::get_environment(),
				'merchant_id' => $merchant_id,
				'method'      => $method,
				'path'        => $path,
				'body'        => $body,
				'request_id'  => $request_id,
			)
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! isset( $result['status'] ) ) {
			return new \WP_Error(
				'paypal_platform_invalid_response',
				__( 'WordPress.com returned an unexpected answer from PayPal.', 'jetpack-paypal-payments' ),
				array( 'status' => 502 )
			);
		}

		return array(
			'headers'       => array(),
			'body'          => (string) ( $result['body'] ?? '' ),
			'response'      => array(
				'code'    => (int) $result['status'],
				'message' => '',
			),
			'cookies'       => array(),
			'http_response' => null,
		);
	}

	/**
	 * Read a referred seller's integration record.
	 *
	 * @param string $merchant_id The seller's PayPal merchant ID, when known.
	 * @param string $tracking_id The referral's tracking ID, to find a seller who just finished onboarding.
	 * @return array|\WP_Error PayPal's merchant integration, or WP_Error.
	 */
	public static function get_merchant_integration( $merchant_id = '', $tracking_id = '' ) {
		$params = array( 'environment' => PayPal_OAuth::get_environment() );
		if ( '' !== $merchant_id ) {
			$params['merchant_id'] = $merchant_id;
		}
		if ( '' !== $tracking_id ) {
			$params['tracking_id'] = $tracking_id;
		}

		$result = self::call_wpcom( 'GET', self::WPCOM_MERCHANT_INTEGRATION_ROUTE, $params );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return $result;
	}

	/**
	 * Call one WordPress.com platform route as the blog.
	 *
	 * @param string $method HTTP method.
	 * @param string $route  Route below wpcom/v2.
	 * @param array  $params Query arguments for GET, JSON body otherwise.
	 * @return array|\WP_Error The decoded response, or WP_Error carrying WordPress.com's code and status.
	 */
	private static function call_wpcom( $method, $route, $params ) {
		$body = null;
		if ( 'GET' === $method ) {
			$route = add_query_arg( array_map( 'rawurlencode', $params ), $route );
		} else {
			$body = wp_json_encode( $params, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			$route,
			'2',
			array(
				'method'  => $method,
				'timeout' => 30,
				'headers' => array(
					'Content-Type' => 'application/json',
					'Accept'       => 'application/json',
				),
			),
			$body,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'paypal_api_request_failed',
				sprintf(
					/* translators: %s: error message from the HTTP request */
					__( 'PayPal API request failed: %s', 'jetpack-paypal-payments' ),
					$response->get_error_message()
				),
				array( 'status' => 0 )
			);
		}

		$status_code = (int) wp_remote_retrieve_response_code( $response );
		$data        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status_code || ! is_array( $data ) ) {
			return self::wpcom_error( $status_code, is_array( $data ) ? $data : array() );
		}

		return $data;
	}

	/**
	 * Turn a WordPress.com error answer into a WP_Error the site can act on.
	 *
	 * The code, message and data are WordPress.com's own, so a merchant this
	 * site did not refer, or an unprovisioned platform, is reported as such.
	 *
	 * @param int   $status_code HTTP status from WordPress.com.
	 * @param array $data        Decoded error body.
	 * @return \WP_Error
	 */
	private static function wpcom_error( $status_code, array $data ) {
		$error_data = isset( $data['data'] ) && is_array( $data['data'] ) ? $data['data'] : array();

		// 0 means WordPress.com itself never answered.
		$error_data['status'] = $status_code > 0 ? $status_code : 503;

		return new \WP_Error(
			! empty( $data['code'] ) ? sanitize_key( $data['code'] ) : 'paypal_platform_request_failed',
			! empty( $data['message'] )
				? sanitize_text_field( $data['message'] )
				: __( 'WordPress.com could not reach PayPal on your behalf. Please try again.', 'jetpack-paypal-payments' ),
			$error_data
		);
	}
}
