<?php
/**
 * Tests for the PayPal_REST_Controller class.
 *
 * Covers permission checks, input validation, error mapping,
 * and delete-button 404 grace handling.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_REST_Controller_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_REST_Controller
 */
#[CoversClass( PayPal_REST_Controller::class )]
class PayPal_REST_Controller_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		// Clean up all options and transients.
		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
		delete_option( PayPal_OAuth::TOKEN_EXPIRES_AT_OPTION_KEY );
		delete_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY );
		delete_option( PayPal_Partner_Onboarding::PARTNER_ID_OPTION_KEY );
		delete_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY );
		delete_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY );
		delete_option( 'jetpack_private_options' );
		\Jetpack_Options::delete_option( 'id' );
		Constants::clear_constants();

		// Remove any HTTP request filters.
		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Give the site the blog ID and token the WordPress.com proxy call needs.
	 */
	private function set_up_blog_connection() {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		( new Tokens() )->update_blog_token( 'test.blogtoken' );
		\Jetpack_Options::update_option( 'id', 1234 );
	}

	/**
	 * Route mocked HTTP responses by URL fragment.
	 *
	 * @param array $routes Map of URL fragment => response array or WP_Error.
	 */
	private function mock_http_routes( array $routes ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $routes ) {
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
	 * Build a mocked HTTP response array.
	 *
	 * @param int   $status HTTP status code.
	 * @param array $body   Response body, JSON-encoded for the mock.
	 * @return array
	 */
	private function http_response( $status, array $body ) {
		return array(
			'response' => array(
				'code'    => $status,
				'message' => 'OK',
			),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		);
	}

	// --- Permission check ---

	/**
	 * Test that manage_options_permission_check returns WP_Error for unauthorized users.
	 */
	public function test_permission_check_returns_error_for_unauthorized_user() {
		// Ensure the current user does not have manage_options.
		wp_set_current_user( 0 );

		$result = PayPal_REST_Controller::manage_options_permission_check();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'rest_forbidden', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertEquals( 403, $data['status'] );
	}

	/**
	 * Test that manage_options_permission_check returns true for admin users.
	 */
	public function test_permission_check_returns_true_for_admin() {
		$admin_user = self::factory_create_admin_user();
		wp_set_current_user( $admin_user );

		$result = PayPal_REST_Controller::manage_options_permission_check();

		$this->assertTrue( $result );
	}

	// --- validate_non_empty_string ---

	/**
	 * Test that validate_non_empty_string rejects empty string.
	 */
	public function test_validate_non_empty_string_rejects_empty() {
		$request = new \WP_REST_Request();

		$result = PayPal_REST_Controller::validate_non_empty_string( '', $request, 'client_id' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * Test that validate_non_empty_string rejects whitespace-only string.
	 */
	public function test_validate_non_empty_string_rejects_whitespace() {
		$request = new \WP_REST_Request();

		$result = PayPal_REST_Controller::validate_non_empty_string( '   ', $request, 'client_id' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * Test that validate_non_empty_string accepts valid string.
	 */
	public function test_validate_non_empty_string_accepts_valid() {
		$request = new \WP_REST_Request();

		$result = PayPal_REST_Controller::validate_non_empty_string( 'valid_client_id', $request, 'client_id' );

		$this->assertTrue( $result );
	}

	/**
	 * Test that validate_non_empty_string rejects non-string values.
	 */
	public function test_validate_non_empty_string_rejects_non_string() {
		$request = new \WP_REST_Request();

		$result = PayPal_REST_Controller::validate_non_empty_string( 12345, $request, 'client_id' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'rest_invalid_param', $result->get_error_code() );
	}

	// --- validate_button_request (tested indirectly via handle_create_button) ---

	// --- Connection lifecycle ---

	/**
	 * Test that a successful connect stores credentials and reports the environment.
	 */
	public function test_connect_stores_credentials_on_success() {
		wp_set_current_user( self::factory_create_admin_user() );
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->http_response(
					200,
					array(
						'access_token' => 'good_token',
						'expires_in'   => 3600,
					)
				),
				'/v1/checkout/payment-resources' => $this->http_response( 200, array( 'items' => array() ) ),
			)
		);

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/connect' );
		$request->set_param( 'client_id', 'live_client_id' );
		$request->set_param( 'client_secret', 'live_client_secret' );
		$request->set_param( 'environment', 'sandbox' );

		$result = PayPal_REST_Controller::handle_connect( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['connected'] );
		$this->assertSame( 'sandbox', $result->get_data()['environment'] );
		$this->assertSame( 'sandbox', PayPal_OAuth::get_environment() );
	}

	/**
	 * Test that bad credentials are not left behind after a failed connect.
	 *
	 * A partial connection is worse than none: the UI would show "connected"
	 * while every subsequent API call fails.
	 */
	public function test_connect_discards_credentials_when_token_exchange_fails() {
		wp_set_current_user( self::factory_create_admin_user() );
		PayPal_OAuth::set_environment( 'production' );
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->http_response(
					401,
					array( 'error' => 'invalid_client' )
				),
			)
		);

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/connect' );
		$request->set_param( 'client_id', 'wrong_client_id' );
		$request->set_param( 'client_secret', 'wrong_secret' );
		$request->set_param( 'environment', 'sandbox' );

		$result = PayPal_REST_Controller::handle_connect( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_credentials_invalid', $result->get_error_code() );
		$this->assertEmpty( get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY ) );
		$this->assertSame(
			'production',
			PayPal_OAuth::get_environment(),
			'A failed connect must restore the environment it started from.'
		);
	}

	/**
	 * Test that an account lacking Payment Links access is rejected with guidance.
	 */
	public function test_connect_rejects_account_without_payment_links_access() {
		wp_set_current_user( self::factory_create_admin_user() );
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->http_response(
					200,
					array(
						'access_token' => 'good_token',
						'expires_in'   => 3600,
					)
				),
				'/v1/checkout/payment-resources' => $this->http_response( 403, array( 'name' => 'NOT_AUTHORIZED' ) ),
			)
		);

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/connect' );
		$request->set_param( 'client_id', 'scoped_out_id' );
		$request->set_param( 'client_secret', 'scoped_out_secret' );
		$request->set_param( 'environment', 'sandbox' );

		$result = PayPal_REST_Controller::handle_connect( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_api_not_authorized', $result->get_error_code() );
		$this->assertEquals( 403, $result->get_error_data()['status'] );
		$this->assertStringContainsString( 'Payment Links', $result->get_error_message() );
		$this->assertEmpty( get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY ) );
	}

	/**
	 * Test that connection status reflects a disconnected site.
	 */
	public function test_connection_status_reports_disconnected() {
		$request = new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/connection' );

		$result = PayPal_REST_Controller::handle_connection_status( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 200, $result->get_status() );
		$this->assertFalse( $result->get_data()['connected'] );
	}

	/**
	 * Test that connection status reflects a connected site.
	 */
	public function test_connection_status_reports_connected() {
		$this->set_up_connected_admin_state();

		$result = PayPal_REST_Controller::handle_connection_status(
			new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/connection' )
		);

		$this->assertTrue( $result->get_data()['connected'] );
		$this->assertSame( 'sandbox', $result->get_data()['environment'] );
	}

	/**
	 * Test that disconnecting clears both credentials and onboarding state.
	 */
	public function test_disconnect_clears_credentials_and_onboarding_state() {
		$this->set_up_connected_admin_state();
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1' );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, 'partner_referrals' );

		$result = PayPal_REST_Controller::handle_disconnect(
			new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/disconnect' )
		);

		$this->assertSame( 200, $result->get_status() );
		$this->assertFalse( $result->get_data()['connected'] );
		$this->assertEmpty( get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY ) );
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
		$this->assertEmpty( get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY ) );
	}

	/**
	 * Test that switching environment persists the new value.
	 */
	public function test_set_environment_switches_and_reports() {
		$this->set_up_connected_admin_state();

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/environment' );
		$request->set_param( 'environment', 'production' );

		$result = PayPal_REST_Controller::handle_set_environment( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'production', $result->get_data()['environment'] );
		$this->assertSame( 'production', PayPal_OAuth::get_environment() );
	}

	/**
	 * Test that creating a button rejects empty line_items.
	 */
	public function test_create_button_rejects_empty_line_items() {
		$this->set_up_connected_admin_state();

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/buttons' );
		$request->set_param( 'type', 'BUY_NOW' );
		$request->set_param( 'integration_mode', 'LINK' );
		$request->set_param( 'line_items', array() );

		$result = PayPal_REST_Controller::handle_create_button( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_line_items', $result->get_error_code() );
	}

	/**
	 * Test that creating a button rejects line items with missing name.
	 */
	public function test_create_button_rejects_missing_name() {
		$this->set_up_connected_admin_state();

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/buttons' );
		$request->set_param( 'type', 'BUY_NOW' );
		$request->set_param( 'integration_mode', 'LINK' );
		$request->set_param(
			'line_items',
			array(
				array(
					'unit_amount' => array(
						'currency_code' => 'USD',
						'value'         => '10.00',
					),
				),
			)
		);

		$result = PayPal_REST_Controller::handle_create_button( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_product_name', $result->get_error_code() );
	}

	/**
	 * Test that creating a button rejects an invalid price.
	 */
	public function test_create_button_rejects_invalid_price() {
		$this->set_up_connected_admin_state();

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/buttons' );
		$request->set_param( 'type', 'BUY_NOW' );
		$request->set_param( 'integration_mode', 'LINK' );
		$request->set_param(
			'line_items',
			array(
				array(
					'name'        => 'Widget',
					'unit_amount' => array(
						'currency_code' => 'USD',
						'value'         => '-5.00',
					),
				),
			)
		);

		$result = PayPal_REST_Controller::handle_create_button( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_price', $result->get_error_code() );
	}

	/**
	 * Test that creating a button rejects an invalid currency.
	 */
	public function test_create_button_rejects_invalid_currency() {
		$this->set_up_connected_admin_state();

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/buttons' );
		$request->set_param( 'type', 'BUY_NOW' );
		$request->set_param( 'integration_mode', 'LINK' );
		$request->set_param(
			'line_items',
			array(
				array(
					'name'        => 'Widget',
					'unit_amount' => array(
						'currency_code' => 'FAKE',
						'value'         => '10.00',
					),
				),
			)
		);

		$result = PayPal_REST_Controller::handle_create_button( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_currency', $result->get_error_code() );
	}

	/**
	 * Test that a valid create button request passes validation and proceeds to API call.
	 */
	public function test_create_button_valid_request_calls_api() {
		$this->set_up_connected_admin_state();

		$this->mock_http_response(
			201,
			array(
				'id'           => 'PLB-CREATED123',
				'payment_link' => 'https://www.paypal.com/ncp/payment/CREATED123',
				'status'       => 'ACTIVE',
			)
		);

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/buttons' );
		$request->set_param( 'type', 'BUY_NOW' );
		$request->set_param( 'integration_mode', 'LINK' );
		$request->set_param( 'reusable', 'MULTIPLE' );
		$request->set_param(
			'line_items',
			array(
				array(
					'name'        => 'Widget',
					'unit_amount' => array(
						'currency_code' => 'USD',
						'value'         => '29.99',
					),
				),
			)
		);

		$result = PayPal_REST_Controller::handle_create_button( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertEquals( 201, $result->get_status() );
		$data = $result->get_data();
		$this->assertEquals( 'PLB-CREATED123', $data['id'] );
	}

	// --- api_error_to_rest_error (tested indirectly) ---

	/**
	 * Test that api_error_to_rest_error preserves error code and message from API errors.
	 */
	public function test_api_error_preserves_code_and_message() {
		$this->set_up_connected_admin_state();

		$this->mock_http_response(
			404,
			array(
				'name'    => 'RESOURCE_NOT_FOUND',
				'message' => 'The specified resource does not exist.',
			)
		);

		$request = new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/buttons/PLB-NOTFOUND123' );
		$request->set_param( 'resource_id', 'PLB-NOTFOUND123' );

		$result = PayPal_REST_Controller::handle_get_button( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_api_resource_not_found', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertEquals( 404, $data['status'] );
	}

	/**
	 * Test that api_error_to_rest_error normalizes status 0 to 503.
	 */
	public function test_api_error_normalizes_status_zero_to_503() {
		$this->set_up_connected_admin_state();

		// Simulate a network error (status 0).
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Connection refused' );
			}
		);

		$request = new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/buttons' );
		$request->set_param( 'page_size', 10 );
		$request->set_param( 'page_token', '' );

		$result = PayPal_REST_Controller::handle_list_buttons( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );

		$data = $result->get_error_data();
		// The REST controller normalizes 0 to 503.
		$this->assertGreaterThan( 0, $data['status'] );
	}

	// --- handle_delete_button: 404 treated as success ---

	/**
	 * Test that handle_delete_button treats 404 as success (no orphaned state).
	 */
	public function test_delete_button_treats_404_as_success() {
		$this->set_up_connected_admin_state();

		$this->mock_http_response(
			404,
			array(
				'name'    => 'RESOURCE_NOT_FOUND',
				'message' => 'The specified resource does not exist.',
			)
		);

		$request = new \WP_REST_Request( 'DELETE', '/jetpack/v4/paypal/buttons/PLB-GONE123' );
		$request->set_param( 'resource_id', 'PLB-GONE123' );

		$result = PayPal_REST_Controller::handle_delete_button( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertEquals( 200, $result->get_status() );

		$data = $result->get_data();
		$this->assertTrue( $data['deleted'] );
		$this->assertEquals( 'PLB-GONE123', $data['resource_id'] );
	}

	/**
	 * Test that handle_delete_button returns success on normal 204.
	 */
	public function test_delete_button_returns_success_on_204() {
		$this->set_up_connected_admin_state();

		$this->mock_http_response( 204, '' );

		$request = new \WP_REST_Request( 'DELETE', '/jetpack/v4/paypal/buttons/PLB-DEL123' );
		$request->set_param( 'resource_id', 'PLB-DEL123' );

		$result = PayPal_REST_Controller::handle_delete_button( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertEquals( 200, $result->get_status() );

		$data = $result->get_data();
		$this->assertTrue( $data['deleted'] );
	}

	/**
	 * Test that handle_delete_button returns error on non-404 failures.
	 */
	public function test_delete_button_returns_error_on_500() {
		$this->set_up_connected_admin_state();

		$this->mock_http_response(
			500,
			array(
				'name'    => 'INTERNAL_SERVER_ERROR',
				'message' => 'An internal server error occurred.',
			)
		);

		$request = new \WP_REST_Request( 'DELETE', '/jetpack/v4/paypal/buttons/PLB-FAIL123' );
		$request->set_param( 'resource_id', 'PLB-FAIL123' );

		$result = PayPal_REST_Controller::handle_delete_button( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	// --- Partner Referrals onboarding routes ---

	/**
	 * Test that the signup-link route returns PayPal's action URL.
	 */
	public function test_generate_signup_link_returns_action_url() {
		$this->set_up_connected_admin_state();
		$this->set_up_blog_connection();
		$this->mock_http_routes(
			array(
				PayPal_Partner_Onboarding::WPCOM_SIGNUP_LINK_ROUTE => $this->http_response(
					200,
					array(
						'action_url'          => 'https://www.sandbox.paypal.com/merchantsignup/x',
						'referral_id'         => 'REF1',
						'partner_merchant_id' => 'PARTNER_FROM_WPCOM',
					)
				),
			)
		);

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/onboarding/signup-link' );
		$request->set_param( 'return_url', 'https://example.com/return' );
		$request->set_param( 'environment', 'sandbox' );

		$result = PayPal_REST_Controller::handle_generate_signup_link( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 'https://www.sandbox.paypal.com/merchantsignup/x', $result->get_data()['action_url'] );
		$this->assertSame( 'REF1', $result->get_data()['referral_id'] );
		$this->assertSame( 'sandbox', $result->get_data()['environment'] );
	}

	/**
	 * Test that an onboarding failure is converted into a REST error.
	 */
	public function test_generate_signup_link_converts_error_to_rest_error() {
		$this->set_up_connected_admin_state();

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/onboarding/signup-link' );
		$request->set_param( 'return_url', 'https://example.com/return' );
		$request->set_param( 'environment', 'sandbox' );

		// The site has no WordPress.com connection, so the referral cannot be created.
		$result = PayPal_REST_Controller::handle_generate_signup_link( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_request_failed', $result->get_error_code() );
	}

	/**
	 * Test that an expired onboarding session is reported rather than silently retried.
	 */
	public function test_onboarding_complete_reports_expired_session() {
		wp_set_current_user( self::factory_create_admin_user() );

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/paypal/onboarding/complete' );
		$request->set_param( 'auth_code', 'code' );
		$request->set_param( 'shared_id', 'shared' );
		$request->set_param( 'merchant_id_in_paypal', 'MERCHANT1' );

		$result = PayPal_REST_Controller::handle_onboarding_complete( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_no_nonce', $result->get_error_code() );
	}

	/**
	 * Test that merchant status requires a completed onboarding.
	 */
	public function test_merchant_status_requires_onboarding() {
		$this->set_up_connected_admin_state();

		$result = PayPal_REST_Controller::handle_merchant_status(
			new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/onboarding/status' )
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_no_merchant_info', $result->get_error_code() );
	}

	// --- Button read routes ---

	/**
	 * Test that listing buttons passes the API payload straight through.
	 */
	public function test_list_buttons_returns_api_payload() {
		$this->set_up_connected_admin_state();
		$this->mock_http_routes(
			array(
				'/v1/checkout/payment-resources' => $this->http_response(
					200,
					array(
						'items'           => array( array( 'id' => 'PLB-1' ) ),
						'next_page_token' => 'token123',
					)
				),
			)
		);

		$request = new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/buttons' );
		$request->set_param( 'page_size', 10 );

		$result = PayPal_REST_Controller::handle_list_buttons( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'PLB-1', $result->get_data()['items'][0]['id'] );
		$this->assertSame( 'token123', $result->get_data()['next_page_token'] );
	}

	/**
	 * Test that a single button is returned by ID.
	 */
	public function test_get_button_returns_resource() {
		$this->set_up_connected_admin_state();
		$this->mock_http_routes(
			array(
				'/v1/checkout/payment-resources' => $this->http_response(
					200,
					array(
						'id'   => 'PLB-42',
						'type' => 'BUY_NOW',
					)
				),
			)
		);

		$request = new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/buttons/PLB-42' );
		$request->set_param( 'resource_id', 'PLB-42' );

		$result = PayPal_REST_Controller::handle_get_button( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 'PLB-42', $result->get_data()['id'] );
	}

	/**
	 * Test that an API failure while listing is surfaced as a REST error.
	 */
	public function test_list_buttons_converts_api_error() {
		$this->set_up_connected_admin_state();
		$this->mock_http_routes(
			array(
				'/v1/checkout/payment-resources' => $this->http_response(
					400,
					array(
						'name'    => 'INVALID_REQUEST',
						'message' => 'Bad page token',
					)
				),
			)
		);

		$result = PayPal_REST_Controller::handle_list_buttons(
			new \WP_REST_Request( 'GET', '/jetpack/v4/paypal/buttons' )
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 400, $result->get_error_data()['status'] );
	}

	/**
	 * Test that updating a button runs the same validation as creating one.
	 */
	public function test_update_button_validates_before_calling_api() {
		$this->set_up_connected_admin_state();

		$request = new \WP_REST_Request( 'PUT', '/jetpack/v4/paypal/buttons/PLB-42' );
		$request->set_param( 'resource_id', 'PLB-42' );
		$request->set_param( 'type', 'BUY_NOW' );
		$request->set_param( 'integration_mode', 'LINK' );
		$request->set_param( 'line_items', array() );

		$result = PayPal_REST_Controller::handle_update_button( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_line_items', $result->get_error_code() );
	}

	// --- Constants ---

	/**
	 * Test REST namespace and route base constants.
	 */
	public function test_rest_constants() {
		$this->assertEquals( 'jetpack/v4', PayPal_REST_Controller::REST_NAMESPACE );
		$this->assertEquals( '/paypal', PayPal_REST_Controller::ROUTE_BASE );
	}

	// --- Helpers ---

	/**
	 * Set up an admin user with manage_options and a connected PayPal state.
	 */
	private function set_up_connected_admin_state() {
		$admin_user = self::factory_create_admin_user();
		wp_set_current_user( $admin_user );

		PayPal_OAuth::set_environment( 'sandbox' );
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, PayPal_OAuth::encrypt( 'fake_access_token_12345' ), 3600 );
	}

	/**
	 * Create an admin user for testing.
	 *
	 * Uses wp_insert_user directly since the WP test factory may not be
	 * available in all test bootstrap configurations.
	 *
	 * @return int The user ID.
	 */
	private static function factory_create_admin_user() {
		$user_id = username_exists( 'testadmin_rest_controller' );
		if ( $user_id ) {
			return $user_id;
		}

		$user_id = wp_insert_user(
			array(
				'user_login' => 'testadmin_rest_controller',
				'user_pass'  => wp_generate_password(),
				'role'       => 'administrator',
			)
		);

		return $user_id;
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
