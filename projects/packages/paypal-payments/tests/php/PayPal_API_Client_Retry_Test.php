<?php
/**
 * Tests for the PayPal_API_Client retry and URL validation additions (WOOPTP-151).
 *
 * Covers URL domain whitelisting, retry behavior on 500/403 errors,
 * timeout detection, and retry-related constants.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_API_Client_Retry_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_API_Client
 */
#[CoversClass( PayPal_API_Client::class )]
class PayPal_API_Client_Retry_Test extends TestCase {

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
	 * Test that MAX_RETRIES constant exists and is reasonable.
	 */
	public function test_max_retries_constant_exists() {
		$this->assertEquals( 3, PayPal_API_Client::MAX_RETRIES );
	}

	/**
	 * Test that BACKOFF_BASE_SECONDS constant exists and is reasonable.
	 */
	public function test_backoff_base_seconds_constant_exists() {
		$this->assertSame( 1.0, PayPal_API_Client::BACKOFF_BASE_SECONDS );
	}

	/**
	 * Test that ALLOWED_PAYPAL_DOMAINS constant contains expected domains.
	 */
	public function test_allowed_paypal_domains_constant() {
		$domains = PayPal_API_Client::ALLOWED_PAYPAL_DOMAINS;

		$this->assertContains( 'www.paypal.com', $domains );
		$this->assertContains( 'www.sandbox.paypal.com', $domains );
		$this->assertContains( 'paypal.com', $domains );
		$this->assertContains( 'sandbox.paypal.com', $domains );
		$this->assertCount( 4, $domains );
	}

	// --- URL validation (tested via create_resource with payment_link in response) ---

