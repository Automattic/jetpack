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
	 * Every OAuth scope a seller grants when they accept the referral.
	 */
	private const SCOPES = array(
		'https://uri.paypal.com/services/payments/realtimepayment',
		'https://uri.paypal.com/services/payments/partnerfee',
		'https://uri.paypal.com/services/payments/refund',
		'https://uri.paypal.com/services/customer/merchant-integrations/read',
		'https://uri.paypal.com/services/payments/payment/authcapture',
		'https://uri.paypal.com/services/checkout/payment-resources/readwrite',
	);

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		PayPal_Partner_Onboarding::cleanup();
		delete_option( PayPal_Partner_Onboarding::PARTNER_CLIENT_ID_OPTION_KEY );
		PayPal_OAuth::disconnect();

		// The blog connection is per-test; leaving it set makes later tests that
		// expect a disconnected site pass or fail depending on test order.
		delete_option( 'jetpack_private_options' );
		\Jetpack_Options::delete_option( 'id' );
		Constants::clear_constants();

		remove_all_filters( 'pre_http_request' );
		remove_all_filters( PayPal_Payment_Buttons::SANDBOX_PARTNER_ATTRIBUTION_FILTER );
	}

	/**
	 * Put the site in a state where it can talk to WordPress.com as a blog.
	 *
	 * Every call here proxies through WordPress.com, which needs a blog ID
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
	 * Put the site in the state a finished referral leaves it in.
	 */
	private function set_up_referred_merchant() {
		$this->set_up_connected_site();
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1', false );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, PayPal_Partner_Onboarding::ONBOARDING_METHOD, false );
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
				'action_url'        => 'https://www.sandbox.paypal.com/merchantsignup/x',
				'referral_id'       => 'REFERRAL789',
				'tracking_id'       => 'woo-ncps-1234-1700000000',
				'partner_client_id' => 'PLATFORM_CLIENT_ID',
			)
		);
	}

	/**
	 * A merchant integration record as WordPress.com relays it from PayPal.
	 *
	 * @param array $overrides Fields to change.
	 * @return array
	 */
	private function merchant_integration( array $overrides = array() ) {
		return $this->http_response(
			200,
			array_merge(
				array(
					'merchant_id'             => 'MERCHANT1',
					'tracking_id'             => 'woo-ncps-1234-1700000000',
					'primary_email'           => 'junior@sports.com',
					'payments_receivable'     => true,
					'primary_email_confirmed' => true,
					'products'                => array( array( 'name' => 'EXPRESS_CHECKOUT' ) ),
					'oauth_integrations'      => $this->oauth_integrations(),
				),
				$overrides
			)
		);
	}

	/**
	 * The OAuth integrations on a merchant integration record.
	 *
	 * @param array $scopes Scope URIs the seller granted.
	 * @return array
	 */
	private function oauth_integrations( array $scopes = self::SCOPES ) {
		return array(
			array(
				'oauth_third_party' => array(
					array( 'scopes' => $scopes ),
				),
			),
		);
	}

	/**
	 * A PayPal answer relayed by the WordPress.com request proxy.
	 *
	 * @param int   $status PayPal's HTTP status.
	 * @param array $body   PayPal's response body.
	 * @return array
	 */
	private function platform_response( $status, array $body ) {
		return $this->http_response(
			200,
			array(
				'status' => $status,
				'body'   => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
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
	 * Test merchant ID retrieval when not set.
	 */
	public function test_merchant_id_empty_by_default() {
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
	}

	// --- is_platform_managed ---

	/**
	 * Test a referred seller's calls are routed through WordPress.com.
	 */
	public function test_is_platform_managed_after_a_referral() {
		$this->set_up_referred_merchant();

		$this->assertTrue( PayPal_Partner_Onboarding::is_platform_managed() );
	}

	/**
	 * Test pasted credentials take precedence over a referred seller.
	 */
	public function test_is_platform_managed_defers_to_stored_credentials() {
		$this->set_up_referred_merchant();
		PayPal_OAuth::store_credentials( 'client_id', 'client_secret' );

		$this->assertFalse( PayPal_Partner_Onboarding::is_platform_managed() );
	}

	/**
	 * Test a merchant ID alone, without the referral method, is not a platform connection.
	 */
	public function test_is_platform_managed_requires_the_referral_method() {
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1', false );

		$this->assertFalse( PayPal_Partner_Onboarding::is_platform_managed() );
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
		$this->assertSame( 'woo-ncps-1234-1700000000', $result['tracking_id'] );
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
	 * Test that the tracking ID WordPress.com issued is kept for the seller lookup.
	 *
	 * PayPal's THIRD_PARTY flow reports nothing back that identifies the seller,
	 * so the tracking ID is the only way to find them once they finish.
	 */
	public function test_generate_signup_link_stores_the_tracking_id() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link( $this->signup_link_success() );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertSame(
			'woo-ncps-1234-1700000000',
			get_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY )
		);
	}

	/**
	 * Test that a signup link without a tracking ID is refused.
	 */
	public function test_generate_signup_link_requires_a_tracking_id() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link(
			$this->http_response( 200, array( 'action_url' => 'https://www.sandbox.paypal.com/merchantsignup/x' ) )
		);

		$result = PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_referral_no_tracking_id', $result->get_error_code() );
		$this->assertFalse( get_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY ) );
	}

	/**
	 * Test that the platform's client ID is stored for the JS SDK URL.
	 */
	public function test_generate_signup_link_stores_the_partner_client_id() {
		$this->set_up_connected_site();
		$this->mock_wpcom_signup_link( $this->signup_link_success() );

		$this->assertEmpty( PayPal_Partner_Onboarding::get_partner_client_id() );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$this->assertSame( 'PLATFORM_CLIENT_ID', PayPal_Partner_Onboarding::get_partner_client_id() );
	}

	/**
	 * Test that the site sends only where PayPal returns the seller and its BN code; WordPress.com builds the referral.
	 */
	public function test_generate_signup_link_sends_the_return_url_and_the_attribution_id() {
		$this->set_up_connected_site();
		$requests = array();
		$this->mock_wpcom_signup_link( $this->signup_link_success(), $requests );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$body = (array) json_decode( end( $requests )['args']['body'], true );

		$this->assertSame(
			array(
				'environment'            => 'sandbox',
				'return_url'             => 'https://example.com/return',
				'partner_attribution_id' => PayPal_Payment_Buttons::PAYPAL_PARTNER_ATTRIBUTION_ID,
			),
			$body
		);
	}

	/**
	 * Test that a sandbox referral carries the BN code the sandbox filter resolves.
	 */
	public function test_generate_signup_link_sends_the_sandbox_attribution_id() {
		$this->set_up_connected_site();
		$requests = array();
		$this->mock_wpcom_signup_link( $this->signup_link_success(), $requests );
		add_filter( PayPal_Payment_Buttons::SANDBOX_PARTNER_ATTRIBUTION_FILTER, fn() => 'My_Sandbox_BN' );

		PayPal_Partner_Onboarding::generate_signup_link( 'https://example.com/return', 'sandbox' );

		$body = (array) json_decode( end( $requests )['args']['body'], true );
		$this->assertSame( 'My_Sandbox_BN', $body['partner_attribution_id'] );
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
									'field' => '/operations/0/api_integration_preference/rest_api_integration/third_party_details/features',
									'issue' => 'INVALID_PARAMETER_VALUE',
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
		$this->assertSame( 'INVALID_PARAMETER_VALUE', $data['paypal_details'][0]['issue'] );
		$this->assertStringContainsString( 'features', $data['paypal_details'][0]['field'] );

		// The same diagnostics belong in the visible message: the error data
		// never reaches a merchant reading the editor notice.
		$this->assertStringContainsString( 'INVALID_PARAMETER_VALUE', $result->get_error_message() );
		$this->assertStringContainsString( 'features', $result->get_error_message() );
		$this->assertStringContainsString( 'abc123def456', $result->get_error_message() );
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

	// --- complete_onboarding ---

	/**
	 * Test complete_onboarding fails with neither a referral in progress nor a merchant ID.
	 */
	public function test_complete_onboarding_requires_a_session() {
		$this->set_up_connected_site();

		$result = PayPal_Partner_Onboarding::complete_onboarding();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_no_session', $result->get_error_code() );
	}

	/**
	 * Test the full flow: the seller is found by tracking ID and recorded, and no credentials are stored.
	 */
	public function test_complete_onboarding_records_the_seller_found_by_tracking_id() {
		$this->set_up_connected_site();
		set_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY, 'woo-ncps-1234-1700000000', 1800 );
		$requests = array();
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->merchant_integration(),
				'/paypal/platform/request'              => $this->platform_response( 200, array( 'resources' => array() ) ),
			),
			$requests
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding();

		$this->assertTrue( $result );
		$this->assertSame( 'MERCHANT1', PayPal_Partner_Onboarding::get_merchant_id() );
		$this->assertSame( 'junior@sports.com', PayPal_Partner_Onboarding::get_merchant_email() );
		$this->assertSame(
			PayPal_Partner_Onboarding::ONBOARDING_METHOD,
			get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY )
		);
		$this->assertTrue( PayPal_Partner_Onboarding::is_platform_managed() );
		$this->assertFalse( PayPal_OAuth::has_credentials(), 'A third-party seller holds no credentials on the site.' );
		$this->assertFalse(
			get_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY ),
			'The tracking ID is single-use and must be deleted after a successful lookup.'
		);

		// The lookup named the tracking ID, and nothing went to PayPal from the site.
		$lookup = $requests[0]['url'];
		$this->assertStringContainsString( 'tracking_id=woo-ncps-1234-1700000000', $lookup );
		foreach ( $requests as $request ) {
			$this->assertStringNotContainsString( 'paypal.com', $request['url'] );
		}
	}

	/**
	 * Test that a supplied merchant ID stands in for an expired tracking ID.
	 */
	public function test_complete_onboarding_accepts_a_merchant_id_without_a_session() {
		$this->set_up_connected_site();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->merchant_integration(),
				'/paypal/platform/request'              => $this->platform_response( 200, array( 'resources' => array() ) ),
			),
			$requests
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding( '  MERCHANT1  ' );

		$this->assertTrue( $result );
		$this->assertSame( 'MERCHANT1', PayPal_Partner_Onboarding::get_merchant_id() );
		$this->assertStringContainsString( 'merchant_id=MERCHANT1', $requests[0]['url'] );
	}

	/**
	 * Test that a seller WordPress.com will not vouch for is not recorded.
	 *
	 * The error is WordPress.com's own, so the merchant reads why.
	 */
	public function test_complete_onboarding_refuses_a_seller_this_site_did_not_refer() {
		$this->set_up_connected_site();
		set_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY, 'woo-ncps-1234-1700000000', 1800 );
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => array(
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

		$result = PayPal_Partner_Onboarding::complete_onboarding();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
	}

	/**
	 * Test that a seller PayPal has not tied to the referral yet is reported so the editor can retry.
	 */
	public function test_complete_onboarding_reports_a_seller_paypal_has_not_found_yet() {
		$this->set_up_connected_site();
		set_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY, 'woo-ncps-1234-1700000000', 1800 );
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => array(
					'response' => array( 'code' => 404 ),
					'body'     => wp_json_encode(
						array(
							'code'    => 'paypal_merchant_not_found',
							'message' => 'PayPal has no seller for this onboarding session yet.',
							'data'    => array( 'status' => 404 ),
						),
						JSON_UNESCAPED_SLASHES
					),
				),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_found', $result->get_error_code() );
		// The tracking ID stays, so the next attempt can look again.
		$this->assertSame( 'woo-ncps-1234-1700000000', get_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY ) );
	}

	/**
	 * Test that a 403 on the feature probe leaves nothing connected behind.
	 *
	 * The seller is recorded before the grant is validated, so without a
	 * rollback the site reports itself connected while the editor shows the
	 * failure -- and the merchant is told to reconnect an account every other
	 * screen already treats as connected.
	 */
	public function test_complete_onboarding_discards_the_seller_when_the_api_is_not_authorized() {
		$this->set_up_connected_site();
		set_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY, 'woo-ncps-1234-1700000000', 1800 );
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->merchant_integration(),
				'/paypal/platform/request'              => $this->platform_response(
					403,
					array(
						'name'     => 'NOT_AUTHORIZED',
						'debug_id' => 'debug123',
					)
				),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_api_not_authorized', $result->get_error_code() );

		// PayPal's own diagnosis and the debug ID its support traces on belong
		// in the visible message, not only in error data nobody reads.
		$this->assertStringContainsString( 'NOT_AUTHORIZED', $result->get_error_message() );
		$this->assertStringContainsString( 'debug123', $result->get_error_message() );

		$this->assertFalse( PayPal_OAuth::is_connected(), 'A failed onboarding must not leave the site looking connected.' );
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
		$this->assertEmpty( get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY ) );
	}

	/**
	 * Test that connecting through PayPal replaces credentials the merchant pasted earlier.
	 *
	 * Stored credentials take precedence over a referral, so leaving them in
	 * place would keep calling PayPal with the old account.
	 */
	public function test_complete_onboarding_replaces_stored_credentials() {
		$this->set_up_connected_site();
		PayPal_OAuth::store_credentials( 'old_client_id', 'old_client_secret' );
		set_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY, 'woo-ncps-1234-1700000000', 1800 );
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->merchant_integration(),
				'/paypal/platform/request'              => $this->platform_response( 200, array( 'resources' => array() ) ),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding();

		$this->assertTrue( $result );
		$this->assertFalse( PayPal_OAuth::has_credentials() );
		$this->assertTrue( PayPal_Partner_Onboarding::is_platform_managed() );
	}

	/**
	 * Test that onboarding fails rather than storing an empty merchant ID.
	 */
	public function test_complete_onboarding_rejects_a_missing_merchant_id() {
		$this->set_up_connected_site();
		set_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY, 'woo-ncps-1234-1700000000', 1800 );
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->merchant_integration( array( 'merchant_id' => '' ) ),
			)
		);

		$result = PayPal_Partner_Onboarding::complete_onboarding();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_onboarding_no_merchant_id', $result->get_error_code() );
		$this->assertEmpty( PayPal_Partner_Onboarding::get_merchant_id() );
	}

	// --- check_merchant_status ---

	/**
	 * Test check_merchant_status fails without merchant info.
	 */
	public function test_check_merchant_status_requires_merchant_info() {
		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_no_merchant_info', $result->get_error_code() );
	}

	/**
	 * Test that merchant status is read through WordPress.com and normalized into booleans the UI can rely on.
	 */
	public function test_check_merchant_status_returns_normalized_status() {
		$this->set_up_referred_merchant();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->merchant_integration(
					array(
						'primary_email_confirmed' => false,
					)
				),
			),
			$requests
		);

		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertIsArray( $result );
		$this->assertSame( 'MERCHANT1', $result['merchant_id'] );
		$this->assertTrue( $result['payments_receivable'] );
		$this->assertFalse( $result['primary_email_confirmed'] );
		$this->assertSame( array( array( 'name' => 'EXPRESS_CHECKOUT' ) ), $result['products'] );

		$this->assertStringContainsString( 'merchant_id=MERCHANT1', $requests[0]['url'] );
		$this->assertStringNotContainsString( 'paypal.com', $requests[0]['url'] );
	}

	/**
	 * Test the merchant's email is cached for the account menu, trimmed by sanitize_email().
	 */
	public function test_check_merchant_status_caches_the_account_email() {
		$this->set_up_referred_merchant();
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->merchant_integration(
					array( 'primary_email' => ' Junior@Sports.com ' )
				),
			)
		);

		PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertSame( 'Junior@Sports.com', PayPal_Partner_Onboarding::get_merchant_email() );
	}

	/**
	 * Test the account email stays empty when PayPal's response omits it.
	 */
	public function test_check_merchant_status_leaves_the_account_email_empty_when_paypal_omits_it() {
		$this->set_up_referred_merchant();
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->http_response(
					200,
					array(
						'merchant_id'         => 'MERCHANT1',
						'payments_receivable' => true,
					)
				),
			)
		);

		PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertSame( '', PayPal_Partner_Onboarding::get_merchant_email() );
	}

	/**
	 * Test that a missing products key defaults to an empty array rather than a notice.
	 */
	public function test_check_merchant_status_defaults_missing_products() {
		$this->set_up_referred_merchant();
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => $this->http_response(
					200,
					array(
						'merchant_id'         => 'MERCHANT1',
						'payments_receivable' => true,
					)
				),
			)
		);

		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertSame( array(), $result['products'] );
		$this->assertFalse( $result['primary_email_confirmed'] );
	}

	/**
	 * Test that an error from WordPress.com is reported with its status.
	 */
	public function test_check_merchant_status_handles_error_status() {
		$this->set_up_referred_merchant();
		$this->mock_http_routes(
			array(
				'/paypal/platform/merchant-integration' => array(
					'response' => array( 'code' => 404 ),
					'body'     => wp_json_encode(
						array(
							'code'    => 'paypal_merchant_status_error',
							'message' => 'Could not retrieve merchant integration status from PayPal.',
							'data'    => array( 'status' => 404 ),
						),
						JSON_UNESCAPED_SLASHES
					),
				),
			)
		);

		$result = PayPal_Partner_Onboarding::check_merchant_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'paypal_merchant_status_error', $result->get_error_code() );
		$this->assertEquals( 404, $result->get_error_data()['status'] );
	}

	// --- cleanup ---

	/**
	 * Test cleanup removes all onboarding options.
	 */
	public function test_cleanup_removes_onboarding_data() {
		set_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY, 'woo-ncps-1234-1', 30 * MINUTE_IN_SECONDS );
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'test_merchant' );
		update_option( PayPal_Partner_Onboarding::MERCHANT_EMAIL_OPTION_KEY, 'junior@sports.com' );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, PayPal_Partner_Onboarding::ONBOARDING_METHOD );

		PayPal_Partner_Onboarding::cleanup();

		$this->assertFalse( get_transient( PayPal_Partner_Onboarding::TRACKING_ID_TRANSIENT_KEY ) );
		$this->assertFalse( get_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY ) );
		$this->assertFalse( get_option( PayPal_Partner_Onboarding::MERCHANT_EMAIL_OPTION_KEY ) );
		$this->assertFalse( get_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY ) );
	}

	/**
	 * Test cleanup does not remove the partner client ID (site-level config).
	 */
	public function test_cleanup_preserves_partner_client_id() {
		update_option( PayPal_Partner_Onboarding::PARTNER_CLIENT_ID_OPTION_KEY, 'PLATFORM_CLIENT_ID', false );

		PayPal_Partner_Onboarding::cleanup();

		$this->assertEquals( 'PLATFORM_CLIENT_ID', PayPal_Partner_Onboarding::get_partner_client_id() );
	}
}
