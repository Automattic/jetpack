<?php
/**
 * Tests for the /wpcom/v2/paypal/platform endpoints.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-paypal-onboarding.php';
require_once __DIR__ . '/fixtures/class-jetpack-server-version.php';
require_once __DIR__ . '/fixtures/wpcom-functions.php';
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
	 * The blog ID WorDBless started the test on.
	 *
	 * @var int
	 */
	private $original_blog_id;

	/**
	 * The blog ID the tests connect as.
	 *
	 * @var int
	 */
	const SITE_ID = 1234;

	/**
	 * The transient remembering that MERCHANT1 was referred by SITE_ID on sandbox.
	 *
	 * @return string
	 */
	private function merchant_binding_transient() {
		return 'paypal_platform_merchant_' . md5( 'sandbox|' . self::SITE_ID . '|MERCHANT1' );
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_blog_id = $GLOBALS['blog_id'];
		$this->endpoint         = new WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'is_jetpack_authorized_for_site' );
		unset( $GLOBALS['wpcom_paypal_platform_test_token'] );
		unset( $GLOBALS['wpcom_paypal_platform_test_suspended'] );
		$GLOBALS['blog_id'] = $this->original_blog_id;
		foreach ( array( 'sandbox', 'production' ) as $environment ) {
			delete_transient( WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::token_cache_key( $environment ) );
		}
		delete_transient( $this->merchant_binding_transient() );

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
		$request->set_param( 'return_url', 'https://example.com/wp-admin/admin.php?page=paypal-return' );

		return $request;
	}

	/**
	 * Call as a Simple site, which Client::wpcom_json_api_request_as_blog() runs in-process on its own blog.
	 */
	private function connect_site() {
		Constants::set_constant( 'IS_WPCOM', true );
		add_filter( 'is_jetpack_authorized_for_site', '__return_true' );
		$GLOBALS['blog_id'] = self::SITE_ID;
	}

	/**
	 * Sign the request with a Jetpack token, the way a self-hosted or Atomic site's call arrives.
	 *
	 * @param int $blog_id The blog the token belongs to.
	 * @param int $user_id The token's user; 0 for a blog token.
	 */
	private function sign_request_as( $blog_id, $user_id = 0 ) {
		Constants::set_constant( 'IS_WPCOM', true );
		// public-api's own blog, which every flat-route HTTP call runs on.
		$GLOBALS['blog_id'] = 5836086;

		$GLOBALS['wpcom_paypal_platform_test_token'] = (object) array(
			'blog_id'          => $blog_id,
			'user_id'          => $user_id,
			'external_user_id' => $user_id,
			'secret'           => 'secret',
		);
	}

	/**
	 * Build a merchant-integration request.
	 *
	 * @param array $params Query parameters.
	 * @return WP_REST_Request
	 */
	private function merchant_integration_request( array $params ) {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/paypal/platform/merchant-integration' );
		$request->set_param( 'environment', 'sandbox' );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return $request;
	}

	/**
	 * Build a request-proxy request.
	 *
	 * @param array $overrides Parameters to change.
	 * @return WP_REST_Request
	 */
	private function forward_request( array $overrides = array() ) {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/paypal/platform/request' );
		$params  = array_merge(
			array(
				'environment' => 'sandbox',
				'merchant_id' => 'MERCHANT1',
				'method'      => 'POST',
				'path'        => '/v1/checkout/payment-resources',
				'body'        => array( 'type' => 'BUY_NOW' ),
				'request_id'  => 'req-1',
			),
			$overrides
		);
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return $request;
	}

	/**
	 * PayPal's integration record for MERCHANT1, referred by a blog.
	 *
	 * @param int $site_id The blog the tracking ID names.
	 * @return array
	 */
	private function merchant_integration_response( $site_id = self::SITE_ID ) {
		return $this->http_response(
			200,
			array(
				'merchant_id'         => 'MERCHANT1',
				'tracking_id'         => 'woo-ncps-' . $site_id . '-1700000000',
				'payments_receivable' => true,
				'primary_email'       => 'junior@sports.com',
			)
		);
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
	/**
	 * The flag is unregistered here, so this also covers the unregistered-default path:
	 * only a `jetpack_feature_flag_enabled_*` filter can turn the route on.
	 */
	public function test_no_route_is_registered_while_the_flag_is_off() {
		$routes = $this->build_routes();

		$this->assertArrayNotHasKey( '/wpcom/v2/paypal/platform/signup-link', $routes );
	}

	public function test_the_route_is_registered_once_the_flag_is_on() {
		add_filter( 'jetpack_feature_flag_enabled_paypal-payments-api-managed-buttons', '__return_true' );

		$routes = $this->build_routes();

		remove_all_filters( 'jetpack_feature_flag_enabled_paypal-payments-api-managed-buttons' );

		$this->assertArrayHasKey( '/wpcom/v2/paypal/platform/signup-link', $routes );
	}

	/**
	 * Rebuild the route table from a fresh REST server, the way the package suite does.
	 */
	private function build_routes() {
		global $wp_rest_server;
		$wp_rest_server = null;

		$routes = rest_get_server()->get_routes();

		return $routes;
	}

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
	 * Test that an incomplete environment names the constants that are absent.
	 *
	 * "not configured" on its own sends whoever is provisioning the environment
	 * hunting through three constant names to find the one they missed.
	 */
	public function test_incomplete_credentials_name_the_missing_constants() {
		// Only the partner merchant ID is set for sandbox, so the API credentials
		// are the missing half.
		Constants::set_constant( 'PAYPAL_BUTTONS_SANDBOX_PARTNER_MERCHANT_ID', 'SANDBOX_PARTNER' );

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request( 'sandbox' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'platform_credentials_invalid', $result->get_error_code() );
		$this->assertStringContainsString( 'PAYPAL_BUTTONS_SANDBOX_CLIENT_ID', $result->get_error_message() );
		$this->assertStringContainsString(
			'PAYPAL_BUTTONS_SANDBOX_CLIENT_SECRET',
			$result->get_error_message()
		);
		// The one that is set is not reported as missing.
		$this->assertStringNotContainsString(
			'PAYPAL_BUTTONS_SANDBOX_PARTNER_MERCHANT_ID',
			$result->get_error_message()
		);
	}

	/**
	 * Test that a signup link is refused when the partner merchant ID is missing.
	 *
	 * It is Automattic's own PayPal account ID, not anything onboarding returns,
	 * and it is a path segment in every call made after the seller finishes. A
	 * link generated without it leads the seller through the whole PayPal flow
	 * and then fails to retrieve their credentials, so refuse it up front rather
	 * than surfacing the problem later as a missing merchant integration.
	 */
	public function test_signup_link_is_refused_without_a_partner_merchant_id() {
		$this->set_platform_credentials( 'sandbox', 'sandbox_platform_id', 'sandbox_platform_secret' );

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'platform_partner_merchant_id_missing', $result->get_error_code() );
		$this->assertStringContainsString(
			'PAYPAL_BUTTONS_SANDBOX_PARTNER_MERCHANT_ID',
			$result->get_error_message()
		);
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
	 * Test that the platform's client ID is returned, for the site's JS SDK URL.
	 *
	 * It is public, unlike the secret and the partner merchant ID, which stay here.
	 */
	public function test_partner_client_id_is_returned() {
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
		$this->assertSame( 'sandbox_platform_id', $result->get_data()['partner_client_id'] );
		$this->assertArrayNotHasKey( 'partner_merchant_id', $result->get_data() );
		$this->assertStringNotContainsString( 'sandbox_platform_secret', wp_json_encode( $result->get_data(), JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Test that the referral is created with a tracking ID naming the calling blog.
	 *
	 * The tracking ID is how a seller is later tied back to the blog that
	 * referred them, so it is issued here and returned rather than accepted
	 * from the site.
	 */
	public function test_referral_carries_a_tracking_id_for_the_calling_blog() {
		$this->connect_site();
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

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request( 'sandbox' ) );

		$tracking_id = $result->get_data()['tracking_id'];
		$this->assertStringStartsWith( 'woo-ncps-1234-', $tracking_id );
		$this->assertLessThanOrEqual( 127, strlen( $tracking_id ) );

		$body = (array) json_decode( end( $requests )['args']['body'], true );
		$this->assertSame( $tracking_id, $body['tracking_id'] );
	}

	/**
	 * Test that the referral carries the BN code the site resolved, as PayPal certifies against.
	 */
	public function test_referral_carries_the_sites_partner_attribution_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->referral_response(),
			),
			$requests
		);

		$request = $this->signup_link_request( 'sandbox' );
		$request->set_param( 'partner_attribution_id', 'My_Sandbox-BN' );
		$this->endpoint->generate_signup_link( $request );

		$this->assertSame( 'My_Sandbox-BN', end( $requests )['args']['headers']['PayPal-Partner-Attribution-Id'] );
	}

	/**
	 * Test that a site which sends no BN code gets a referral without the header.
	 */
	public function test_referral_omits_the_attribution_header_without_a_code() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->referral_response(),
			),
			$requests
		);

		$this->endpoint->generate_signup_link( $this->signup_link_request( 'sandbox' ) );

		$this->assertArrayNotHasKey( 'PayPal-Partner-Attribution-Id', end( $requests )['args']['headers'] );
	}

	/**
	 * Test that a BN code is reduced to the characters PayPal accepts.
	 */
	public function test_partner_attribution_id_is_sanitized() {
		$this->assertSame( 'Woo_BN-1', $this->endpoint->sanitize_partner_attribution_id( 'Woo _BN-1 ?&' ) );
		$this->assertSame( '', $this->endpoint->sanitize_partner_attribution_id( array( 'x' ) ) );
	}

	/**
	 * A created referral, as PayPal answers it.
	 *
	 * @return array
	 */
	private function referral_response() {
		return $this->http_response(
			201,
			array(
				'links' => array(
					array(
						'rel'  => 'action_url',
						'href' => 'https://www.sandbox.paypal.com/merchantsignup/x',
					),
				),
			)
		);
	}

	// --- Calling site ---

	/**
	 * Test that a call nobody signed is refused, whoever's merchant ID it names.
	 */
	public function test_an_unsigned_call_is_refused() {
		Constants::set_constant( 'IS_WPCOM', true );

		$result = $this->endpoint->permission_check();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Test that a signed call is tied to the blog its token belongs to, not to public-api's.
	 */
	public function test_a_signed_call_is_tied_to_the_token_blog() {
		$this->sign_request_as( self::SITE_ID );
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

		$this->assertTrue( $this->endpoint->permission_check() );

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );
		$this->assertStringStartsWith( 'woo-ncps-' . self::SITE_ID . '-', $result->get_data()['tracking_id'] );
	}

	/**
	 * Test that a seller another blog referred cannot be reached with a different blog's token.
	 */
	public function test_a_signed_call_cannot_act_for_another_blogs_seller() {
		$this->sign_request_as( 999 );
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response(),
			)
		);

		$result = $this->endpoint->forward_request( $this->forward_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
	}

	/**
	 * Test that a user token does not stand in for the site's blog token.
	 */
	public function test_a_user_token_is_refused() {
		$this->sign_request_as( self::SITE_ID, 42 );

		$this->assertInstanceOf( WP_Error::class, $this->endpoint->permission_check() );
	}

	/**
	 * Test that a suspended blog's token is refused.
	 */
	public function test_a_suspended_blogs_token_is_refused() {
		$this->sign_request_as( self::SITE_ID );
		$GLOBALS['wpcom_paypal_platform_test_suspended'] = array( self::SITE_ID );

		$this->assertInstanceOf( WP_Error::class, $this->endpoint->permission_check() );
	}

	/**
	 * Test that a token that failed to verify is refused.
	 */
	public function test_a_token_that_failed_to_verify_is_refused() {
		Constants::set_constant( 'IS_WPCOM', true );
		$GLOBALS['wpcom_paypal_platform_test_token'] = new WP_Error( 'signature_mismatch' );

		$this->assertInstanceOf( WP_Error::class, $this->endpoint->permission_check() );
	}

	/**
	 * Test that the in-process shortcut is honored only on WordPress.com.
	 */
	public function test_the_in_process_shortcut_needs_wpcom() {
		add_filter( 'is_jetpack_authorized_for_site', '__return_true' );

		$this->assertInstanceOf( WP_Error::class, $this->endpoint->permission_check() );
	}

	// --- Merchant integration ---

	/**
	 * Test that a seller who just finished onboarding is found by tracking ID and reported.
	 */
	public function test_merchant_integration_is_found_by_tracking_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'?tracking_id='                    => $this->http_response( 200, array( 'merchant_id' => 'MERCHANT1' ) ),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response(),
			),
			$requests
		);

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'tracking_id' => 'woo-ncps-1234-1700000000' ) )
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'MERCHANT1', $result->get_data()['merchant_id'] );
		$this->assertSame( 'junior@sports.com', $result->get_data()['primary_email'] );

		// Both lookups address PayPal as the partner.
		$this->assertStringContainsString( '/v1/customer/partners/SANDBOX_PARTNER/merchant-integrations?tracking_id=woo-ncps-1234-1700000000', $requests[1]['url'] );
		$this->assertStringContainsString( '/v1/customer/partners/SANDBOX_PARTNER/merchant-integrations/MERCHANT1', $requests[2]['url'] );
	}

	/**
	 * Test that a tracking ID PayPal has not tied to a seller yet is reported as not found.
	 */
	public function test_merchant_integration_reports_a_seller_paypal_has_not_found_yet() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->token_response(),
				'?tracking_id='    => $this->http_response( 404, array( 'name' => 'RESOURCE_NOT_FOUND' ) ),
			)
		);

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'tracking_id' => 'woo-ncps-1234-1700000000' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_found', $result->get_error_code() );
		$this->assertSame( 404, $result->get_error_data()['status'] );
	}

	/**
	 * Test that a tracking ID issued for another blog is refused before PayPal is asked.
	 */
	public function test_merchant_integration_refuses_another_blogs_tracking_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'tracking_id' => 'woo-ncps-9999-1700000000' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
		$this->assertEmpty( $requests );
	}

	/**
	 * Test that a merchant ID is only reported when PayPal's record names the calling blog.
	 */
	public function test_merchant_integration_refuses_a_seller_another_blog_referred() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response( 9999 ),
			)
		);

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'merchant_id' => 'MERCHANT1' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
	}

	/**
	 * Test that a lookup needs the platform credentials before it needs an identifier.
	 */
	public function test_merchant_integration_needs_platform_credentials() {
		$this->connect_site();

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'merchant_id' => 'MERCHANT1' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'platform_credentials_missing', $result->get_error_code() );
	}

	/**
	 * Test that PayPal being unreachable during the tracking ID lookup is reported.
	 */
	public function test_merchant_integration_reports_paypal_unreachable_by_tracking_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->token_response(),
				'?tracking_id='    => new WP_Error( 'http_request_failed', 'Connection reset' ),
			)
		);

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'tracking_id' => 'woo-ncps-1234-1700000000' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_request_failed', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}

	/**
	 * Test that a seller record PayPal would not hand over is reported with PayPal's diagnostics.
	 */
	public function test_merchant_integration_reports_a_record_paypal_refused() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->http_response(
					500,
					array(
						'name'     => 'INTERNAL_SERVICE_ERROR',
						'debug_id' => 'abc123',
					)
				),
			)
		);

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'merchant_id' => 'MERCHANT1' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_status_error', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
		$this->assertSame( 'INTERNAL_SERVICE_ERROR', $result->get_error_data()['paypal_error'] );
		$this->assertSame( 'abc123', $result->get_error_data()['paypal_debug_id'] );
	}

	/**
	 * Test that a lookup needs one identifier.
	 */
	public function test_merchant_integration_requires_an_identifier() {
		$this->connect_site();
		$this->store_platform_credentials();

		$result = $this->endpoint->get_merchant_integration_status( $this->merchant_integration_request( array() ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_unspecified', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
	}

	// --- Request proxy ---

	/**
	 * Test that a Payment Links call is made with the platform token and an auth assertion for the seller.
	 */
	public function test_forwarded_request_is_signed_for_the_seller() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response(),
				'/v1/checkout/payment-resources'   => $this->http_response( 201, array( 'id' => 'PLB-NEW' ) ),
			),
			$requests
		);

		$result = $this->endpoint->forward_request( $this->forward_request() );

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 201, $result->get_data()['status'] );
		$this->assertSame( array( 'id' => 'PLB-NEW' ), json_decode( $result->get_data()['body'], true ) );

		$paypal_call = end( $requests );
		$this->assertSame(
			WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::PAYPAL_SANDBOX_BASE_URL . '/v1/checkout/payment-resources',
			$paypal_call['url']
		);
		$this->assertSame( 'POST', $paypal_call['args']['method'] );
		$this->assertSame( 'Bearer platform_access_token', $paypal_call['args']['headers']['Authorization'] );
		$this->assertSame( 'req-1', $paypal_call['args']['headers']['PayPal-Request-Id'] );
		$this->assertSame(
			WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::build_auth_assertion( 'sandbox_platform_id', 'MERCHANT1' ),
			$paypal_call['args']['headers']['PayPal-Auth-Assertion']
		);
		$this->assertSame( array( 'type' => 'BUY_NOW' ), json_decode( $paypal_call['args']['body'], true ) );
	}

	/**
	 * Test that the auth assertion is the unsigned JWT PayPal's third-party contract describes.
	 */
	public function test_auth_assertion_names_the_platform_and_the_seller() {
		$assertion = WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::build_auth_assertion( 'CLIENT', 'MERCHANT1' );

		$this->assertStringEndsWith( '.', $assertion );
		list( $header, $payload ) = explode( '.', $assertion );
		$this->assertSame( array( 'alg' => 'none' ), json_decode( base64_decode( $header ), true ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$this->assertSame(
			array(
				'iss'      => 'CLIENT',
				'payer_id' => 'MERCHANT1',
			),
			json_decode( base64_decode( $payload ), true ) // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		);
	}

	/**
	 * Test that a call needs the platform credentials.
	 */
	public function test_forwarded_request_needs_platform_credentials() {
		$this->connect_site();

		$result = $this->endpoint->forward_request( $this->forward_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'platform_credentials_missing', $result->get_error_code() );
	}

	/**
	 * Test that a call naming no seller is refused before PayPal is asked.
	 */
	public function test_forwarded_request_needs_a_merchant_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		$result = $this->endpoint->forward_request( $this->forward_request( array( 'merchant_id' => '' ) ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertEmpty( $requests );
	}

	/**
	 * Test that PayPal being unreachable while the seller is checked is reported, not treated as a refusal.
	 */
	public function test_forwarded_request_reports_paypal_unreachable_during_the_seller_check() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => new WP_Error( 'http_request_failed', 'Connection reset' ),
			)
		);

		$result = $this->endpoint->forward_request( $this->forward_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_request_failed', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}

	/**
	 * Test that PayPal being unreachable for the call itself is reported.
	 */
	public function test_forwarded_request_reports_paypal_unreachable() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response(),
				'/v1/checkout/payment-resources'   => new WP_Error( 'http_request_failed', 'Connection reset' ),
			)
		);

		$result = $this->endpoint->forward_request( $this->forward_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_request_failed', $result->get_error_code() );
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}

	/**
	 * Test that PayPal's error answers are relayed as they are, for the site to read.
	 */
	public function test_forwarded_request_relays_paypal_errors() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response(),
				'/v1/checkout/payment-resources'   => $this->http_response( 404, array( 'name' => 'RESOURCE_NOT_FOUND' ) ),
			)
		);

		$result = $this->endpoint->forward_request( $this->forward_request( array( 'method' => 'GET' ) ) );

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 404, $result->get_data()['status'] );

		$body = (array) json_decode( $result->get_data()['body'], true );
		$this->assertSame( 'RESOURCE_NOT_FOUND', $body['name'] );
	}

	/**
	 * Test that a call for a seller another blog referred is refused before it reaches PayPal.
	 */
	public function test_forwarded_request_refuses_a_seller_another_blog_referred() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response( 9999 ),
			),
			$requests
		);

		$result = $this->endpoint->forward_request( $this->forward_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
		foreach ( $requests as $request ) {
			$this->assertStringNotContainsString( '/v1/checkout/payment-resources', $request['url'] );
		}
	}

	/**
	 * Test that a verified seller is remembered, so the check is not a PayPal call every time.
	 */
	public function test_forwarded_request_remembers_a_verified_seller() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response(),
				'/v1/checkout/payment-resources'   => $this->http_response( 200, array( 'resources' => array() ) ),
			),
			$requests
		);

		$first  = $this->endpoint->forward_request( $this->forward_request( array( 'method' => 'GET' ) ) );
		$second = $this->endpoint->forward_request( $this->forward_request( array( 'method' => 'GET' ) ) );

		$this->assertNotInstanceOf( WP_Error::class, $first );
		$this->assertNotInstanceOf( WP_Error::class, $second );

		$lookups = array_filter(
			$requests,
			function ( $request ) {
				return false !== strpos( $request['url'], '/merchant-integrations/' );
			}
		);
		$this->assertCount( 1, $lookups );

		// And the token was fetched once for both calls.
		$tokens = array_filter(
			$requests,
			function ( $request ) {
				return false !== strpos( $request['url'], '/v1/oauth2/token' );
			}
		);
		$this->assertCount( 1, $tokens );
	}

	/**
	 * Test that a blog's own tracking ID authorizes it even after the seller connected another site.
	 *
	 * PayPal's record then names the other blog as the latest referral, but the
	 * tracking ID this blog onboarded the seller with still resolves to them.
	 */
	public function test_forwarded_request_is_authorized_by_the_blogs_own_tracking_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'?tracking_id='                    => $this->http_response( 200, array( 'merchant_id' => 'MERCHANT1' ) ),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response( 9999 ),
				'/v1/checkout/payment-resources'   => $this->http_response( 200, array( 'resources' => array() ) ),
			),
			$requests
		);

		$result = $this->endpoint->forward_request(
			$this->forward_request(
				array(
					'method'      => 'GET',
					'tracking_id' => 'woo-ncps-1234-1700000000',
				)
			)
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 200, $result->get_data()['status'] );
		$this->assertStringContainsString( '/merchant-integrations?tracking_id=woo-ncps-1234-1700000000', $requests[1]['url'] );
		foreach ( $requests as $request ) {
			$this->assertStringNotContainsString( '/merchant-integrations/MERCHANT1', $request['url'] );
		}
		$this->assertSame( 1, get_transient( $this->merchant_binding_transient() ) );
	}

	/**
	 * Test that a tracking ID issued for another blog is refused before PayPal is asked.
	 */
	public function test_forwarded_request_refuses_another_blogs_tracking_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		$result = $this->endpoint->forward_request(
			$this->forward_request( array( 'tracking_id' => 'woo-ncps-9999-1700000000' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertEmpty( $requests );
	}

	/**
	 * Test that a blog's tracking ID resolving to a different seller does not authorize the one named.
	 */
	public function test_forwarded_request_refuses_a_tracking_id_naming_another_seller() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->token_response(),
				'?tracking_id='    => $this->http_response( 200, array( 'merchant_id' => 'MERCHANT2' ) ),
			),
			$requests
		);

		$result = $this->endpoint->forward_request(
			$this->forward_request( array( 'tracking_id' => 'woo-ncps-1234-1700000000' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		foreach ( $requests as $request ) {
			$this->assertStringNotContainsString( '/v1/checkout/payment-resources', $request['url'] );
		}
		$this->assertFalse( get_transient( $this->merchant_binding_transient() ) );
	}

	/**
	 * Test that a tracking ID PayPal has no referral for is refused, since the blog never onboarded anyone with it.
	 */
	public function test_forwarded_request_refuses_a_tracking_id_paypal_does_not_know() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->token_response(),
				'?tracking_id='    => $this->http_response( 404, array( 'name' => 'RESOURCE_NOT_FOUND' ) ),
			)
		);

		$result = $this->endpoint->forward_request(
			$this->forward_request( array( 'tracking_id' => 'woo-ncps-1234-1700000000' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Test that PayPal being unreachable during the tracking ID lookup is reported as such, not as a refusal.
	 */
	public function test_forwarded_request_reports_paypal_unreachable_during_the_tracking_id_lookup() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token' => $this->token_response(),
				'?tracking_id='    => new WP_Error( 'http_request_failed', 'cURL error 28' ),
			)
		);

		$result = $this->endpoint->forward_request(
			$this->forward_request( array( 'tracking_id' => 'woo-ncps-1234-1700000000' ) )
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertNotSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
	}

	/**
	 * Test that a blog reading a seller with its own tracking ID gets the record even when the latest referral is another blog's.
	 */
	public function test_merchant_integration_is_read_with_the_blogs_own_tracking_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'?tracking_id='                    => $this->http_response( 200, array( 'merchant_id' => 'MERCHANT1' ) ),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response( 9999 ),
			),
			$requests
		);

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request(
				array(
					'merchant_id' => 'MERCHANT1',
					'tracking_id' => 'woo-ncps-1234-1700000000',
				)
			)
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'MERCHANT1', $result->get_data()['merchant_id'] );
		$this->assertSame( 'woo-ncps-9999-1700000000', $result->get_data()['tracking_id'] );
		$this->assertSame( 1, get_transient( $this->merchant_binding_transient() ) );
	}

	/**
	 * Test that a seller found by a blog's tracking ID is reported even when another blog referred them since.
	 */
	public function test_merchant_integration_by_tracking_id_tolerates_a_later_referral_elsewhere() {
		$this->connect_site();
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'                 => $this->token_response(),
				'?tracking_id='                    => $this->http_response( 200, array( 'merchant_id' => 'MERCHANT1' ) ),
				'/merchant-integrations/MERCHANT1' => $this->merchant_integration_response( 9999 ),
			)
		);

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request( array( 'tracking_id' => 'woo-ncps-1234-1700000000' ) )
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'MERCHANT1', $result->get_data()['merchant_id'] );
	}

	/**
	 * Test that a blog with a tracking ID of another blog's cannot read a seller by merchant ID either.
	 */
	public function test_merchant_integration_refuses_another_blogs_tracking_id_with_a_merchant_id() {
		$this->connect_site();
		$this->store_platform_credentials();
		$requests = array();
		$this->mock_http_routes( array(), $requests );

		$result = $this->endpoint->get_merchant_integration_status(
			$this->merchant_integration_request(
				array(
					'merchant_id' => 'MERCHANT1',
					'tracking_id' => 'woo-ncps-9999-1700000000',
				)
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
		$this->assertEmpty( $requests );
	}

	/**
	 * Test that only the Payment Links & Buttons API can be called through the proxy.
	 *
	 * @dataProvider provide_paths
	 *
	 * @param mixed $path    A PayPal path, or whatever else a request carries.
	 * @param bool  $allowed Whether the proxy accepts it.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_paths' )]
	public function test_only_payment_resources_paths_are_accepted( $path, $allowed ) {
		$this->assertSame( $allowed, $this->endpoint->validate_path( $path ) );
	}

	/**
	 * Paths the proxy is asked for.
	 *
	 * @return array<string, array{0:mixed, 1:bool}>
	 */
	public static function provide_paths() {
		return array(
			'collection'            => array( '/v1/checkout/payment-resources', true ),
			'collection with query' => array( '/v1/checkout/payment-resources?page_size=100&total_required=true', true ),
			'one resource'          => array( '/v1/checkout/payment-resources/PLB-ABC123', true ),
			'orders'                => array( '/v2/checkout/orders', false ),
			'merchant integrations' => array( '/v1/customer/partners/X/merchant-integrations/Y', false ),
			'traversal'             => array( '/v1/checkout/payment-resources/../../v2/checkout/orders', false ),
			'trailing newline'      => array( "/v1/checkout/payment-resources\n", false ),
			'not a string'          => array( 42, false ),
		);
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
	 * Test that the referral is built here for a THIRD_PARTY seller, with only the return URL from the site.
	 */
	public function test_referral_is_built_for_a_third_party_seller() {
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
		$integration      = $body['operations'][0]['api_integration_preference']['rest_api_integration'];

		$this->assertSame( 'THIRD_PARTY', $integration['integration_type'] );
		$this->assertSame(
			array( 'PAYMENT', 'REFUND', 'ACCESS_MERCHANT_INFORMATION', 'PAYMENT_LINKS_AND_BUTTONS' ),
			$integration['third_party_details']['features']
		);
		$this->assertSame( array( 'EXPRESS_CHECKOUT' ), $body['products'] );
		$this->assertTrue( $body['legal_consents'][0]['granted'] );
		$this->assertSame(
			'https://example.com/wp-admin/admin.php?page=paypal-return',
			$body['partner_config_override']['return_url']
		);
		// PayPal rejects a description over 127 characters.
		$this->assertLessThanOrEqual( 127, strlen( $body['partner_config_override']['return_url_description'] ) );
		$this->assertSame(
			'Bearer platform_access_token',
			$referral_request['args']['headers']['Authorization']
		);
	}

	/**
	 * Test which return URLs a site may send the seller back to.
	 *
	 * @dataProvider provide_return_urls
	 *
	 * @param mixed  $url         The return_url parameter.
	 * @param string $environment 'sandbox' or 'production'.
	 * @param bool   $allowed     Whether it is accepted.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_return_urls' )]
	public function test_return_url_must_be_a_web_page( $url, $environment, $allowed ) {
		$request = $this->signup_link_request( $environment );

		$this->assertSame( $allowed, $this->endpoint->validate_return_url( $url, $request ) );
	}

	/**
	 * Return URLs a site sends.
	 *
	 * @return array<string, array{0:mixed, 1:string, 2:bool}>
	 */
	public static function provide_return_urls() {
		return array(
			'https in production'   => array( 'https://example.com/return', 'production', true ),
			'http in production'    => array( 'http://example.com/return', 'production', false ),
			'http in sandbox'       => array( 'http://example.test/return', 'sandbox', true ),
			'javascript in sandbox' => array( 'javascript:alert(1)', 'sandbox', false ),
			'no host'               => array( 'https:///return', 'production', false ),
			'not a string'          => array( array( 'https://example.com' ), 'production', false ),
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
	 * Test that PayPal's diagnostics survive a rejected referral.
	 *
	 * PayPal answers every schema violation with the same generic sentence, so
	 * the message alone says nothing about what was wrong. `details` names the
	 * offending field and `debug_id` is what PayPal support traces on — dropping
	 * them leaves a caller with an unexplained 400.
	 */
	public function test_referral_error_details_are_passed_through() {
		$this->store_platform_credentials();
		$this->mock_http_routes(
			array(
				'/v1/oauth2/token'               => $this->token_response(),
				'/v2/customer/partner-referrals' => $this->http_response(
					400,
					array(
						'name'     => 'INVALID_REQUEST',
						'message'  => 'Request is not well-formed, syntactically incorrect, or violates schema.',
						'debug_id' => 'abc123def456',
						'details'  => array(
							array(
								'field'       => '/operations/0/api_integration_preference/rest_api_integration/first_party_details/seller_nonce',
								'issue'       => 'INVALID_STRING_LENGTH',
								'description' => 'The value of a field does not conform to the expected length.',
							),
						),
					)
				),
			)
		);

		$result = $this->endpoint->generate_signup_link( $this->signup_link_request() );

		$this->assertInstanceOf( WP_Error::class, $result );

		$data = $result->get_error_data();
		$this->assertSame( 'INVALID_REQUEST', $data['paypal_error'] );
		$this->assertSame( 'abc123def456', $data['paypal_debug_id'] );
		$this->assertSame( 'INVALID_STRING_LENGTH', $data['paypal_details'][0]['issue'] );
		$this->assertStringContainsString( 'seller_nonce', $data['paypal_details'][0]['field'] );
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
