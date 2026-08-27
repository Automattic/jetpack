<?php
/**
 * Tests for the PayPal_Partner_Onboarding class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Partner_Onboarding_Test
 *
 * @coversDefaultClass Automattic\Jetpack\PaypalPayments\PayPal_Partner_Onboarding
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Partner_Onboarding
 */
#[CoversClass( PayPal_Partner_Onboarding::class )]
class PayPal_Partner_Onboarding_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		delete_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY );
		delete_option( PayPal_Partner_Onboarding::PARTNER_ID_OPTION_KEY );
		delete_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY );
		delete_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY );
		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
		delete_option( PayPal_OAuth::TOKEN_EXPIRES_AT_OPTION_KEY );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Put the site in a state where partner-level credentials are configured.
	 *
	 * Caches an access token directly so the OAuth token exchange does not need
	 * to be mocked by every test.
	 */
	private function set_up_partner_state() {
		PayPal_OAuth::set_environment( 'sandbox' );
		PayPal_OAuth::store_credentials( 'partner_client_id', 'partner_client_secret' );
		PayPal_Partner_Onboarding::set_partner_id( 'PARTNER123' );

		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, PayPal_OAuth::encrypt( 'partner_access_token' ), 3600 );
	}

	/**
	 * Route mocked HTTP responses by URL fragment.
	 *
	 * @param array $routes    Map of URL fragment => response array or WP_Error.
	 * @param array $requests  Optional. Collected by reference as [ url, args ] pairs.
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

	/**
	 * Test partner ID storage and retrieval.
	 */
	public function test_partner_id_storage() {
		$this->assertEmpty( PayPal_Partner_Onboarding::get_partner_id() );

		PayPal_Partner_Onboarding::set_partner_id( 'TEST_PARTNER_123' );
		$this->assertEquals( 'TEST_PARTNER_123', PayPal_Partner_Onboarding::get_partner_id() );
	}

	/**
	 * Test merchant ID retrieval when not set.
	 */
	public function test_merchant_id_empty_by_default() {
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
	}

	/**
	 * Test generate_signup_link fails without partner ID.
	 */
	public function test_generate_signup_link_requires_partner_id() {
		$result = PayPal_Partner_Onboarding::generate_signup_link(
			'https://example.com/return',
			'sandbox'
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_no_partner_id', $result->get_error_code() );
	}

	// --- generate_signup_link ---

	/**
	 * Test that a non-HTTPS return URL is rejected for production onboarding.
	 */
	public function test_generate_signup_link_rejects_insecure_return_url() {
		$this->set_up_partner_state();

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'http://example.com/return', 'production' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_insecure_url', $result->get_error_code() );
		$this->assertEquals( 400, $result->get_error_data()['status'] );
	}

	/**
	 * Test that sandbox onboarding tolerates a plain-HTTP return URL.
	 *
	 * Local sandbox sites are frequently served over HTTP, so the HTTPS guard
	 * must apply to production only.
	 */
	public function test_generate_signup_link_allows_insecure_return_url_in_sandbox() {
		$this->set_up_partner_state();
		$this->mock_http_routes(
			array(
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'action_url',
								'href' => 'https://www.sandbox.paypal.com/merchantsignup/x',
							),
						),
					)
				),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'http://example.com/return', 'sandbox' );

		$this->assertIsArray( $result );
		$this->assertSame( 'https://www.sandbox.paypal.com/merchantsignup/x', $result['action_url'] );
	}

	/**
	 * Test that a successful referral returns the action URL, referral ID, and tracking ID.
	 */
	public function test_generate_signup_link_returns_action_url_and_referral_id() {
		$this->set_up_partner_state();
		$this->mock_http_routes(
			array(
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'self',
								'href' => 'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals/REFERRAL789',
							),
							array(
								'rel'  => 'action_url',
								'href' => 'https://www.sandbox.paypal.com/merchantsignup/partner/onboardingentry?token=abc',
							),
						),
					)
				),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertIsArray( $result );
		$this->assertSame(
			'https://www.sandbox.paypal.com/merchantsignup/partner/onboardingentry?token=abc',
			$result['action_url']
		);
		$this->assertSame( 'REFERRAL789', $result['referral_id'] );
		$this->assertNotEmpty( $result['tracking_id'] );
	}

	/**
	 * Test that generating a signup link stores an encrypted, single-use seller nonce.
	 */
	public function test_generate_signup_link_stores_encrypted_seller_nonce() {
		$this->set_up_partner_state();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'action_url',
								'href' => 'https://www.sandbox.paypal.com/merchantsignup/x',
							),
						),
					)
				),
			),
			$requests
		);

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$stored = get_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY );
		$this->assertNotEmpty( $stored );

		$nonce = PayPal_OAuth::decrypt( $stored );
		$this->assertNotFalse( $nonce, 'The stored nonce should decrypt with the site key.' );

		// PayPal requires the seller nonce to be 43-128 characters.
		$this->assertGreaterThanOrEqual( 43, strlen( $nonce ) );

		// The plaintext nonce is sent to PayPal, and it must match what we stored.
		$referral = end( $requests );
		$body     = json_decode( $referral['args']['body'], true );
		$sent     = $body['operations'][0]['api_integration_preference']['rest_api_integration']['first_party_details']['seller_nonce'];
		$this->assertSame( $nonce, $sent );
	}

	/**
	 * Test that the referral request asks for the expected products and features.
	 */
	public function test_generate_signup_link_requests_expected_products_and_features() {
		$this->set_up_partner_state();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'action_url',
								'href' => 'https://www.sandbox.paypal.com/merchantsignup/x',
							),
						),
					)
				),
			),
			$requests
		);

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$referral = end( $requests );
		$this->assertStringStartsWith( PayPal_OAuth::SANDBOX_BASE_URL, $referral['url'] );

		$body = json_decode( $referral['args']['body'], true );
		$this->assertSame( PayPal_Partner_Onboarding::ONBOARDING_PRODUCTS, $body['products'] );
		$this->assertSame(
			PayPal_Partner_Onboarding::ONBOARDING_FEATURES,
			$body['operations'][0]['api_integration_preference']['rest_api_integration']['first_party_details']['features']
		);
		$this->assertSame( 'https://example.com/return', $body['partner_config_override']['return_url'] );
		$this->assertTrue( $body['legal_consents'][0]['granted'] );
	}

	/**
	 * Test that a PayPal error status produces a generic, non-leaking error.
	 */
	public function test_generate_signup_link_handles_error_status() {
		$this->set_up_partner_state();
		$this->mock_http_routes(
			array(
				'/v2/customer/partner-referrals' => $this->http_response(
					422,
					array( 'name' => 'UNPROCESSABLE_ENTITY' )
				),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_failed', $result->get_error_code() );
		$this->assertEquals( 422, $result->get_error_data()['status'] );
		$this->assertStringNotContainsString( 'UNPROCESSABLE_ENTITY', $result->get_error_message() );
	}

	/**
	 * Test that a 201 without an action_url link is reported rather than returned as success.
	 */
	public function test_generate_signup_link_requires_action_url_in_response() {
		$this->set_up_partner_state();
		$this->mock_http_routes(
			array(
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'self',
								'href' => 'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals/REFERRAL789',
							),
						),
					)
				),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_no_url', $result->get_error_code() );
	}

	/**
	 * Test that a transport-level failure is wrapped in a descriptive error.
	 */
	public function test_generate_signup_link_handles_transport_error() {
		$this->set_up_partner_state();
		$this->mock_http_routes(
			array(
				'/v2/customer/partner-referrals' => new \WP_Error( 'http_request_failed', 'Connection timed out' ),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_request_failed', $result->get_error_code() );
		$this->assertStringContainsString( 'Connection timed out', $result->get_error_message() );
	}

	/**
	 * Test complete_onboarding fails without seller nonce.
	 */
	public function test_complete_onboarding_requires_seller_nonce() {
		$result = PayPal_Partner_Onboarding::complete_onboarding(
			'test_auth_code',
			'test_shared_id',
			'TEST_MERCHANT_ID'
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_no_nonce', $result->get_error_code() );
	}

	/**
	 * Test check_merchant_status fails without merchant info.
	 */
	public function test_check_merchant_status_requires_merchant_info() {
		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_no_merchant_info', $result->get_error_code() );
	}

	/**
	 * Test that an undecryptable nonce is reported and cleared.
	 *
	 * A nonce that will not decrypt means the stored value is corrupt or the site
	 * key changed; either way the flow cannot continue and the stale transient
	 * must not be left behind to fail again on the next attempt.
	 */
	public function test_complete_onboarding_rejects_corrupt_seller_nonce() {
		$this->set_up_partner_state();
		set_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY, 'not-a-valid-ciphertext', 1800 );

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', 'MERCHANT1' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_nonce_corrupt', $result->get_error_code() );
		$this->assertEmpty(
			get_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY ),
			'A corrupt nonce should be deleted so the next attempt starts clean.'
		);
	}

	/**
	 * Test that a failed token exchange surfaces PayPal's error description.
	 */
	public function test_complete_onboarding_surfaces_token_error_description() {
		$this->set_up_partner_state();
		set_transient(
			PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY,
			PayPal_OAuth::encrypt( 'seller_nonce_value' ),
			1800
		);
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->http_response(
					401,
					array( 'error_description' => 'Client Authentication failed' )
				),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', 'MERCHANT1' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_token_error', $result->get_error_code() );
		$this->assertStringContainsString( 'Client Authentication failed', $result->get_error_message() );
		$this->assertEquals( 401, $result->get_error_data()['status'] );
	}

	/**
	 * Test that credentials missing from PayPal's response are treated as an error.
	 */
	public function test_complete_onboarding_rejects_incomplete_credentials() {
		$this->set_up_partner_state();
		set_transient(
			PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY,
			PayPal_OAuth::encrypt( 'seller_nonce_value' ),
			1800
		);
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                    => $this->http_response(
					200,
					array(
						'access_token' => 'seller_token',
						'expires_in'   => 3600,
					)
				),
				'/merchant-integrations/credentials/' => $this->http_response(
					200,
					array( 'client_id' => 'only_the_id' )
				),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', 'MERCHANT1' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_creds_error', $result->get_error_code() );
	}

	/**
	 * Test the full onboarding exchange: credentials stored, merchant recorded, nonce consumed.
	 */
	public function test_complete_onboarding_stores_credentials_and_consumes_nonce() {
		$this->set_up_partner_state();
		set_transient(
			PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY,
			PayPal_OAuth::encrypt( 'seller_nonce_value' ),
			1800
		);
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                    => $this->http_response(
					200,
					array(
						'access_token' => 'seller_token',
						'expires_in'   => 3600,
					)
				),
				'/merchant-integrations/credentials/' => $this->http_response(
					200,
					array(
						'client_id'     => 'merchant_client_id',
						'client_secret' => 'merchant_client_secret',
					)
				),
				'/v1/checkout/payment-resources'      => $this->http_response( 200, array( 'items' => array() ) ),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', '  MERCHANT1  ' );

		$this->assertTrue( $result );
		$this->assertSame( 'MERCHANT1', PayPal_Partner_Onboarding::get_merchant_id() );
		$this->assertSame(
			'partner_referrals',
			get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY )
		);
		$this->assertEmpty(
			get_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY ),
			'The seller nonce is single-use and must be deleted after a successful exchange.'
		);

		// The merchant's credentials replace the partner credentials that were seeded.
		$credentials = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		$this->assertSame( 'merchant_client_id', PayPal_OAuth::decrypt( $credentials['encrypted_client_id'] ) );
		$this->assertSame( 'merchant_client_secret', PayPal_OAuth::decrypt( $credentials['encrypted_client_secret'] ) );
	}

	/**
	 * Test that an account without Payment Links access fails the final validation step.
	 */
	public function test_complete_onboarding_reports_missing_api_access() {
		$this->set_up_partner_state();
		set_transient(
			PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY,
			PayPal_OAuth::encrypt( 'seller_nonce_value' ),
			1800
		);
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                    => $this->http_response(
					200,
					array(
						'access_token' => 'seller_token',
						'expires_in'   => 3600,
					)
				),
				'/merchant-integrations/credentials/' => $this->http_response(
					200,
					array(
						'client_id'     => 'merchant_client_id',
						'client_secret' => 'merchant_client_secret',
					)
				),
				'/v1/checkout/payment-resources'      => $this->http_response( 403, array( 'name' => 'NOT_AUTHORIZED' ) ),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', 'MERCHANT1' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_api_not_authorized', $result->get_error_code() );
	}

	// --- check_merchant_status ---

	/**
	 * Test that merchant status is normalized into booleans the UI can rely on.
	 */
	public function test_check_merchant_status_returns_normalized_status() {
		$this->set_up_partner_state();
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1' );
		$this->mock_http_routes(
			array(
				'/merchant-integrations/' => $this->http_response(
					200,
					array(
						'payments_receivable'     => true,
						'primary_email_confirmed' => false,
						'products'                => array( array( 'name' => 'EXPRESS_CHECKOUT' ) ),
					)
				),
			)
		);

		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertIsArray( $result );
		$this->assertSame( 'MERCHANT1', $result['merchant_id'] );
		$this->assertTrue( $result['payments_receivable'] );
		$this->assertFalse( $result['primary_email_confirmed'] );
		$this->assertSame( array( array( 'name' => 'EXPRESS_CHECKOUT' ) ), $result['products'] );
	}

	/**
	 * Test that a missing products key defaults to an empty array rather than a notice.
	 */
	public function test_check_merchant_status_defaults_missing_products() {
		$this->set_up_partner_state();
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1' );
		$this->mock_http_routes(
			array(
				'/merchant-integrations/' => $this->http_response(
					200,
					array( 'payments_receivable' => true )
				),
			)
		);

		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertSame( array(), $result['products'] );
		$this->assertFalse( $result['primary_email_confirmed'] );
	}

	/**
	 * Test that a non-200 merchant status response is reported as an error.
	 */
	public function test_check_merchant_status_handles_error_status() {
		$this->set_up_partner_state();
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1' );
		$this->mock_http_routes(
			array(
				'/merchant-integrations/' => $this->http_response( 404, array( 'name' => 'NOT_FOUND' ) ),
			)
		);

		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_merchant_status_error', $result->get_error_code() );
		$this->assertEquals( 404, $result->get_error_data()['status'] );
	}

	/**
	 * Test that the partner ID is sanitized on the way in.
	 */
	public function test_set_partner_id_sanitizes_input() {
		PayPal_Partner_Onboarding::set_partner_id( '  <b>PARTNER9</b>  ' );

		$this->assertSame( 'PARTNER9', PayPal_Partner_Onboarding::get_partner_id() );
	}

	/**
	 * Test cleanup removes all onboarding options.
	 */
	public function test_cleanup_removes_onboarding_data() {
		set_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY, 'test_nonce', 30 * MINUTE_IN_SECONDS );
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'test_merchant' );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, 'partner_referrals' );

		PayPal_Partner_Onboarding::cleanup();

		$this->assertFalse( get_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY ) );
		$this->assertFalse( get_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY ) );
		$this->assertFalse( get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY ) );
	}

	/**
	 * Test cleanup does not remove partner ID (site-level config).
	 */
	public function test_cleanup_preserves_partner_id() {
		PayPal_Partner_Onboarding::set_partner_id( 'TEST_PARTNER_123' );

		PayPal_Partner_Onboarding::cleanup();

		$this->assertEquals( 'TEST_PARTNER_123', PayPal_Partner_Onboarding::get_partner_id() );
	}

	/**
	 * Test onboarding products constant.
	 */
	public function test_onboarding_products() {
		$this->assertContains( 'EXPRESS_CHECKOUT', PayPal_Partner_Onboarding::ONBOARDING_PRODUCTS );
	}

	/**
	 * Test onboarding features constant.
	 */
	public function test_onboarding_features() {
		$features = PayPal_Partner_Onboarding::ONBOARDING_FEATURES;
		$this->assertContains( 'PAYMENT', $features );
		$this->assertContains( 'REFUND', $features );
		$this->assertContains( 'ACCESS_MERCHANT_INFORMATION', $features );
	}
}
