<?php
/**
 * Tests for the PayPal_OAuth class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_OAuth_Test
 *
 * @coversDefaultClass Automattic\Jetpack\PaypalPayments\PayPal_OAuth
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_OAuth
 */
#[CoversClass( PayPal_OAuth::class )]
class PayPal_OAuth_Test extends TestCase {

	/**
	 * The error_log destination before the test changed it.
	 *
	 * @var string|false
	 */
	private $previous_error_log;

	/**
	 * Remember where error_log went, so tests that redirect it can be undone.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->previous_error_log = ini_get( 'error_log' );
	}

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		ini_set( 'error_log', $this->previous_error_log ); // phpcs:ignore WordPress.PHP.IniSet.Risky

		// Clean up all options and transients. disconnect() is used rather than
		// deleting options directly because it also resets the request-scoped
		// credentials cache, which otherwise leaks between tests in the same
		// process and makes has_credentials() report a stale true.
		PayPal_OAuth::disconnect();
		// The referred seller lives on another class's options, which disconnect() leaves alone.
		PayPal_Partner_Onboarding::cleanup();

		// The blog connection is per-test; leaving it set makes later tests that
		// expect a disconnected site pass or fail depending on test order.
		delete_option( 'jetpack_private_options' );
		\Jetpack_Options::delete_option( 'id' );
		Constants::clear_constants();
		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Put the site in a state where it can talk to WordPress.com as a blog.
	 */
	private function set_up_connected_site() {
		( new Tokens() )->update_blog_token( 'test.blogtoken' );
		\Jetpack_Options::update_option( 'id', 1234 );
	}

	/**
	 * Test default environment is production (WOOPTP-163).
	 */
	public function test_default_environment_is_production() {
		$this->assertEquals( 'production', PayPal_OAuth::get_environment() );
	}

	/**
	 * Test setting environment to production.
	 */
	public function test_set_environment_production() {
		PayPal_OAuth::set_environment( 'production' );
		$this->assertEquals( 'production', PayPal_OAuth::get_environment() );
	}

	/**
	 * Test setting environment to sandbox.
	 */
	public function test_set_environment_sandbox() {
		PayPal_OAuth::set_environment( 'sandbox' );
		$this->assertEquals( 'sandbox', PayPal_OAuth::get_environment() );
	}

	/**
	 * Test invalid environment values are rejected.
	 *
	 * @dataProvider invalid_environment_provider
	 *
	 * @param string $environment The invalid environment value.
	 */
	#[DataProvider( 'invalid_environment_provider' )]
	public function test_invalid_environment_is_rejected( $environment ) {
		$result = PayPal_OAuth::set_environment( $environment );
		$this->assertFalse( $result );
		// Should remain at default (production per WOOPTP-163).
		$this->assertEquals( 'production', PayPal_OAuth::get_environment() );
	}

	/**
	 * Data provider for invalid environment values.
	 *
	 * @return array
	 */
	public static function invalid_environment_provider() {
		return array(
			'empty string'   => array( '' ),
			'invalid value'  => array( 'staging' ),
			'mixed case'     => array( 'Production' ),
			'numeric'        => array( '1' ),
			'html injection' => array( '<script>alert(1)</script>' ),
		);
	}

	/**
	 * Test sandbox base URL.
	 */
	public function test_production_base_url_is_default() {
		// Production is the default (WOOPTP-163) — no set_environment() call needed.
		$this->assertEquals( 'https://api.paypal.com', PayPal_OAuth::get_base_url() );
	}

	/**
	 * Test sandbox base URL after explicit switch.
	 */
	public function test_sandbox_base_url() {
		PayPal_OAuth::set_environment( 'sandbox' );
		$this->assertEquals( 'https://api-m.sandbox.paypal.com', PayPal_OAuth::get_base_url() );
	}

	/**
	 * Test storing credentials.
	 */
	public function test_store_credentials() {
		$result = PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		$this->assertTrue( $result );
		$this->assertTrue( PayPal_OAuth::has_credentials() );
	}

