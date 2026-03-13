<?php
/**
 * Tests for the PayPal_API_Client class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_API_Client_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_API_Client
 */
#[CoversClass( PayPal_API_Client::class )]
class PayPal_API_Client_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		// Clean up all options and transients.
		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );

		// Remove any HTTP request filters.
		remove_all_filters( 'pre_http_request' );
	}

	// --- Constants ---

	/**
	 * Test that the resources endpoint constant is set correctly.
	 */
	public function test_resources_endpoint_constant() {
		$this->assertEquals(
			'/v1/checkout/payment-resources',
			PayPal_API_Client::RESOURCES_ENDPOINT
		);
	}

	/**
	 * Test that the request timeout constant is reasonable.
	 */
	public function test_request_timeout_constant() {
		$this->assertEquals( 30, PayPal_API_Client::REQUEST_TIMEOUT );
	}

	// --- Auth dependency ---

	/**
	 * Test that create_resource fails when not connected (no credentials).
	 */
	public function test_create_resource_fails_without_credentials() {
		$result = PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(
					array(
						'name'        => 'Test',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
				),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Test that list_resources fails when not connected.
	 */
	public function test_list_resources_fails_without_credentials() {
		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Test that get_resource fails when not connected.
	 */
	public function test_get_resource_fails_without_credentials() {
		$result = PayPal_API_Client::get_resource( 'PLB-ABC123DEF456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Test that update_resource fails when not connected.
	 */
	public function test_update_resource_fails_without_credentials() {
		$result = PayPal_API_Client::update_resource(
			'PLB-ABC123DEF456',
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Test that delete_resource fails when not connected.
	 */
	public function test_delete_resource_fails_without_credentials() {
		$result = PayPal_API_Client::delete_resource( 'PLB-ABC123DEF456' );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	// --- Resource ID validation ---

	/**
	 * Test that get_resource rejects empty resource ID.
	 */
	public function test_get_resource_rejects_empty_id() {
		$result = PayPal_API_Client::get_resource( '' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_invalid_resource_id', $result->get_error_code() );
	}

	/**
	 * Test that get_resource rejects invalid resource ID format.
	 *
	 * @param string $invalid_id The invalid ID to test.
	 * @dataProvider invalid_resource_ids_provider
	 */
	#[DataProvider( 'invalid_resource_ids_provider' )]
	public function test_get_resource_rejects_invalid_id_format( $invalid_id ) {
		$result = PayPal_API_Client::get_resource( $invalid_id );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_invalid_resource_id', $result->get_error_code() );
	}

	/**
	 * Data provider for invalid resource IDs.
	 *
	 * @return array[] Test cases.
	 */
	public static function invalid_resource_ids_provider(): array {
		return array(
			'no prefix'     => array( 'ABC123DEF456' ),
			'wrong prefix'  => array( 'XYZ-ABC123DEF456' ),
			'spaces'        => array( 'PLB-ABC 123' ),
			'special chars' => array( 'PLB-ABC!@#$%' ),
			'sql injection' => array( "PLB-'; DROP TABLE--" ),
			'script tag'    => array( 'PLB-<script>alert(1)</script>' ),
		);
	}

	/**
	 * Test that delete_resource rejects invalid resource ID format.
	 */
	public function test_delete_resource_rejects_invalid_id() {
		$result = PayPal_API_Client::delete_resource( 'INVALID-ID' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_invalid_resource_id', $result->get_error_code() );
	}

	/**
	 * Test that update_resource rejects invalid resource ID format.
	 */
	public function test_update_resource_rejects_invalid_id() {
		$result = PayPal_API_Client::update_resource( 'NOT-A-VALID-ID', array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_invalid_resource_id', $result->get_error_code() );
	}

	// --- Successful API calls (mocked HTTP) ---

	/**
	 * Test create_resource returns parsed response on 201.
	 */
	public function test_create_resource_success() {
		$this->set_up_connected_state();

		$expected_response = array(
			'id'               => 'PLB-TEST123456',
			'type'             => 'BUY_NOW',
			'integration_mode' => 'LINK',
			'payment_link'     => 'https://www.paypal.com/ncp/payment/TEST123456',
			'status'           => 'ACTIVE',
		);

		$this->mock_http_response( 201, $expected_response );

		$result = PayPal_API_Client::create_resource(
			array(
				'type'             => 'BUY_NOW',
				'integration_mode' => 'LINK',
				'line_items'       => array(
					array(
						'name'        => 'Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '29.99',
						),
					),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertEquals( 'PLB-TEST123456', $result['id'] );
		$this->assertEquals( 'ACTIVE', $result['status'] );
		$this->assertArrayHasKey( 'payment_link', $result );
	}

	/**
	 * Test list_resources returns parsed response on 200.
	 */
	public function test_list_resources_success() {
		$this->set_up_connected_state();

		$expected_response = array(
			'items'       => array(
				array(
					'id'     => 'PLB-ITEM001',
					'type'   => 'BUY_NOW',
					'status' => 'ACTIVE',
				),
			),
			'total_items' => 1,
		);

		$this->mock_http_response( 200, $expected_response );

		$result = PayPal_API_Client::list_resources( 10, '' );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'items', $result );
		$this->assertCount( 1, $result['items'] );
	}

	/**
	 * Test get_resource returns parsed response on 200.
	 */
	public function test_get_resource_success() {
		$this->set_up_connected_state();

		$expected_response = array(
			'id'     => 'PLB-SINGLE123',
			'type'   => 'BUY_NOW',
			'status' => 'ACTIVE',
		);

		$this->mock_http_response( 200, $expected_response );

		$result = PayPal_API_Client::get_resource( 'PLB-SINGLE123' );

		$this->assertIsArray( $result );
		$this->assertEquals( 'PLB-SINGLE123', $result['id'] );
	}

	/**
	 * Test update_resource returns parsed response on 200.
	 */
	public function test_update_resource_success() {
		$this->set_up_connected_state();

		$expected_response = array(
			'id'     => 'PLB-UPDATE123',
			'type'   => 'BUY_NOW',
			'status' => 'ACTIVE',
		);

		$this->mock_http_response( 200, $expected_response );

		$result = PayPal_API_Client::update_resource(
			'PLB-UPDATE123',
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(
					array(
						'name'        => 'Updated Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '39.99',
						),
					),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertEquals( 'PLB-UPDATE123', $result['id'] );
	}

	/**
	 * Test delete_resource returns true on 204.
	 */
	public function test_delete_resource_success() {
		$this->set_up_connected_state();

		$this->mock_http_response( 204, '' );

		$result = PayPal_API_Client::delete_resource( 'PLB-DELETE123' );

		$this->assertTrue( $result );
	}

	// --- Error handling ---

	/**
	 * Test that a 400 error returns descriptive WP_Error.
	 */
	public function test_error_400_invalid_request() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			400,
			array(
				'name'    => 'INVALID_REQUEST',
				'message' => 'Request is not well-formed.',
			)
		);

		$result = PayPal_API_Client::create_resource( array( 'type' => 'BUY_NOW' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_api_invalid_request', $result->get_error_code() );
		$this->assertStringContainsString( 'invalid data', $result->get_error_message() );
	}

	/**
	 * Test that a 401 error clears the token cache.
	 */
	public function test_error_401_clears_token_cache() {
		$this->set_up_connected_state();

		// Verify token is cached.
		$this->assertNotFalse( get_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY ) );

		$this->mock_http_response(
			401,
			array(
				'name'    => 'AUTHENTICATION_FAILURE',
				'message' => 'Authentication failed.',
			)
		);

		$result = PayPal_API_Client::get_resource( 'PLB-AUTH123' );

		$this->assertInstanceOf( \WP_Error::class, $result );

		// The token cache should have been cleared by the 401 handler.
		$this->assertFalse( get_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY ) );
	}

	/**
	 * Test that a 404 error returns descriptive WP_Error.
	 */
	public function test_error_404_resource_not_found() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			404,
			array(
				'name'    => 'RESOURCE_NOT_FOUND',
				'message' => 'The specified resource does not exist.',
			)
		);

		$result = PayPal_API_Client::get_resource( 'PLB-NOTFOUND123' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_api_resource_not_found', $result->get_error_code() );
		$this->assertStringContainsString( 'no longer exists', $result->get_error_message() );
	}

	/**
	 * Test that a 422 error includes detail messages.
	 */
	public function test_error_422_with_details() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			422,
			array(
				'name'    => 'UNPROCESSABLE_ENTITY',
				'message' => 'The request could not be processed.',
				'details' => array(
					array(
						'field'       => '/line_items/0/unit_amount/value',
						'description' => 'Must be a valid currency amount.',
					),
				),
			)
		);

		$result = PayPal_API_Client::create_resource( array( 'type' => 'BUY_NOW' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertStringContainsString( 'valid currency amount', $result->get_error_message() );
	}

	/**
	 * Test that a 429 error returns a rate limit message.
	 */
	public function test_error_429_rate_limit() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			429,
			array(
				'name'    => 'RATE_LIMIT_REACHED',
				'message' => 'Too many requests.',
			)
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertStringContainsString( 'Too many requests', $result->get_error_message() );
	}

	/**
	 * Test that a 500 error returns a server error message.
	 */
	public function test_error_500_server_error() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			500,
			array(
				'name'    => 'INTERNAL_SERVER_ERROR',
				'message' => 'An internal server error has occurred.',
			)
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertStringContainsString( 'temporarily unavailable', $result->get_error_message() );
	}

	/**
	 * Test that an HTTP transport error (WP_Error from wp_remote_request) is handled.
	 */
	public function test_http_transport_error() {
		$this->set_up_connected_state();

		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Connection timed out' );
			}
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_api_timeout', $result->get_error_code() );
		$this->assertStringContainsString( 'timed out', $result->get_error_message() );
	}

	/**
	 * Test that invalid JSON response is handled.
	 */
	public function test_invalid_json_response() {
		$this->set_up_connected_state();

		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => 'This is not JSON at all',
				);
			}
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_api_invalid_json', $result->get_error_code() );
	}

	// --- Request format verification ---

	/**
	 * Test that create_resource sends correct HTTP method and headers.
	 */
	public function test_create_request_format() {
		$this->set_up_connected_state();

		$captured_args = null;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_args ) {
				// Only capture the payment-resources call, not the token call.
				if ( strpos( $url, '/v1/checkout/payment-resources' ) !== false ) {
					$captured_args = $args;
				}
				return array(
					'response' => array(
						'code'    => 201,
						'message' => 'Created',
					),
					'body'     => wp_json_encode( array( 'id' => 'PLB-NEW123' ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);

		PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(),
			)
		);

		$this->assertNotNull( $captured_args, 'HTTP request should have been made' );
		$this->assertEquals( 'POST', $captured_args['method'] );
		$this->assertStringContainsString( 'Bearer ', $captured_args['headers']['Authorization'] );
		$this->assertEquals( 'application/json', $captured_args['headers']['Content-Type'] );
		$this->assertArrayHasKey( 'PayPal-Request-Id', $captured_args['headers'] );
		$this->assertEquals( 30, $captured_args['timeout'] );
	}

	/**
	 * Test that delete_resource sends DELETE method.
	 */
	public function test_delete_request_format() {
		$this->set_up_connected_state();

		$captured_method = null;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_method ) {
				if ( strpos( $url, '/v1/checkout/payment-resources/' ) !== false ) {
					$captured_method = $args['method'];
				}
				return array(
					'response' => array(
						'code'    => 204,
						'message' => 'No Content',
					),
					'body'     => '',
				);
			},
			10,
			3
		);

		PayPal_API_Client::delete_resource( 'PLB-DELTEST123' );

		$this->assertEquals( 'DELETE', $captured_method );
	}

	/**
	 * Test that update_resource sends PUT method.
	 */
	public function test_update_request_sends_put() {
		$this->set_up_connected_state();

		$captured_method = null;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_method ) {
				if ( strpos( $url, '/v1/checkout/payment-resources/PLB-' ) !== false ) {
					$captured_method = $args['method'];
				}
				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode( array( 'id' => 'PLB-UPD123' ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);

		PayPal_API_Client::update_resource( 'PLB-UPD123', array( 'type' => 'BUY_NOW' ) );

		$this->assertEquals( 'PUT', $captured_method );
	}

	/**
	 * Test that list_resources sends correct URL with page_size query parameter.
	 */
	public function test_list_resources_pagination_params() {
		$this->set_up_connected_state();

		$captured_url = null;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_url ) {
				if ( strpos( $url, '/v1/checkout/payment-resources' ) !== false
					&& strpos( $url, '/v1/oauth2/token' ) === false ) {
					$captured_url = $url;
				}
				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode( array( 'items' => array() ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);

		PayPal_API_Client::list_resources( 25, 'cursor_abc123' );

		$this->assertNotNull( $captured_url );
		$this->assertStringContainsString( 'page_size=25', $captured_url );
		$this->assertStringContainsString( 'page_token=cursor_abc123', $captured_url );
	}

	/**
	 * Test that the correct endpoint URL is constructed for sandbox.
	 */
	public function test_request_uses_sandbox_url() {
		$this->set_up_connected_state();

		$captured_url = null;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_url ) {
				if ( strpos( $url, '/v1/checkout/payment-resources' ) !== false ) {
					$captured_url = $url;
				}
				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode( array( 'items' => array() ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);

		PayPal_API_Client::list_resources();

		$this->assertNotNull( $captured_url );
		$this->assertStringStartsWith( 'https://api-m.sandbox.paypal.com', $captured_url );
	}

	// --- Helpers ---

	/**
	 * Set up a simulated connected state with credentials and a cached token.
	 *
	 * Mocks the token exchange so subsequent API calls can proceed.
	 */
	private function set_up_connected_state() {
		PayPal_OAuth::set_environment( 'sandbox' );
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		// Directly cache a fake token to avoid needing to mock the OAuth token exchange.
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'fake_access_token_12345', 3600 );
	}

	/**
	 * Mock an HTTP response for the next wp_remote_request call.
	 *
	 * @param int          $status_code HTTP status code.
	 * @param array|string $body        Response body (will be JSON-encoded if array).
	 */
	private function mock_http_response( $status_code, $body ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $status_code, $body ) {
				// Skip the OAuth token endpoint mock — we use a cached token.
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return $preempt;
				}

				return array(
					'response' => array(
						'code'    => $status_code,
						'message' => '',
					),
					'body'     => is_array( $body ) ? wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) : $body,
				);
			},
			10,
			3
		);
	}
}
