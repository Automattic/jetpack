<?php
/**
 * Consent_Log_Controller test suite.
 *
 * @package automattic/jetpack-cookie-consent
 */

use Automattic\Jetpack\CookieConsent\Consent_Log_Controller;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for the consent-log write-endpoint protections (nonce, rate limit, validation).
 *
 * @covers \Automattic\Jetpack\CookieConsent\Consent_Log_Controller
 */
#[CoversClass( Consent_Log_Controller::class )]
final class ConsentLogControllerTest extends PHPUnit\Framework\TestCase {

	/**
	 * Controller under test.
	 *
	 * @var Consent_Log_Controller
	 */
	private $controller;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Common no-op stubs shared across tests.
		Functions\when( '__' )->returnArg();
		Functions\when( 'apply_filters' )->returnArg( 2 ); // Return the value unchanged (no filters).
		Functions\when( 'wp_unslash' )->returnArg();
		Functions\when( 'get_site_option' )->justReturn( null ); // jetpack-ip falls back to REMOTE_ADDR.

		$this->controller = new Consent_Log_Controller();

		$_SERVER['REMOTE_ADDR'] = '203.0.113.5';
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		unset( $_SERVER['REMOTE_ADDR'] );
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Build a request carrying the given nonce header.
	 *
	 * @param string|null $nonce Nonce value, or null to omit the header.
	 * @return WP_REST_Request
	 */
	private function request_with_nonce( $nonce ) {
		$request = new WP_REST_Request();
		if ( null !== $nonce ) {
			$request->set_header( 'x_wp_nonce', $nonce );
		}
		return $request;
	}

	/**
	 * A missing nonce is rejected with a 403.
	 */
	public function test_create_permission_rejects_missing_nonce() {
		$result = $this->controller->check_create_permission( $this->request_with_nonce( null ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_cookie_invalid_nonce', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * An invalid nonce is rejected with a 403.
	 */
	public function test_create_permission_rejects_invalid_nonce() {
		Functions\when( 'wp_verify_nonce' )->justReturn( false );

		$result = $this->controller->check_create_permission( $this->request_with_nonce( 'bad-nonce' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_cookie_invalid_nonce', $result->get_error_code() );
	}

	/**
	 * A valid nonce under the rate limit is allowed.
	 */
	public function test_create_permission_allows_valid_nonce_under_limit() {
		Functions\when( 'wp_verify_nonce' )->justReturn( true );
		Functions\when( 'get_transient' )->justReturn( 0 );
		// The permission check must be read-only — WP can call it more than once per request.
		Functions\expect( 'set_transient' )->never();

		$result = $this->controller->check_create_permission( $this->request_with_nonce( 'good-nonce' ) );

		$this->assertTrue( $result );
	}

	/**
	 * A valid nonce that has hit the rate limit is rejected with a 429.
	 */
	public function test_create_permission_rate_limited_returns_429() {
		Functions\when( 'wp_verify_nonce' )->justReturn( true );
		Functions\when( 'get_transient' )->justReturn( 100 ); // At RATE_LIMIT_MAX.

		$result = $this->controller->check_create_permission( $this->request_with_nonce( 'good-nonce' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_too_many_requests', $result->get_error_code() );
		$this->assertSame( 429, $result->get_error_data()['status'] );
	}

	/**
	 * A well-formed http(s) URL within the length cap validates.
	 */
	public function test_validate_url_accepts_valid_url() {
		Functions\when( 'wp_http_validate_url' )->returnArg();

		$this->assertTrue( $this->controller->validate_url( 'https://example.com/page', null, 'url' ) );
	}

	/**
	 * An empty URL is allowed (the field is optional).
	 */
	public function test_validate_url_allows_empty() {
		$this->assertTrue( $this->controller->validate_url( '', null, 'url' ) );
	}

	/**
	 * A URL exceeding the length cap is rejected before URL validation runs.
	 */
	public function test_validate_url_rejects_overlong_url() {
		$long = 'https://example.com/' . str_repeat( 'a', 2000 );

		$result = $this->controller->validate_url( $long, null, 'url' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * A malformed URL is rejected.
	 */
	public function test_validate_url_rejects_invalid_url() {
		Functions\when( 'wp_http_validate_url' )->justReturn( false );

		$result = $this->controller->validate_url( 'not a url', null, 'url' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * Oversized consent-type objects are capped to MAX_CONSENT_TYPES keys.
	 */
	public function test_sanitize_consent_types_caps_key_count() {
		Functions\when( 'sanitize_key' )->returnArg();
		Functions\when( 'rest_sanitize_boolean' )->alias(
			static function ( $value ) {
				return (bool) $value;
			}
		);

		$keys = array();
		for ( $i = 0; $i < 25; $i++ ) {
			$keys[ 'k' . $i ] = true;
		}

		// Allow every key so the cap (not the allow-list) is what trims the result.
		Functions\when( 'apply_filters' )->alias(
			static function ( $hook, $value ) use ( $keys ) {
				if ( 'jetpack_cookie_consent_allowed_consent_types' === $hook ) {
					return array_keys( $keys );
				}
				return $value;
			}
		);

		$result = $this->controller->sanitize_consent_types( $keys );

		$this->assertCount( 20, $result );
		$this->assertArrayHasKey( 'k0', $result );
		$this->assertArrayNotHasKey( 'k20', $result );
	}

	/**
	 * Non-array consent types sanitize to null.
	 */
	public function test_sanitize_consent_types_rejects_non_array() {
		$this->assertNull( $this->controller->sanitize_consent_types( 'nope' ) );
	}
}

// Lightweight WordPress test doubles. The package is unit-tested without a full WP
// runtime, so the few core classes the controller touches are stubbed here. This file
// is excluded from Phan (see .phan/config.php) to avoid clashing with the WP stubs.

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound

/**
 * Minimal WP_REST_Controller test double.
 */
class WP_REST_Controller {
}

/**
 * Minimal WP_Error test double.
 */
class WP_Error {

	/**
	 * Error code.
	 *
	 * @var string
	 */
	private $code;

	/**
	 * Error data.
	 *
	 * @var array
	 */
	private $data;

	/**
	 * Construct the error.
	 *
	 * @param string $code    Error code.
	 * @param string $message Error message (unused by these tests).
	 * @param array  $data    Error data.
	 */
	public function __construct( $code = '', $message = '', $data = array() ) {
		$this->code = $code;
		$this->data = $data;
	}

	/**
	 * Get the error code.
	 *
	 * @return string
	 */
	public function get_error_code() {
		return $this->code;
	}

	/**
	 * Get the error data.
	 *
	 * @return array
	 */
	public function get_error_data() {
		return $this->data;
	}
}

/**
 * Minimal WP_REST_Request test double.
 */
class WP_REST_Request {

	/**
	 * Request headers, keyed as WordPress normalizes them (lowercased, dashes to underscores).
	 *
	 * @var array
	 */
	private $headers = array();

	/**
	 * Set a header value.
	 *
	 * @param string $key   Header key.
	 * @param string $value Header value.
	 */
	public function set_header( $key, $value ) {
		$this->headers[ $key ] = $value;
	}

	/**
	 * Get a header value.
	 *
	 * @param string $key Header key.
	 * @return string|null
	 */
	public function get_header( $key ) {
		return $this->headers[ $key ] ?? null;
	}
}

// phpcs:enable Generic.Files.OneObjectStructurePerFile.MultipleFound
