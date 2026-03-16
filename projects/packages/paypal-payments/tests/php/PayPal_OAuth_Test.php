<?php
/**
 * Tests for the PayPal_OAuth class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

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
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		// Clean up all options and transients.
		delete_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		delete_option( PayPal_OAuth::ENVIRONMENT_OPTION_KEY );
		delete_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY );
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
	 * Test credential integrity check detects corruption.
	 */
	public function test_credential_integrity_check() {
		PayPal_OAuth::store_credentials( 'test_client_id', 'test_client_secret' );

		// Manually corrupt the stored data.
		$credentials                  = get_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY );
		$credentials['client_secret'] = 'tampered_value';
		update_option( PayPal_OAuth::CREDENTIALS_OPTION_KEY, $credentials );

		// Should detect corruption and return false.
		$result = PayPal_OAuth::get_credentials();
		$this->assertFalse( $result );

		// Should also clean up the corrupted data.
		$this->assertFalse( PayPal_OAuth::has_credentials() );
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
		set_transient( PayPal_OAuth::TOKEN_TRANSIENT_KEY, 'cached_access_token', 3600 );

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
		$this->assertStringNotContainsString( '<script>', $credentials['client_id'] );
		$this->assertStringNotContainsString( '<b>', $credentials['client_secret'] );
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
}
