<?php
/**
 * Tests for the PayPal_Partner_Onboarding class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
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

		// The blog connection is per-test; leaving it set makes later tests that
		// expect a disconnected site pass or fail depending on test order.
		delete_option( 'jetpack_private_options' );
		\Jetpack_Options::delete_option( 'id' );
		Constants::clear_constants();

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Put the site in a state where it can talk to WordPress.com as a blog.
	 *
	 * The signup-link call proxies through WordPress.com, which needs a blog ID
	 * and a blog token to sign the request.
	 */
	private function set_up_connected_site() {
		PayPal_OAuth::set_environment( 'sandbox' );

		// The Connection package builds the WordPress.com API URL from this; without
		// it the URL has no host and request signing fails.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		( new Tokens() )->update_blog_token( 'test.blogtoken' );
		\Jetpack_Options::update_option( 'id', 1234 );
	}

	/**
	 * Put the site in a state where merchant credentials are stored.
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
	 * Mock the wpcom signup-link proxy route.
	 *
	 * @param array|\WP_Error $response Response to return for the proxy call.
	 * @param array           $requests Collected by reference as [ url, args ] pairs.
	 */
	private function mock_wpcom_signup_link( $response, &$requests = null ) {
		$this->mock_http_routes(
			array( PayPal_Partner_Onboarding::WPCOM_SIGNUP_LINK_ROUTE => $response ),
			$requests
		);
	}

	/**
	 * A successful signup-link response from WordPress.com.
	 *
	 * @return array
	 */
	private function signup_link_success() {
		return $this->http_response(
			200,
			array(
				'action_url'          => 'https://www.sandbox.paypal.com/merchantsignup/x',
				'referral_id'         => 'REFERRAL789',
				'partner_merchant_id' => 'PARTNER_FROM_WPCOM',
			)
		);
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

	// --- generate_signup_link ---

	/**
	 * Test that a non-HTTPS return URL is rejected for production onboarding.
	 */
	public function test_generate_signup_link_rejects_insecure_return_url() {
		$this->set_up_connected_site();

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
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link( $this->signup_link_success() );

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'http://example.com/return', 'sandbox' );

		$this->assertIsArray( $result );
		$this->assertSame( 'https://www.sandbox.paypal.com/merchantsignup/x', $result['action_url'] );
	}

	/**
	 * Test that a successful referral returns the action URL, referral ID, and tracking ID.
	 */
	public function test_generate_signup_link_returns_action_url_and_referral_id() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link( $this->signup_link_success() );

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertIsArray( $result );
		$this->assertSame( 'https://www.sandbox.paypal.com/merchantsignup/x', $result['action_url'] );
		$this->assertSame( 'REFERRAL789', $result['referral_id'] );
		$this->assertNotEmpty( $result['tracking_id'] );
	}

	/**
	 * Test that the referral is created through WordPress.com, not from the site.
	 *
	 * Automattic's PayPal platform credentials must never reach the site, so the
	 * site may only talk to the wpcom proxy route.
	 */
	public function test_generate_signup_link_goes_through_wpcom_not_paypal() {
		$this->set_up_connected_site();
		$requests = array();
		$this->mock_wpcom_signup_link( $this->signup_link_success(), $requests );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertNotEmpty( $requests );
		foreach ( $requests as $request ) {
			$this->assertStringContainsString( 'public-api.wordpress.com', $request['url'] );
			$this->assertStringNotContainsString( 'paypal.com', $request['url'] );
		}
	}

	/**
	 * Test that generating a signup link stores an encrypted, single-use seller nonce.
	 *
	 * The nonce is the PKCE code_verifier for the later auth code exchange, so it
	 * has to stay on the site and match what WordPress.com forwards to PayPal.
	 */
	public function test_generate_signup_link_stores_encrypted_seller_nonce() {
		$this->set_up_connected_site();
		$requests = array();
		$this->mock_wpcom_signup_link( $this->signup_link_success(), $requests );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$stored = get_transient( PayPal_Partner_Onboarding::SELLER_NONCE_TRANSIENT_KEY );
		$this->assertNotEmpty( $stored );

		$nonce = PayPal_OAuth::decrypt( $stored );
		$this->assertNotFalse( $nonce, 'The stored nonce should decrypt with the site key.' );

		/*
		 * PayPal's schema sets minLength 44 / maxLength 128 on seller_nonce and
		 * rejects anything shorter with a bare "violates schema" 400. Its own
		 * field description says "43-128", which is what this assertion used to
		 * allow — and the generator produced exactly 43, so every real referral
		 * failed while the test passed. Assert the enforced bound, not the prose.
		 */
		$this->assertGreaterThanOrEqual( 44, strlen( $nonce ) );
		$this->assertLessThanOrEqual( 128, strlen( $nonce ) );
		$this->assertMatchesRegularExpression( '/^[a-zA-Z0-9\-_:]+$/', $nonce );

		$body = (array) json_decode( end( $requests )['args']['body'], true );
		$sent = $body['referral']['operations'][0]['api_integration_preference']['rest_api_integration']['first_party_details']['seller_nonce'];
		$this->assertSame( $nonce, $sent );
	}

	/**
	 * Test that the referral body sent to WordPress.com carries the expected products and features.
	 */
	public function test_generate_signup_link_sends_expected_referral_body() {
		$this->set_up_connected_site();
		$requests = array();
		$this->mock_wpcom_signup_link( $this->signup_link_success(), $requests );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$body = (array) json_decode( end( $requests )['args']['body'], true );

		$this->assertSame( 'sandbox', $body['environment'] );
		$this->assertSame( PayPal_Partner_Onboarding::ONBOARDING_PRODUCTS, $body['referral']['products'] );
		$this->assertSame(
			PayPal_Partner_Onboarding::ONBOARDING_FEATURES,
			$body['referral']['operations'][0]['api_integration_preference']['rest_api_integration']['first_party_details']['features']
		);
		$this->assertSame( 'https://example.com/return', $body['referral']['partner_config_override']['return_url'] );
		$this->assertTrue( $body['referral']['legal_consents'][0]['granted'] );

		// PayPal caps return_url at 127 characters and rejects longer ones.
		$this->assertLessThanOrEqual( 127, strlen( $body['referral']['partner_config_override']['return_url'] ) );
		$this->assertLessThanOrEqual(
			127,
			strlen( $body['referral']['partner_config_override']['return_url_description'] )
		);

		// tracking_id is 1-127 characters.
		$this->assertGreaterThanOrEqual( 1, strlen( $body['referral']['tracking_id'] ) );
		$this->assertLessThanOrEqual( 127, strlen( $body['referral']['tracking_id'] ) );
	}

	/**
	 * Test that a rejected referral carries PayPal's own diagnostics.
	 *
	 * PayPal's message for a schema violation is always the same generic
	 * sentence; `details` names the offending field and `debug_id` is what
	 * PayPal support traces on, so both have to survive the hop back.
	 */
	public function test_generate_signup_link_surfaces_paypal_error_details() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link(
			array(
				'response' => array( 'code' => 400 ),
				'body'     => wp_json_encode(
					array(
						'code'    => 'paypal_referral_failed',
						'message' => 'Request is not well-formed, syntactically incorrect, or violates schema.',
						'data'    => array(
							'status'          => 400,
							'paypal_error'    => 'INVALID_REQUEST',
							'paypal_debug_id' => 'abc123def456',
							'paypal_details'  => array(
								array(
									'field' => '/operations/0/api_integration_preference/rest_api_integration/first_party_details/seller_nonce',
									'issue' => 'INVALID_STRING_LENGTH',
								),
							),
						),
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$data = $result->get_error_data();

		$this->assertSame( 'INVALID_REQUEST', $data['paypal_error'] );
		$this->assertSame( 'abc123def456', $data['paypal_debug_id'] );
		$this->assertSame( 'INVALID_STRING_LENGTH', $data['paypal_details'][0]['issue'] );
		$this->assertStringContainsString( 'seller_nonce', $data['paypal_details'][0]['field'] );
	}

	/**
	 * Test that the partner merchant ID returned by WordPress.com is stored.
	 *
	 * The auth code exchange and the status check both address PayPal as the
	 * partner, so without this the flow cannot continue past the signup link.
	 */
	public function test_generate_signup_link_stores_partner_merchant_id() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link( $this->signup_link_success() );

		$this->assertEmpty( PayPal_Partner_Onboarding::get_partner_id() );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertSame( 'PARTNER_FROM_WPCOM', PayPal_Partner_Onboarding::get_partner_id() );
	}

	/**
	 * Test that an error status from WordPress.com is reported.
	 */
	public function test_generate_signup_link_handles_error_status() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link(
			$this->http_response(
				500,
				array( 'code' => 'platform_credentials_missing' )
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_failed', $result->get_error_code() );
		$this->assertEquals( 500, $result->get_error_data()['status'] );
	}

	/**
	 * Test that a 200 without an action_url is reported rather than returned as success.
	 */
	public function test_generate_signup_link_requires_action_url_in_response() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link(
			$this->http_response( 200, array( 'referral_id' => 'REFERRAL789' ) )
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_no_url', $result->get_error_code() );
	}

	/**
	 * Test that a transport-level failure is wrapped in a descriptive error.
	 */
	public function test_generate_signup_link_handles_transport_error() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link( new \WP_Error( 'http_request_failed', 'Connection timed out' ) );

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_request_failed', $result->get_error_code() );
		$this->assertStringContainsString( 'Connection timed out', $result->get_error_message() );
	}

	/**
	 * Test that a site with no WordPress.com connection cannot start onboarding.
	 */
	public function test_generate_signup_link_requires_a_wpcom_connection() {
		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_referral_request_failed', $result->get_error_code() );
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
	 * Test that a 403 on the feature probe leaves nothing connected behind.
	 *
	 * The credentials are stored before they are validated, so without a
	 * rollback the site reports itself connected while the editor shows the
	 * failure -- and the merchant is told to reconnect an account every other
	 * screen already treats as connected.
	 */
	public function test_complete_onboarding_discards_credentials_when_the_api_is_not_authorized() {
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
						'scope'        => 'https://uri.paypal.com/services/payments/payment openid',
					)
				),
				'/merchant-integrations/credentials/' => $this->http_response(
					200,
					array(
						'client_id'     => 'merchant_client_id',
						'client_secret' => 'merchant_client_secret',
					)
				),
				'/v1/checkout/payment-resources'      => $this->http_response(
					403,
					array(
						'name'     => 'NOT_AUTHORIZED',
						'debug_id' => 'debug123',
					)
				),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', 'MERCHANT1' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_api_not_authorized', $result->get_error_code() );

		// "Your app" is ambiguous — the probe runs as the seller's own app, not
		// the partner app a merchant would check — so the error must name it,
		// along with PayPal's own diagnosis.
		$this->assertStringContainsString( 'merchant…', $result->get_error_message() );
		$this->assertStringContainsString( 'NOT_AUTHORIZED', $result->get_error_message() );
		$this->assertStringContainsString( 'debug123', $result->get_error_message() );
		// The scope list is the ground truth on whether the referral granted the
		// Payment Links & Buttons API at all.
		$this->assertStringContainsString( '…/payments/payment', $result->get_error_message() );

		$this->assertFalse(
			PayPal_OAuth::has_credentials(),
			'A failed onboarding must not leave the site looking connected.'
		);
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
		$this->assertEmpty( get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY ) );
	}

	/**
	 * Test that a platform misconfiguration is reported, not hidden.
	 *
	 * "Please try again" is wrong advice when WordPress.com is missing a
	 * platform credential: retrying cannot clear it, and the generic message
	 * buries the one line that names what to configure.
	 */
	public function test_generate_signup_link_surfaces_platform_misconfiguration() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link(
			array(
				'response' => array( 'code' => 500 ),
				'body'     => wp_json_encode(
					array(
						'code'    => 'platform_partner_merchant_id_missing',
						'message' => 'PayPal platform credentials for the sandbox environment are missing the partner merchant ID (PAYPAL_BUTTONS_SANDBOX_PARTNER_MERCHANT_ID).',
						'data'    => array( 'status' => 500 ),
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertStringContainsString(
			'PAYPAL_BUTTONS_SANDBOX_PARTNER_MERCHANT_ID',
			$result->get_error_message()
		);
		$this->assertSame(
			'platform_partner_merchant_id_missing',
			$result->get_error_data()['platform_error_code']
		);
	}

	/**
	 * Test that a PayPal-side failure keeps the friendly message.
	 */
	public function test_generate_signup_link_keeps_the_friendly_message_for_paypal_errors() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link(
			array(
				'response' => array( 'code' => 400 ),
				'body'     => wp_json_encode(
					array(
						'code'    => 'paypal_referral_failed',
						'message' => 'Request is not well-formed, syntactically incorrect, or violates schema.',
						'data'    => array( 'status' => 400 ),
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertStringContainsString( 'Could not create a PayPal onboarding link', $result->get_error_message() );
		// The raw reason is still available to whoever is debugging.
		$this->assertStringContainsString( 'violates schema', $result->get_error_data()['paypal_message'] );
	}

	/**
	 * Test that the merchant ID falls back to PayPal's payer_id.
	 *
	 * PayPal puts `merchantIdInPayPal` on the return URL but sends `authCode`
	 * and `sharedId` by postMessage, so a caller that only sees the postMessage
	 * has no merchant ID to pass. The credentials response carries the same
	 * value as `payer_id`, which is what PayPal recommends identifying a
	 * merchant by.
	 */
	public function test_complete_onboarding_falls_back_to_payer_id_for_merchant_id() {
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
						'payer_id'      => 'PAYERID123',
					)
				),
				'/v1/checkout/payment-resources'      => $this->http_response( 200, array( 'items' => array() ) ),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', '' );

		$this->assertTrue( $result );
		$this->assertSame( 'PAYERID123', PayPal_Partner_Onboarding::get_merchant_id() );
	}

	/**
	 * Test that an explicit merchant ID wins over payer_id.
	 */
	public function test_complete_onboarding_prefers_the_supplied_merchant_id() {
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
						'payer_id'      => 'PAYERID123',
					)
				),
				'/v1/checkout/payment-resources'      => $this->http_response( 200, array( 'items' => array() ) ),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', 'MERCHANT1' );

		$this->assertTrue( $result );
		$this->assertSame( 'MERCHANT1', PayPal_Partner_Onboarding::get_merchant_id() );
	}

	/**
	 * Test that onboarding fails rather than storing an empty merchant ID.
	 *
	 * Storing an empty value left the site connected but unable to report its
	 * own integration status, which surfaced much later as "Merchant
	 * integration info not available".
	 */
	public function test_complete_onboarding_rejects_a_missing_merchant_id() {
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
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( 'auth_code', 'shared_id', '' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_no_merchant_id', $result->get_error_code() );
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
	}

	/**
	 * Test that a missing merchant status names which half is absent.
	 */
	public function test_check_merchant_status_reports_which_id_is_missing() {
		update_option( PayPal_Partner_Onboarding::PARTNER_ID_OPTION_KEY, 'PARTNER1' );

		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_no_merchant_info', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertTrue( $data['has_partner_id'] );
		$this->assertFalse( $data['has_merchant_id'] );
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
		$this->assertContains( 'PPCP_STANDARD', PayPal_Partner_Onboarding::ONBOARDING_PRODUCTS );
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