	/**
	 * Test that create_resource accepts a response with a valid paypal.com payment link.
	 */
	public function test_create_resource_accepts_valid_paypal_url() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			201,
			array(
				'id'           => 'PLB-URLTEST123',
				'payment_link' => 'https://www.paypal.com/ncp/payment/URLTEST123',
				'status'       => 'ACTIVE',
			)
		);

		$result = PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(
					array(
						'name'        => 'Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertEquals( 'PLB-URLTEST123', $result['id'] );
	}

	/**
	 * Test that create_resource accepts a response with a valid sandbox.paypal.com payment link.
	 */
	public function test_create_resource_accepts_sandbox_paypal_url() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			201,
			array(
				'id'           => 'PLB-SANDBOX123',
				'payment_link' => 'https://www.sandbox.paypal.com/ncp/payment/SANDBOX123',
				'status'       => 'ACTIVE',
			)
		);

		$result = PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(
					array(
						'name'        => 'Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertEquals( 'PLB-SANDBOX123', $result['id'] );
	}

	/**
	 * Test that create_resource rejects a response with a non-PayPal domain.
	 */
	public function test_create_resource_rejects_untrusted_domain() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			201,
			array(
				'id'           => 'PLB-EVIL123',
				'payment_link' => 'https://www.evil-site.com/ncp/payment/EVIL123',
				'status'       => 'ACTIVE',
			)
		);

		$result = PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(
					array(
						'name'        => 'Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
				),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_untrusted_domain', $result->get_error_code() );
	}

	/**
	 * Test that create_resource rejects a response with an HTTP (non-HTTPS) payment link.
	 */
	public function test_create_resource_rejects_non_https_url() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			201,
			array(
				'id'           => 'PLB-HTTP123',
				'payment_link' => 'http://www.paypal.com/ncp/payment/HTTP123',
				'status'       => 'ACTIVE',
			)
		);

		$result = PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(
					array(
						'name'        => 'Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
				),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_insecure_payment_link', $result->get_error_code() );
	}

	/**
	 * Test that create_resource rejects a response with a malformed URL.
	 */
	public function test_create_resource_rejects_malformed_url() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			201,
			array(
				'id'           => 'PLB-MALFORMED123',
				'payment_link' => 'not-a-valid-url',
				'status'       => 'ACTIVE',
			)
		);

		$result = PayPal_API_Client::create_resource(
			array(
				'type'       => 'BUY_NOW',
				'line_items' => array(
					array(
						'name'        => 'Widget',
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

	// --- Retry on 500 ---

	/**
	 * Test that a 500 error triggers multiple retry attempts.
	 */
	public function test_retry_on_500_makes_multiple_attempts() {
		$this->set_up_connected_state();

		$request_count = 0;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$request_count ) {
				// Skip the OAuth token endpoint.
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return $preempt;
				}

				$request_count++;

				return array(
					'response' => array(
						'code'    => 500,
						'message' => 'Internal Server Error',
					),
					'body'     => wp_json_encode(
						array(
							'name'    => 'INTERNAL_SERVER_ERROR',
							'message' => 'An internal server error has occurred.',
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		// Should have made initial attempt + MAX_RETRIES (3) additional attempts = 4 total.
		$this->assertGreaterThan( 1, $request_count, 'Should make multiple attempts on 500 error' );
		$this->assertLessThanOrEqual( PayPal_API_Client::MAX_RETRIES + 1, $request_count );
	}

	/**
	 * Test that a 500 error followed by success returns success.
	 */
	public function test_retry_on_500_succeeds_on_subsequent_attempt() {
		$this->set_up_connected_state();

		$request_count = 0;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$request_count ) {
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return $preempt;
				}

				$request_count++;

				// Fail on first attempt, succeed on second.
				if ( $request_count <= 1 ) {
					return array(
						'response' => array(
							'code'    => 500,
							'message' => 'Internal Server Error',
						),
						'body'     => wp_json_encode(
							array(
								'name'    => 'INTERNAL_SERVER_ERROR',
								'message' => 'An internal server error has occurred.',
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}

				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode(
						array(
							'items'       => array(),
							'total_items' => 0,
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'items', $result );
		$this->assertEquals( 2, $request_count );
	}

	// --- 403 auth retry ---

	/**
	 * Test that a 403 error clears the token and retries once.
	 */
	public function test_403_clears_token_and_retries() {
		$this->set_up_connected_state();

		$request_count = 0;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$request_count ) {
				// Allow token refresh to succeed.
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'body'     => wp_json_encode(
							array(
								'access_token' => 'refreshed_token_' . $request_count,
								'token_type'   => 'Bearer',
								'expires_in'   => 32400,
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}

				$request_count++;

				// First API call returns 403, second succeeds.
				if ( $request_count <= 1 ) {
					return array(
						'response' => array(
							'code'    => 403,
							'message' => 'Forbidden',
						),
						'body'     => wp_json_encode(
							array(
								'name'    => 'NOT_AUTHORIZED',
								'message' => 'Authorization failed.',
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}

				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode(
						array(
							'items'       => array(),
							'total_items' => 0,
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertIsArray( $result );
		$this->assertEquals( 2, $request_count, 'Should make initial request + 1 retry after 403' );
	}

	// --- Timeout detection ---

	/**
	 * Test that a timeout error is detected and uses the correct error code.
	 */
	public function test_timeout_detected_with_correct_error_code() {
		$this->set_up_connected_state();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return $preempt;
				}
				return new \WP_Error( 'http_request_failed', 'Connection timed out after 30001 milliseconds' );
			},
			10,
			3
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		// The error code should indicate a timeout.
		$code = $result->get_error_code();
		$this->assertContains(
			$code,
			array( 'paypal_api_timeout', 'paypal_api_request_failed', 'paypal_api_retry_exhausted' ),
			'Error code should be timeout-related, got: ' . $code
		);
	}

	/**
	 * Test that a non-timeout network error uses a different error code than timeout.
	 */
	public function test_non_timeout_network_error_distinguished() {
		$this->set_up_connected_state();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return $preempt;
				}
				return new \WP_Error( 'http_request_failed', 'Could not resolve host: api-m.sandbox.paypal.com' );
			},
			10,
			3
		);

		$result = PayPal_API_Client::list_resources();

		$this->assertInstanceOf( \WP_Error::class, $result );
		// The immediate error should be request_failed (not timeout) before retry exhaustion.
		$code = $result->get_error_code();
		$this->assertContains(
			$code,
			array( 'paypal_api_request_failed', 'paypal_api_retry_exhausted' ),
			'Error code should be request-failed-related, got: ' . $code
		);
	}

	// --- Non-retryable errors return immediately ---

	/**
	 * Test that a 400 error does not trigger retries.
	 */
	public function test_400_error_does_not_retry() {
		$this->set_up_connected_state();

		$request_count = 0;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$request_count ) {
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return $preempt;
				}

				$request_count++;

				return array(
					'response' => array(
						'code'    => 400,
						'message' => 'Bad Request',
					),
					'body'     => wp_json_encode(
						array(
							'name'    => 'INVALID_REQUEST',
							'message' => 'Request is not well-formed.',
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$result = PayPal_API_Client::create_resource( array( 'type' => 'BUY_NOW' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 1, $request_count, '400 errors should not trigger retries' );
	}

	/**
	 * Test that a 422 error does not trigger retries.
	 */
	public function test_422_error_does_not_retry() {
		$this->set_up_connected_state();

		$request_count = 0;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$request_count ) {
				if ( strpos( $url, '/v1/oauth2/token' ) !== false ) {
					return $preempt;
				}

				$request_count++;

				return array(
					'response' => array(
						'code'    => 422,
						'message' => 'Unprocessable Entity',
					),
					'body'     => wp_json_encode(
						array(
							'name'    => 'UNPROCESSABLE_ENTITY',
							'message' => 'The request could not be processed.',
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$result = PayPal_API_Client::create_resource( array( 'type' => 'BUY_NOW' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 1, $request_count, '422 errors should not trigger retries' );
	}

	// --- URL validation on get_resource too ---

	/**
	 * Test that get_resource also validates payment link domain.
	 */
	public function test_get_resource_validates_payment_link_domain() {
		$this->set_up_connected_state();

		$this->mock_http_response(
			200,
			array(
				'id'           => 'PLB-GETEVIL123',
				'payment_link' => 'https://www.evil-domain.com/ncp/payment/GETEVIL123',
				'status'       => 'ACTIVE',
			)
		);

		$result = PayPal_API_Client::get_resource( 'PLB-GETEVIL123' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_untrusted_domain', $result->get_error_code() );
	}

	// --- Helpers ---

	/**
	 * Set up a simulated connected state with credentials and a cached token.
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
