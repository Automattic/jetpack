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
 * Tests for the consent-log write-endpoint protections (rate limit, validation).
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
		Functions\when( 'wp_parse_url' )->alias(
			static function ( $url, $component = -1 ) {
				return parse_url( $url, $component ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url -- This stub *is* the wp_parse_url implementation.
			}
		);

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
	 * A request under the rate limit is allowed.
	 */
	public function test_create_permission_allows_under_limit() {
		Functions\when( 'get_transient' )->justReturn( 0 );
		// The permission check must be read-only — WP can call it more than once per request.
		Functions\expect( 'set_transient' )->never();

		$result = $this->controller->check_create_permission();

		$this->assertTrue( $result );
	}

	/**
	 * A request that has hit the rate limit is rejected with a 429.
	 */
	public function test_create_permission_rate_limited_returns_429() {
		Functions\when( 'get_transient' )->justReturn( 100 ); // At RATE_LIMIT_MAX.

		$result = $this->controller->check_create_permission();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_too_many_requests', $result->get_error_code() );
		$this->assertSame( 429, $result->get_error_data()['status'] );
	}

	/**
	 * A well-formed http(s) URL within the length cap validates.
	 */
	public function test_validate_url_accepts_valid_url() {
		$this->assertTrue( $this->controller->validate_url( 'https://example.com/page', null, 'url' ) );
		$this->assertTrue( $this->controller->validate_url( 'http://example.com/page', null, 'url' ) );
	}

	/**
	 * An empty URL is allowed (the field is optional).
	 */
	public function test_validate_url_allows_empty() {
		$this->assertTrue( $this->controller->validate_url( '', null, 'url' ) );
	}

	/**
	 * A URL exceeding the length cap is rejected before scheme/host parsing runs.
	 */
	public function test_validate_url_rejects_overlong_url() {
		$long = 'https://example.com/' . str_repeat( 'a', 2000 );

		$result = $this->controller->validate_url( $long, null, 'url' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * A malformed URL (no http(s) scheme) is rejected.
	 */
	public function test_validate_url_rejects_invalid_url() {
		$result = $this->controller->validate_url( 'not a url', null, 'url' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * A non-http(s) scheme (e.g. javascript:) is rejected.
	 */
	public function test_validate_url_rejects_non_http_scheme() {
		$result = $this->controller->validate_url( 'javascript:alert(1)', null, 'url' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * An http(s) URL with no host is rejected.
	 */
	public function test_validate_url_rejects_hostless_url() {
		$result = $this->controller->validate_url( 'http://', null, 'url' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * Consent types are bounded to the allow-list; unknown keys are dropped.
	 */
	public function test_sanitize_consent_types_filters_to_allowed_keys() {
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

		// Allow only three keys; everything else must be dropped regardless of payload size.
		Functions\when( 'apply_filters' )->alias(
			static function ( $hook, $value ) {
				if ( 'jetpack_cookie_consent_allowed_consent_types' === $hook ) {
					return array( 'k0', 'k1', 'k2' );
				}
				return $value;
			}
		);

		$result = $this->controller->sanitize_consent_types( $keys );

		$this->assertCount( 3, $result );
		$this->assertArrayHasKey( 'k0', $result );
		$this->assertArrayNotHasKey( 'k3', $result );
	}

	/**
	 * Non-array consent types sanitize to null.
	 */
	public function test_sanitize_consent_types_rejects_non_array() {
		$this->assertNull( $this->controller->sanitize_consent_types( 'nope' ) );
	}

	/**
	 * A count one below the limit is still allowed (pins the >= comparator boundary).
	 */
	public function test_create_permission_allows_one_below_limit() {
		Functions\when( 'get_transient' )->justReturn( 99 ); // One below RATE_LIMIT_MAX.

		$this->assertTrue( $this->controller->check_create_permission() );
	}

	/**
	 * An accepted write advances the per-IP rate-limit counter exactly once.
	 *
	 * The record_request() call is the only place the counter is incremented, so without
	 * this a regression dropping the call (or writing the wrong key/TTL) would leave every
	 * rate-limit test green while the limiter does nothing in production.
	 */
	public function test_create_consent_log_records_request() {
		global $wpdb;
		$wpdb = new class() {
			/**
			 * Table prefix.
			 *
			 * @var string
			 */
			public $prefix = 'wp_';

			/**
			 * Pretend insert that always succeeds.
			 *
			 * @return int
			 */
			public function insert() {
				return 1;
			}
		};

		Functions\when( 'wp_date' )->justReturn( '2026-01-01 00:00:00' );
		Functions\when( 'get_current_user_id' )->justReturn( 0 );
		Functions\when( 'rest_ensure_response' )->returnArg();
		Functions\when( 'get_transient' )->justReturn( 5 );
		// The counter must advance once, keyed per IP, with the window TTL.
		Functions\expect( 'set_transient' )
			->once()
			->with( \Mockery::pattern( '/^jp_cc_rl_/' ), 6, 60 );

		$request = new WP_REST_Request();
		$request->set_param( 'consent_id', 'fixed-id' ); // Avoid wp_generate_uuid4().

		$result = $this->controller->create_consent_log( $request );

		$this->assertSame( array( 'consent_id' => 'fixed-id' ), $result );
	}

	/**
	 * A failed insert returns a 500 and does NOT advance the rate-limit counter.
	 *
	 * The counter tracks stored rows, so a server-side DB failure must not consume a
	 * legitimate client's budget.
	 */
	public function test_create_consent_log_skips_record_on_failed_insert() {
		global $wpdb;
		$wpdb = new class() {
			/**
			 * Table prefix.
			 *
			 * @var string
			 */
			public $prefix = 'wp_';

			/**
			 * Pretend insert that always fails.
			 *
			 * @return false
			 */
			public function insert() {
				return false;
			}
		};

		Functions\when( 'wp_date' )->justReturn( '2026-01-01 00:00:00' );
		Functions\when( 'get_current_user_id' )->justReturn( 0 );
		Functions\when( 'get_transient' )->justReturn( 5 );
		// A failed write must not touch the counter.
		Functions\expect( 'set_transient' )->never();

		$request = new WP_REST_Request();
		$request->set_param( 'consent_id', 'fixed-id' );

		$result = $this->controller->create_consent_log( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'database_error', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
	}

	/**
	 * A missing IP collapses to a single shared "unknown" bucket so it can't be flooded.
	 */
	public function test_missing_ip_uses_shared_unknown_bucket() {
		unset( $_SERVER['REMOTE_ADDR'] ); // jetpack-ip yields false -> 'unknown' bucket.
		Functions\expect( 'get_transient' )
			->once()
			->with( 'jp_cc_rl_' . md5( 'unknown' ) )
			->andReturn( 0 );

		$this->assertTrue( $this->controller->check_create_permission() );
	}

	/**
	 * The 429 path attaches Retry-After to the dispatched response via rest_post_dispatch.
	 *
	 * A WP_Error from permission_callback can't carry headers, so the header is added by a
	 * filter closure instead — this drives that closure to verify the header and its guards.
	 */
	public function test_rate_limited_attaches_retry_after_header() {
		Functions\when( 'get_transient' )->justReturn( 100 ); // At RATE_LIMIT_MAX.

		$captured = null;
		Functions\expect( 'add_filter' )
			->once()
			->with(
				'rest_post_dispatch',
				\Mockery::on(
					static function ( $callback ) use ( &$captured ) {
						$captured = $callback;
						return is_callable( $callback );
					}
				)
			);

		$this->controller->check_create_permission();

		$this->assertIsCallable( $captured );

		// A 429 response gets the header stamped.
		$response = new WP_REST_Response( null, 429 );
		$captured( $response );
		$this->assertSame( '60', $response->get_header( 'Retry-After' ) );

		// A non-429 response is left untouched (guard branch).
		$other = new WP_REST_Response( null, 200 );
		$captured( $other );
		$this->assertNull( $other->get_header( 'Retry-After' ) );
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
	 * Request parameters.
	 *
	 * @var array
	 */
	private $params = array();

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

	/**
	 * Set a parameter value.
	 *
	 * @param string $key   Parameter name.
	 * @param mixed  $value Parameter value.
	 */
	public function set_param( $key, $value ) {
		$this->params[ $key ] = $value;
	}

	/**
	 * Get a parameter value.
	 *
	 * @param string $key Parameter name.
	 * @return mixed|null
	 */
	public function get_param( $key ) {
		return $this->params[ $key ] ?? null;
	}
}

/**
 * Minimal WP_REST_Response test double.
 */
class WP_REST_Response {

	/**
	 * HTTP status code.
	 *
	 * @var int
	 */
	private $status;

	/**
	 * Response headers.
	 *
	 * @var array
	 */
	private $headers = array();

	/**
	 * Construct the response.
	 *
	 * @param mixed $data   Response data (unused by these tests).
	 * @param int   $status HTTP status code.
	 */
	public function __construct( $data = null, $status = 200 ) {
		$this->status = $status;
	}

	/**
	 * Get the status code.
	 *
	 * @return int
	 */
	public function get_status() {
		return $this->status;
	}

	/**
	 * Set a header value.
	 *
	 * @param string $key   Header key.
	 * @param string $value Header value.
	 */
	public function header( $key, $value ) {
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
