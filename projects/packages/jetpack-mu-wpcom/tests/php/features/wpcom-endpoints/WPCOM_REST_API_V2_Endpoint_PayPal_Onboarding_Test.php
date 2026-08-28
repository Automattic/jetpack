<?php
/**
 * Tests for the /wpcom/v2/paypal/platform endpoints.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-paypal-onboarding.php';
use Automattic\Jetpack\Constants;

/**
 * Class WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::class )]
class WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding_Test extends \WorDBless\BaseTestCase {

	/**
	 * The endpoint under test.
	 *
	 * @var WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding
	 */
	private $endpoint;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->endpoint = new WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		remove_all_filters( 'pre_http_request' );

		// Drop the REST server so the next test re-runs rest_api_init.
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Build a signup-link request.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @return WP_REST_Request
	 */
	private function signup_link_request( $environment = 'sandbox' ) {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/paypal/platform/signup-link' );
		$request->set_param( 'environment', $environment );
		$request->set_param(
			'referral',
			array(
				'tracking_id' => 'woo-ncps-test',
				'products'    => array( 'EXPRESS_CHECKOUT' ),
			)
		);

		return $request;
	}

	/**
	 * Store platform credentials for both environments.
	 */
	private function store_platform_credentials() {
		$this->set_platform_credentials(
			'sandbox',
			'sandbox_platform_id',
			'sandbox_platform_secret',
			'SANDBOX_PARTNER'
		);
		$this->set_platform_credentials(
			'production',
			'production_platform_id',
			'production_platform_secret',
			'PRODUCTION_PARTNER'
		);
	}

	/**
	 * Define the platform credential constants for one environment.
	 *
	 * Uses the Constants package rather than define(), so a test can leave a value
	 * unset -- a real constant could never be cleared again for the tests that follow.
	 *
	 * @param string      $environment         'sandbox' or 'production'.
	 * @param string|null $client_id           Client ID, or null to leave undefined.
	 * @param string|null $client_secret       Client secret, or null to leave undefined.
	 * @param string|null $partner_merchant_id Partner merchant ID, or null to leave undefined.
	 */
	private function set_platform_credentials( $environment, $client_id = null, $client_secret = null, $partner_merchant_id = null ) {
		$names  = WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::PLATFORM_CREDENTIAL_CONSTANTS[ $environment ];
		$values = array(
			'client_id'           => $client_id,
			'client_secret'       => $client_secret,
			'partner_merchant_id' => $partner_merchant_id,
		);

		foreach ( $values as $key => $value ) {
			if ( null !== $value ) {
				Constants::set_constant( $names[ $key ], $value );
			}
		}
	}

	/**
	 * Route mocked HTTP responses by URL fragment, recording each request.
	 *
	 * @param array $routes   Map of URL fragment => response array or WP_Error.
	 * @param array $requests Collected by reference as [ url, args ] pairs.
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
	 * A successful token exchange response.
	 *
	 * @return array
	 */
	private function token_response() {
		return $this->http_response(
			200,
			array(
				'access_token' => 'platform_access_token',
				'expires_in'   => 32400,
			)
		);
	}

	// --- Route registration ---

	/**
	 * Test that the endpoint is wired up under the platform path.
	 *
	 * Deliberately does not call rest_get_server(): building the whole route table
	 * costs tens of megabytes, and this suite already peaks near its memory limit.
	 * Reading the controller's own namespace and base proves the same thing --
	 * that this endpoint answers wpcom/v2/paypal/platform/signup-link, and so does
	 * not collide with the editor-facing wpcom/v2/paypal/onboarding/signup-link
	 * that the paypal-payments package registers on these same hosts.
	 */
	public function test_endpoint_is_registered_under_the_platform_path() {
		$this->assertNotFalse(
			has_action( 'rest_api_init', array( $this->endpoint, 'register_routes' ) ),
			'register_routes() is not hooked to rest_api_init.'
		);

		$reflection = new \ReflectionClass( $this->endpoint );

		$namespace = $reflection->getProperty( 'namespace' );
		$rest_base = $reflection->getProperty( 'rest_base' );
		if ( PHP_VERSION_ID < 80500 ) {
			$namespace->setAccessible( true );
			$rest_base->setAccessible( true );
		}

		$this->assertSame( 'wpcom/v2', $namespace->getValue( $this->endpoint ) );
		$this->assertSame( 'paypal/platform', $rest_base->getValue( $this->endpoint ) );
	}

	// --- Platform credentials ---

	/**
	 * Test that a missing platform credentials option is reported, not fataled on.
	 */
	public function test_missing_platform_credentials_are_reported() {
		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'platform_credentials_missing', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
	}

	/**
	 * Test that credentials configured for one environment do not satisfy the other.
	 */
	public function test_credentials_for_other_environment_are_rejected() {
		$this->set_platform_credentials( 'sandbox', 'sandbox_platform_id', 'sandbox_platform_secret' );

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request( 'production' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'platform_credentials_invalid', $result->get_error_code() );
		$this->assertStringContainsString( 'production', $result->get_error_message() );
	}

	/**
	 * Test that a signup link is still generated when only the client credentials
	 * are configured, with no partner merchant ID.
	 */
	public function test_signup_link_is_generated_without_a_partner_merchant_id() {
		$this->set_platform_credentials( 'sandbox', 'sandbox_platform_id', 'sandbox_platform_secret' );
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
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

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'https://www.sandbox.paypal.com/merchantsignup/x', $result->get_data()['action_url'] );
	}

	// --- Token exchange ---

	/**
	 * Test that a rejected token exchange does not leak PayPal's raw error.
	 */
	public function test_token_exchange_failure_is_reported_generically() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->http_response(
					401,
					array( 'error' => 'invalid_client' )
				),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_token_error', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
		$this->assertStringNotContainsString( 'invalid_client', $result->get_error_message() );
	}

	/**
	 * Test that a transport failure during the token exchange is surfaced as a gateway error.
	 */
	public function test_token_exchange_transport_error_is_reported() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => new WP_Error( 'http_request_failed', 'Connection refused' ),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_token_failed', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}

	/**
	 * Test that the partner merchant ID is returned so the site can complete onboarding.
	 *
	 * The auth code exchange and the merchant status check both address PayPal as
	 * the partner, and the site has no other way to learn that ID.
	 */
	public function test_partner_merchant_id_is_returned() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
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

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request( 'sandbox' ) );

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'SANDBOX_PARTNER', $result->get_data()['partner_merchant_id'] );
	}

	/**
	 * Test that a missing partner merchant ID degrades to an empty string.
	 */
	public function test_partner_merchant_id_defaults_to_empty_string() {
		$this->set_platform_credentials( 'sandbox', 'sandbox_platform_id', 'sandbox_platform_secret' );
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
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

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request( 'sandbox' ) );

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( '', $result->get_data()['partner_merchant_id'] );
	}

	// --- Referral creation ---

	/**
	 * Test that a successful referral returns the action URL and referral ID.
	 */
	public function test_successful_referral_returns_action_url_and_id() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'self',
								'href' => 'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals/REF42',
							),
							array(
								'rel'  => 'action_url',
								'href' => 'https://www.sandbox.paypal.com/merchantsignup/partner/onboardingentry?token=t',
							),
						),
					)
				),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame(
			'https://www.sandbox.paypal.com/merchantsignup/partner/onboardingentry?token=t',
			$result->get_data()['action_url']
		);
		$this->assertSame( 'REF42', $result->get_data()['referral_id'] );
	}

	/**
	 * Test that the sandbox environment routes to PayPal's sandbox host.
	 */
	public function test_sandbox_environment_uses_sandbox_host() {
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
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

		$this->endpoint->generate_signup_link( $this->signup_link_request( 'sandbox' ) );

		foreach ( $requests as $request ) {
			$this->assertStringStartsWith(
				WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::PAYPAL_SANDBOX_BASE_URL,
				$request['url']
			);
		}
	}

	/**
	 * Test that the production environment routes to PayPal's live host.
	 *
	 * Sending a live merchant to the sandbox host, or the reverse, silently
	 * produces an unusable onboarding link, so the host selection is asserted
	 * for both environments.
	 */
	public function test_production_environment_uses_live_host() {
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'action_url',
								'href' => 'https://www.paypal.com/merchantsignup/x',
							),
						),
					)
				),
			),
			$requests
		);

		$this->endpoint->generate_signup_link( $this->signup_link_request( 'production' ) );

		foreach ( $requests as $request ) {
			$this->assertStringStartsWith(
				WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::PAYPAL_PRODUCTION_BASE_URL,
				$request['url']
			);
		}
	}

	/**
	 * Test that the referral body from the plugin is forwarded to PayPal unchanged.
	 */
	public function test_referral_body_is_forwarded_to_paypal() {
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
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

		$this->endpoint->generate_signup_link( $this->signup_link_request() );

		$referral_request = end( $requests );
		$body             = (array) json_decode( $referral_request['args']['body'], true );

		$this->assertSame( 'woo-ncps-test', $body['tracking_id'] );
		$this->assertSame( array( 'EXPRESS_CHECKOUT' ), $body['products'] );
		$this->assertSame(
			'Bearer platform_access_token',
			$referral_request['args']['headers']['Authorization']
		);
	}

	/**
	 * Test that PayPal's own error message is passed through on a failed referral.
	 */
	public function test_referral_error_message_is_passed_through() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->http_response(
					422,
					array( 'message' => 'Tracking ID already used.' )
				),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_referral_failed', $result->get_error_code() );
		$this->assertSame( 'Tracking ID already used.', $result->get_error_message() );
		$this->assertSame( 422, $result->get_error_data()['status'] );
	}

	/**
	 * Test that a failed referral without a message still produces a usable error.
	 */
	public function test_referral_error_falls_back_to_generic_message() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->http_response( 500, array() ),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertNotEmpty( $result->get_error_message() );
	}

	/**
	 * Test that a 201 without an action_url is treated as a gateway failure.
	 */
	public function test_missing_action_url_is_treated_as_failure() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->http_response(
					201,
					array(
						'links' => array(
							array(
								'rel'  => 'self',
								'href' => 'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals/REF42',
							),
						),
					)
				),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_no_action_url', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}

	/**
	 * Test that a transport failure while creating the referral is surfaced.
	 */
	public function test_referral_transport_error_is_reported() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => new WP_Error( 'http_request_failed', 'Connection reset' ),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_request_failed', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}
}
