<?php
/**
 * Tests for the PayPal_Platform_Client class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Platform_Client_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Platform_Client
 */
#[CoversClass( PayPal_Platform_Client::class )]
class PayPal_Platform_Client_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		PayPal_Partner_Onboarding::cleanup();
		PayPal_OAuth::disconnect();
		PayPal_API_Client::forget_cached_resources();

		delete_option( 'jetpack_private_options' );
		\Jetpack_Options::delete_option( 'id' );
		Constants::clear_constants();

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * A site with a referred seller and a blog connection to WordPress.com.
	 */
	private function set_up_referred_merchant() {
		PayPal_OAuth::set_environment( 'sandbox' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		( new Tokens() )->update_blog_token( 'test.blogtoken' );
		\Jetpack_Options::update_option( 'id', 1234 );

		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1', false );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, PayPal_Partner_Onboarding::ONBOARDING_METHOD, false );
	}

	/**
	 * Route mocked HTTP responses by URL fragment.
	 *
	 * @param array $routes   Map of URL fragment => response array or WP_Error.
	 * @param array $requests Optional. Collected by reference as [ url, args ] pairs.
	 */
	private function mock_http_routes( array $routes, &$requests = null ) {
		$requests = array();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $routes, &$requests ) {
				$requests[] = array(
					'url'  => $url,
					'args' => $args,
				);

				foreach ( $routes as $fragment => $response ) {
					if ( false !== strpos( $url, $fragment ) ) {
						return $response;
					}
				}

				return $preempt;
			},
			10,
			3
		);
	}

	/**
	 * A PayPal answer relayed by the WordPress.com request proxy.
	 *
	 * @param int          $status PayPal's HTTP status.
	 * @param array|string $body   PayPal's response body.
	 * @return array
	 */
	private function platform_response( $status, $body ) {
		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode(
				array(
					'status' => $status,
					'body'   => is_string( $body ) ? $body : wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * Test that a call needs a referred seller to act for.
	 */
	public function test_request_requires_a_merchant() {
		$result = PayPal_Platform_Client::request( 'GET', '/v1/checkout/payment-resources' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_no_credentials', $result->get_error_code() );
	}

	/**
	 * Test that the call is sent to WordPress.com with the seller and the PayPal request in the body.
	 */
	public function test_request_forwards_the_call_through_wpcom() {
		$this->set_up_referred_merchant();
		$requests = array();
		$this->mock_http_routes(
			array( PayPal_Platform_Client::WPCOM_REQUEST_ROUTE => $this->platform_response( 201, array( 'id' => 'PLB-1' ) ) ),
			$requests
		);

		$response = PayPal_Platform_Client::request(
			'POST',
			'/v1/checkout/payment-resources',
			array( 'type' => 'BUY_NOW' ),
			'request-1'
		);

		$this->assertCount( 1, $requests );
		$this->assertStringContainsString( 'public-api.wordpress.com', $requests[0]['url'] );
		$this->assertStringContainsString( PayPal_Platform_Client::WPCOM_REQUEST_ROUTE, $requests[0]['url'] );

		$body = json_decode( $requests[0]['args']['body'], true );
		$this->assertSame( 'sandbox', $body['environment'] );
		$this->assertSame( 'MERCHANT1', $body['merchant_id'] );
		$this->assertSame( 'POST', $body['method'] );
		$this->assertSame( '/v1/checkout/payment-resources', $body['path'] );
		$this->assertSame( array( 'type' => 'BUY_NOW' ), $body['body'] );
		$this->assertSame( 'request-1', $body['request_id'] );

		// PayPal's answer reads like a direct one.
		$this->assertSame( 201, wp_remote_retrieve_response_code( $response ) );
		$this->assertSame( array( 'id' => 'PLB-1' ), json_decode( wp_remote_retrieve_body( $response ), true ) );
	}

	/**
	 * Test that a refusal from WordPress.com keeps its code, message and status.
	 */
	public function test_request_reports_wpcom_refusals_as_they_are() {
		$this->set_up_referred_merchant();
		$this->mock_http_routes(
			array(
				PayPal_Platform_Client::WPCOM_REQUEST_ROUTE => array(
					'response' => array( 'code' => 403 ),
					'body'     => wp_json_encode(
						array(
							'code'    => 'paypal_merchant_not_for_site',
							'message' => 'This PayPal account was not connected through this site.',
							'data'    => array( 'status' => 403 ),
						),
						JSON_UNESCAPED_SLASHES
					),
				),
			)
		);

		$result = PayPal_Platform_Client::request( 'GET', '/v1/checkout/payment-resources' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertSame( 'This PayPal account was not connected through this site.', $result->get_error_message() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Test that WordPress.com being unreachable is reported the way a direct network failure is, so it is retried.
	 */
	public function test_request_reports_a_transport_failure_as_retryable() {
		$this->set_up_referred_merchant();
		$this->mock_http_routes(
			array( PayPal_Platform_Client::WPCOM_REQUEST_ROUTE => new \WP_Error( 'http_request_failed', 'Connection refused' ) )
		);

		$result = PayPal_Platform_Client::request( 'GET', '/v1/checkout/payment-resources' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_api_request_failed', $result->get_error_code() );
		$this->assertSame( 0, $result->get_error_data()['status'] );
	}

	/**
	 * Test that the seller lookup goes to WordPress.com with the identifiers as query arguments.
	 */
	public function test_get_merchant_integration_queries_wpcom() {
		$this->set_up_referred_merchant();
		$requests = array();
		$this->mock_http_routes(
			array(
				PayPal_Platform_Client::WPCOM_MERCHANT_INTEGRATION_ROUTE => array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( array( 'merchant_id' => 'MERCHANT1' ), JSON_UNESCAPED_SLASHES ),
				),
			),
			$requests
		);

		$result = PayPal_Platform_Client::get_merchant_integration( '', 'woo-ncps-1234-1' );

		$this->assertSame( array( 'merchant_id' => 'MERCHANT1' ), $result );
		$this->assertSame( 'GET', $requests[0]['args']['method'] );
		$this->assertStringContainsString( 'environment=sandbox', $requests[0]['url'] );
		$this->assertStringContainsString( 'tracking_id=woo-ncps-1234-1', $requests[0]['url'] );
		$this->assertStringNotContainsString( 'merchant_id=', $requests[0]['url'] );
	}

	// --- Routing from the API client ---

	/**
	 * Test that a referred seller's button operations go through WordPress.com, never to PayPal from the site.
	 */
	public function test_api_client_routes_a_referred_seller_through_wpcom() {
		$this->set_up_referred_merchant();
		$requests = array();
		$this->mock_http_routes(
			array(
				PayPal_Platform_Client::WPCOM_REQUEST_ROUTE => $this->platform_response(
					201,
					array(
						'id'    => 'PLB-NEW',
						'links' => array(
							array(
								'rel'  => 'payment_link',
								'href' => 'https://www.sandbox.paypal.com/ncp/payment/PLB-NEW',
							),
						),
					)
				),
			),
			$requests
		);

		$result = PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array( array( 'name' => 'Test' ) ),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'PLB-NEW', $result['id'] );
		$this->assertSame( 'https://www.sandbox.paypal.com/ncp/payment/PLB-NEW', $result['payment_link'] );

		$this->assertCount( 1, $requests );
		$this->assertStringNotContainsString( 'paypal.com', $requests[0]['url'] );
		$this->assertStringContainsString( PayPal_Platform_Client::WPCOM_REQUEST_ROUTE, $requests[0]['url'] );

		$body = json_decode( $requests[0]['args']['body'], true );
		$this->assertSame( 'MERCHANT1', $body['merchant_id'] );
		$this->assertNotEmpty( $body['request_id'], 'The idempotency key travels with the call.' );
	}

	/**
	 * Test that PayPal's errors relayed by WordPress.com are mapped like direct ones.
	 */
	public function test_api_client_maps_a_relayed_paypal_error() {
		$this->set_up_referred_merchant();
		$this->mock_http_routes(
			array(
				PayPal_Platform_Client::WPCOM_REQUEST_ROUTE => $this->platform_response(
					404,
					array( 'name' => 'RESOURCE_NOT_FOUND' )
				),
			)
		);

		$result = PayPal_API_Client::get_resource( 'PLB-GONE' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_api_resource_not_found', $result->get_error_code() );
		$this->assertSame( 404, $result->get_error_data()['status'] );
	}

	/**
	 * Test that a relayed 403 is final: there is no site token to refresh and retry with.
	 */
	public function test_api_client_does_not_retry_a_relayed_403() {
		$this->set_up_referred_merchant();
		$requests = array();
		$this->mock_http_routes(
			array(
				PayPal_Platform_Client::WPCOM_REQUEST_ROUTE => $this->platform_response(
					403,
					array( 'name' => 'NOT_AUTHORIZED' )
				),
			),
			$requests
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 403, $result->get_error_data()['status'] );
		$this->assertCount( 1, $requests );
	}

	/**
	 * Test that stored credentials keep calls on the site even when a seller was referred.
	 */
	public function test_api_client_prefers_stored_credentials() {
		$this->set_up_referred_merchant();
		PayPal_OAuth::store_credentials( 'client_id', 'client_secret' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, PayPal_OAuth::encrypt( 'token' ), 3600 );
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/checkout/payment-resources' => array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( array( 'resources' => array() ), JSON_UNESCAPED_SLASHES ),
				),
			),
			$requests
		);

		PayPal_API_Client::list_resources();

		$this->assertCount( 1, $requests );
		$this->assertStringContainsString( 'sandbox.paypal.com', $requests[0]['url'] );
	}
}