	/**
	 * Test retrieving stored credentials.
	 */
	public function test_get_credentials() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		$credentials = PayPal_OAuth::get_credentials();
		$this->assertIsArray( $credentials );
		$this->assertEquals( 'test_client_id', $credentials['client_id'] );
		$this->assertEquals( 'test_client_secret', $credentials['client_secret'] );
	}

	/**
	 * Test has_credentials returns false when none stored.
	 */
	public function test_has_credentials_false_when_empty() {
		$this->assertFalse( PayPal_OAuth::has_credentials() );
	}

	/**
	 * Test get_credentials returns false when none stored.
	 */
	public function test_get_credentials_returns_false_when_empty() {
		$this->assertFalse( PayPal_OAuth::get_credentials() );
	}

	/**
	 * Test empty client ID is rejected.
	 */
	public function test_empty_client_id_rejected() {
		$result = PayPal_OAuth::store_credentials( '', 'test_client_secret' );
		$this->assertFalse( $result );
		$this->assertFalse( PayPal_OAuth::has_credentials() );
	}

	/**
	 * Test empty client secret is rejected.
	 */
	public function test_empty_client_secret_rejected() {
		$result = PayPal_OAuth::store_credentials( 'test_client_id', '' );
		$this->assertFalse( $result );
		$this->assertFalse( PayPal_OAuth::has_credentials() );
	}

	/**
	 * Test that corrupted ciphertext is detected and credentials are cleared.
	 */
	public function test_corrupted_ciphertext_detected() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		// Manually corrupt the stored encrypted data.
		$credentials                            = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		$credentials['encrypted_client_secret'] = base64_encode( 'corrupted_ciphertext_that_is_long_enough_for_nonce_and_mac' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		update_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY, $credentials );

		// Authenticated encryption should detect tampering and return false.
		ini_set( 'error_log', '/dev/null' ); // phpcs:ignore WordPress.PHP.IniSet.Risky
		$result = PayPal_OAuth::get_credentials();
		$this->assertFalse( $result );

		// Should also clean up the corrupted data.
		$this->assertFalse( PayPal_OAuth::has_credentials() );
	}

	/**
	 * Test that a failed decrypt is logged before the credentials are deleted.
	 *
	 * The ciphertext is re-encrypted under a different key, which is what a
	 * salt rotation leaves behind.
	 */
	public function test_undecryptable_credentials_are_logged() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		$key   = sodium_crypto_generichash( 'some-other-auth-key', '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES );
		$nonce = random_bytes( SODIUM_CRYPTO_SECRETBOX_NONCEBYTES );

		$credentials                        = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		$credentials['encrypted_client_id'] = base64_encode( $nonce . sodium_crypto_secretbox( 'test_client_id', $nonce, $key ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		update_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY, $credentials );

		$log_file = tempnam( sys_get_temp_dir(), 'paypal-oauth-log' );
		ini_set( 'error_log', $log_file ); // phpcs:ignore WordPress.PHP.IniSet.Risky

		$this->assertFalse( PayPal_OAuth::get_credentials() );

		$logged = file_get_contents( $log_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		unlink( $log_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink

		$this->assertStringContainsString( 'stored credentials could not be decrypted', $logged );
	}

	/**
	 * Test that credentials are not recoverable if AUTH_KEY changes.
	 */
	public function test_credentials_irrecoverable_with_truncated_data() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		// Replace stored data with something too short to contain nonce + MAC.
		$credentials                        = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		$credentials['encrypted_client_id'] = base64_encode( 'short' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		update_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY, $credentials );

		ini_set( 'error_log', '/dev/null' ); // phpcs:ignore WordPress.PHP.IniSet.Risky
		$result = PayPal_OAuth::get_credentials();
		$this->assertFalse( $result );
	}

	/**
	 * Test deleting credentials.
	 */
	public function test_delete_credentials() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		$this->assertTrue( PayPal_OAuth::has_credentials() );

		PayPal_OAuth::delete_credentials();
		$this->assertFalse( PayPal_OAuth::has_credentials() );
	}

	/**
	 * Test storing new credentials clears cached token.
	 */
	public function test_store_credentials_clears_token_cache() {
		// Simulate a cached token.
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'old_token', 3600 );

		// Store new credentials.
		PayPal_OAuth::store_credentials( 'new_client_id', 'new_client_secret' );

		// Cached token should be cleared.
		$this->assertFalse( get_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY ) );
	}

	/**
	 * Test environment change clears cached token.
	 */
	public function test_environment_change_clears_token_cache() {
		// Simulate a cached token.
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'sandbox_token', 3600 );

		// Switch environment.
		PayPal_OAuth::set_environment( 'production' );

		// Cached token should be cleared.
		$this->assertFalse( get_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY ) );
	}

	/**
	 * Test get_access_token returns cached token when available.
	 */
	public function test_get_access_token_returns_cached_token() {
		// Set a cached token.
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, PayPal_OAuth::encrypt( 'cached_access_token' ), 3600 );

		$token = PayPal_OAuth::get_access_token();
		$this->assertEquals( 'cached_access_token', $token );
	}

	/**
	 * Test get_access_token returns WP_Error when no credentials.
	 */
	public function test_get_access_token_error_without_credentials() {
		$token = PayPal_OAuth::get_access_token();
		$this->assertInstanceOf( \WP_Error::class, $token );
		$this->assertEquals( 'paypal_no_credentials', $token->get_error_code() );
	}

	/**
	 * Test disconnect removes all PayPal data.
	 */
	public function test_disconnect_removes_all_data() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		PayPal_OAuth::set_environment( 'production' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'some_token', 3600 );

		PayPal_OAuth::disconnect();

		$this->assertFalse( PayPal_OAuth::has_credentials() );
		// After disconnect, environment resets to the default (production per WOOPTP-163).
		$this->assertEquals( 'production', PayPal_OAuth::get_environment() );
		$this->assertFalse( get_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY ) );
	}

	/**
	 * Test connection status when not connected.
	 */
	public function test_connection_status_disconnected() {
		$status = PayPal_OAuth::get_connection_status();

		$this->assertIsArray( $status );
		$this->assertFalse( $status['connected'] );
		$this->assertEquals( 'production', $status['environment'] );
	}

	/**
	 * Test connection status when connected.
	 */
	public function test_connection_status_connected() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		PayPal_OAuth::set_environment( 'production' );

		$status = PayPal_OAuth::get_connection_status();

		$this->assertIsArray( $status );
		$this->assertTrue( $status['connected'] );
		$this->assertEquals( 'production', $status['environment'] );
	}

	/**
	 * Test the connection status includes the stored account email.
	 */
	public function test_connection_status_includes_account_email() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		update_option( PayPal_Partner_Onboarding::MERCHANT_EMAIL_OPTION_KEY, 'junior@sports.com', false );

		$status = PayPal_OAuth::get_connection_status();

		$this->assertEquals( 'junior@sports.com', $status['account_email'] );
	}

	/**
	 * Test the account email key is left out when no email is stored, which is the
	 * case for a merchant who pasted their own API credentials.
	 */
	public function test_connection_status_omits_account_email_when_unset() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		$status = PayPal_OAuth::get_connection_status();

		$this->assertTrue( $status['connected'] );
		$this->assertArrayNotHasKey( 'account_email', $status );
	}

	/**
	 * Test a referred seller counts as connected although the site holds no credentials.
	 */
	public function test_connection_status_reports_a_referred_seller_as_connected() {
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1', false );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, PayPal_Partner_Onboarding::ONBOARDING_METHOD, false );

		$status = PayPal_OAuth::get_connection_status();

		$this->assertFalse( PayPal_OAuth::has_credentials() );
		$this->assertTrue( PayPal_OAuth::is_connected() );
		$this->assertTrue( $status['connected'] );
		$this->assertSame( 'MERCHANT1', $status['merchant_id'] );
		$this->assertSame( PayPal_Partner_Onboarding::ONBOARDING_METHOD, $status['onboarding_method'] );
	}

	/**
	 * Test the onboarding method is left out when pasted credentials take over from a referral.
	 */
	public function test_connection_status_omits_onboarding_method_with_credentials() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1', false );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, PayPal_Partner_Onboarding::ONBOARDING_METHOD, false );

		$status = PayPal_OAuth::get_connection_status();

		$this->assertTrue( $status['connected'] );
		$this->assertArrayNotHasKey( 'onboarding_method', $status );
	}

	/**
	 * Test Partner Referrals is unavailable off WordPress.com, even with credentials stored.
	 */
	public function test_connection_status_partner_referrals_ignores_credentials() {
		$this->assertFalse( ( new Manager() )->is_connected(), 'This case needs a disconnected site.' );

		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		$status = PayPal_OAuth::get_connection_status();

		$this->assertTrue( $status['connected'] );
		$this->assertFalse( $status['partner_referrals_available'] );
	}

	/**
	 * Test Partner Referrals is available on a site connected to WordPress.com.
	 */
	public function test_connection_status_partner_referrals_available_when_connected() {
		$this->set_up_connected_site();

		$status = PayPal_OAuth::get_connection_status();

		$this->assertFalse( $status['connected'] );
		$this->assertTrue( $status['partner_referrals_available'] );
	}

	/**
	 * Test Partner Referrals is available on WordPress.com Simple.
	 */
	public function test_connection_status_partner_referrals_available_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$status = PayPal_OAuth::get_connection_status();

		$this->assertFalse( $status['connected'] );
		$this->assertTrue( $status['partner_referrals_available'] );
	}

	/**
	 * Test that credentials are sanitized on storage.
	 */
	public function test_credentials_are_sanitized() {
		// Store credentials with leading/trailing whitespace and potential HTML.
		PayPal_OAuth::store_credentials(
			'  <script>alert(1)</script>test_id  ',
			'  <b>secret</b>  '
		);

		$credentials = PayPal_OAuth::get_credentials();

		// sanitize_text_field strips tags and trims whitespace.
		$this->assertIsArray( $credentials );
		$this->assertStringNotContainsString( '<script>', $credentials['client_id'] );
		$this->assertStringNotContainsString( '<b>', $credentials['client_secret'] );
	}

	/**
	 * Test that credentials are stored encrypted, not in plaintext.
	 */
	public function test_credentials_stored_encrypted() {
		PayPal_OAuth::store_credentials( 'my_client_id', 'my_client_secret' );

		$raw = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );

		// Raw stored data should not contain plaintext credentials.
		$this->assertArrayNotHasKey( 'client_id', $raw );
		$this->assertArrayNotHasKey( 'client_secret', $raw );
		$this->assertArrayHasKey( 'encrypted_client_id', $raw );
		$this->assertArrayHasKey( 'encrypted_client_secret', $raw );

		// The encrypted values should not match the plaintext.
		$this->assertNotEquals( 'my_client_id', $raw['encrypted_client_id'] );
		$this->assertNotEquals( 'my_client_secret', $raw['encrypted_client_secret'] );

		// But decryption should return the originals.
		$credentials = PayPal_OAuth::get_credentials();
		$this->assertEquals( 'my_client_id', $credentials['client_id'] );
		$this->assertEquals( 'my_client_secret', $credentials['client_secret'] );
	}

	/**
	 * Test that each store generates a different ciphertext (unique nonce).
	 */
	public function test_encryption_uses_unique_nonce() {
		PayPal_OAuth::store_credentials( 'same_id', 'same_secret' );
		$raw1 = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );

		PayPal_OAuth::store_credentials( 'same_id', 'same_secret' );
		$raw2 = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );

		// Same plaintext should produce different ciphertext due to random nonce.
		$this->assertNotEquals( $raw1['encrypted_client_id'], $raw2['encrypted_client_id'] );
	}

	/**
	 * Test clear_cached_token removes transient.
	 */
	public function test_clear_cached_token() {
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'some_token', 3600 );
		$this->assertEquals( 'some_token', get_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY ) );

		PayPal_OAuth::clear_cached_token();
		$this->assertFalse( get_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY ) );
	}

	/**
	 * Test the token endpoint constant.
	 */
	public function test_token_endpoint_constant() {
		$this->assertEquals( '/v1/oauth2/token', PayPal_OAuth::TOKEN_ENDPOINT );
	}

	/**
	 * Test the expiry buffer is reasonable (between 1–10 minutes).
	 */
	public function test_token_expiry_buffer_is_reasonable() {
		$this->assertGreaterThanOrEqual( 60, PayPal_OAuth::TOKEN_EXPIRY_BUFFER );
		$this->assertLessThanOrEqual( 600, PayPal_OAuth::TOKEN_EXPIRY_BUFFER );
	}

	// --- validate_api_access() ---

	/**
	 * Store credentials with a token already cached, so the probe is the only call made.
	 */
	private function set_up_stored_credentials_with_a_token() {
		PayPal_OAuth::set_environment( 'sandbox' );
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, PayPal_OAuth::encrypt( 'cached_token' ), 3600 );
	}

	/**
	 * A referred seller on a site connected to WordPress.com.
	 */
	private function set_up_referred_merchant() {
		PayPal_OAuth::set_environment( 'sandbox' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$this->set_up_connected_site();
		update_option( PayPal_Partner_Onboarding::MERCHANT_ID_OPTION_KEY, 'MERCHANT1', false );
		update_option( PayPal_Partner_Onboarding::ONBOARDING_METHOD_OPTION_KEY, PayPal_Partner_Onboarding::ONBOARDING_METHOD, false );
	}

	/**
	 * Answer every HTTP request with one response, recording the requests.
	 *
	 * @param array|\WP_Error $response The response.
	 * @param array           $requests Collected by reference as [ url, args ] pairs.
	 */
	private function mock_http( $response, &$requests = null ) {
		$requests = array();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $response, &$requests ) {
				$requests[] = array(
					'url'  => $url,
					'args' => $args,
				);
				return $response;
			},
			10,
			3
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
		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'status' => $status,
					'body'   => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * Test that the probe needs a token, so a site without credentials gets that error.
	 */
	public function test_validate_api_access_needs_credentials() {
		$requests = array();
		$this->mock_http( array( 'response' => array( 'code' => 200 ) ), $requests );

		$result = PayPal_OAuth::validate_api_access();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEmpty( $requests );
	}

	/**
	 * Test that the probe reads one payment resource with the account's token.
	 */
	public function test_validate_api_access_probes_payment_resources() {
		$this->set_up_stored_credentials_with_a_token();
		$requests = array();
		$this->mock_http(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => '{"resources":[]}',
			),
			$requests
		);

		$this->assertTrue( PayPal_OAuth::validate_api_access() );
		$this->assertCount( 1, $requests );
		$this->assertSame( 'https://api-m.sandbox.paypal.com/v1/checkout/payment-resources?page_size=1', $requests[0]['url'] );
		$this->assertSame( 'Bearer cached_token', $requests[0]['args']['headers']['Authorization'] );
	}

	/**
	 * Test that PayPal being unreachable or down does not block connecting.
	 *
	 * @dataProvider provide_transient_probe_failures
	 *
	 * @param array|\WP_Error $response What the probe got back.
	 */
	#[DataProvider( 'provide_transient_probe_failures' )]
	public function test_validate_api_access_does_not_block_on_a_transient_failure( $response ) {
		$this->set_up_stored_credentials_with_a_token();
		$this->mock_http( $response );

		$this->assertTrue( PayPal_OAuth::validate_api_access() );
	}

	/**
	 * Probe outcomes that say nothing about the account's access.
	 *
	 * @return array<string, array{0: array|\WP_Error}>
	 */
	public static function provide_transient_probe_failures() {
		return array(
			'network failure' => array( new \WP_Error( 'http_request_failed', 'Connection timed out' ) ),
			'server error'    => array( array( 'response' => array( 'code' => 503 ) ) ),
			'no status'       => array( array( 'response' => array( 'code' => 0 ) ) ),
		);
	}

	/**
	 * Test that a 403 names the missing app feature and carries PayPal's diagnosis.
	 */
	public function test_validate_api_access_reports_a_missing_app_feature() {
		$this->set_up_stored_credentials_with_a_token();
		$this->mock_http(
			array(
				'response' => array( 'code' => 403 ),
				'body'     => '{"name":"NOT_AUTHORIZED","debug_id":"abc123"}',
			)
		);

		$result = PayPal_OAuth::validate_api_access();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_api_not_authorized', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
		$this->assertStringContainsString( 'PayPal Developer Dashboard', $result->get_error_message() );
		$this->assertStringContainsString( 'PayPal reported: NOT_AUTHORIZED (debug ID abc123).', $result->get_error_message() );
	}

	/**
	 * Test that a 403 without a body is reported without a diagnosis.
	 */
	public function test_validate_api_access_reports_a_403_without_diagnostics() {
		$this->set_up_stored_credentials_with_a_token();
		$this->mock_http( array( 'response' => array( 'code' => 403 ) ) );

		$result = PayPal_OAuth::validate_api_access();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_api_not_authorized', $result->get_error_code() );
		$this->assertStringNotContainsString( 'PayPal reported', $result->get_error_message() );
	}

	/**
	 * Test that a referred seller's probe goes through WordPress.com, with no token on the site.
	 */
	public function test_validate_api_access_probes_through_wpcom_for_a_referred_seller() {
		$this->set_up_referred_merchant();
		$requests = array();
		$this->mock_http( $this->platform_response( 200, array( 'resources' => array() ) ), $requests );

		$this->assertTrue( PayPal_OAuth::validate_api_access() );
		$this->assertCount( 1, $requests );
		$this->assertStringContainsString( PayPal_Platform_Client::WPCOM_REQUEST_ROUTE, $requests[0]['url'] );

		$body = (array) json_decode( $requests[0]['args']['body'], true );
		$this->assertSame( 'GET', $body['method'] );
		$this->assertSame( '/v1/checkout/payment-resources?page_size=1', $body['path'] );
	}

	/**
	 * Test that a relayed 403 tells the seller to grant the permissions, not to configure an app.
	 */
	public function test_validate_api_access_reports_a_referred_seller_paypal_did_not_grant() {
		$this->set_up_referred_merchant();
		$this->mock_http( $this->platform_response( 403, array( 'name' => 'NOT_AUTHORIZED' ) ) );

		$result = PayPal_OAuth::validate_api_access();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_api_not_authorized', $result->get_error_code() );
		$this->assertStringContainsString( 'accept every permission PayPal asks for', $result->get_error_message() );
		$this->assertStringNotContainsString( 'PayPal Developer Dashboard', $result->get_error_message() );
		$this->assertStringContainsString( 'NOT_AUTHORIZED', $result->get_error_message() );
	}

	/**
	 * Test that WordPress.com refusing to act for the seller is as final as PayPal's own 403.
	 */
	public function test_validate_api_access_reports_a_referred_seller_wpcom_refused() {
		$this->set_up_referred_merchant();
		$this->mock_http(
			array(
				'response' => array( 'code' => 403 ),
				'body'     => '{"code":"paypal_merchant_not_for_site","message":"This PayPal account was not connected through this site.","data":{"status":403}}',
			)
		);

		$result = PayPal_OAuth::validate_api_access();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_merchant_not_for_site', $result->get_error_code() );
	}

	/**
	 * Test that WordPress.com being unreachable does not block a referred seller from connecting.
	 */
	public function test_validate_api_access_does_not_block_a_referred_seller_on_a_wpcom_outage() {
		$this->set_up_referred_merchant();
		$this->mock_http( new \WP_Error( 'http_request_failed', 'Connection refused' ) );

		$this->assertTrue( PayPal_OAuth::validate_api_access() );
	}
}
