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

		// Default to the DB-backed rate-limit path (no persistent object cache).
		Functions\when( 'wp_using_ext_object_cache' )->justReturn( false );
		Functions\when( 'add_option' )->justReturn( true );

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
	 * Build a global $wpdb double for the write path.
	 *
	 * @param int   $reserve_result Rows affected by the atomic reserve UPDATE (1 = slot taken, 0 = at cap).
	 * @param mixed $insert_result  Return value for the row insert (1 = success, false = failure).
	 * @return object
	 */
	private function make_wpdb( $reserve_result = 1, $insert_result = 1 ) {
		$wpdb = new class() {
			/**
			 * Table prefix.
			 *
			 * @var string
			 */
			public $prefix = 'wp_';

			/**
			 * Options table name.
			 *
			 * @var string
			 */
			public $options = 'wp_options';

			/**
			 * Rows the reserve UPDATE reports as affected.
			 *
			 * @var int
			 */
			public $reserve_result = 1;

			/**
			 * Return value for insert().
			 *
			 * @var mixed
			 */
			public $insert_result = 1;

			/**
			 * Option name captured from the reserve UPDATE.
			 *
			 * @var string|null
			 */
			public $reserved_option = null;

			/**
			 * Number of insert() calls.
			 *
			 * @var int
			 */
			public $insert_calls = 0;

			/**
			 * Capture the bound option name and return the query unchanged.
			 *
			 * @param string $query The SQL with placeholders.
			 * @param mixed  ...$args Bound arguments; the first is the option name.
			 * @return string
			 */
			public function prepare( $query, ...$args ) {
				$this->reserved_option = $args[0] ?? null;
				return $query;
			}

			/**
			 * Pretend the reserve UPDATE affected the configured number of rows.
			 *
			 * @return int
			 */
			public function query() {
				return $this->reserve_result;
			}

			/**
			 * Pretend insert with the configured result, counting calls.
			 *
			 * @return mixed
			 */
			public function insert() {
				++$this->insert_calls;
				return $this->insert_result;
			}
		};

		$wpdb->reserve_result = $reserve_result;
		$wpdb->insert_result  = $insert_result;

		return $wpdb;
	}

	/**
	 * Stub the non-rate-limit functions the write handler calls.
	 */
	private function stub_write_path() {
		Functions\when( 'wp_date' )->justReturn( '2026-01-01 00:00:00' );
		Functions\when( 'get_current_user_id' )->justReturn( 0 );
		Functions\when( 'rest_ensure_response' )->returnArg();
	}

	/**
	 * Build a write request with a fixed consent id (avoids wp_generate_uuid4()).
	 *
	 * @return WP_REST_Request
	 */
	private function write_request() {
		$request = new WP_REST_Request();
		$request->set_param( 'consent_id', 'fixed-id' );
		return $request;
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
	 * An accepted write reserves a slot via the atomic DB UPDATE, then inserts the row.
	 *
	 * The DB reserve returns 1 affected row (under the cap), so the request proceeds and the
	 * handler returns the consent id.
	 */
	public function test_create_consent_log_allows_under_limit() {
		global $wpdb;
		$wpdb = $this->make_wpdb( 1, 1 ); // Reserve succeeds, insert succeeds.

		$this->stub_write_path();

		$result = $this->controller->create_consent_log( $this->write_request() );

		$this->assertSame( array( 'consent_id' => 'fixed-id' ), $result );
		$this->assertSame( 1, $wpdb->insert_calls );
	}

	/**
	 * When the atomic reserve finds the IP at the cap (0 rows updated), the request is rejected
	 * with a 429 before any insert, and the response carries the rate-limit headers.
	 */
	public function test_create_consent_log_rate_limited_returns_429() {
		global $wpdb;
		$wpdb = $this->make_wpdb( 0 ); // Reserve fails: counter already at the cap.

		$this->stub_write_path();

		$result = $this->controller->create_consent_log( $this->write_request() );

		$this->assertInstanceOf( WP_REST_Response::class, $result );
		$this->assertSame( 429, $result->get_status() );
		$this->assertSame( '100', $result->get_header( 'RateLimit-Limit' ) );
		$this->assertSame( '0', $result->get_header( 'RateLimit-Remaining' ) );

		// Retry-After is the seconds left in the current window (1..window); Reset mirrors it.
		$retry_after = $result->get_header( 'Retry-After' );
		$this->assertSame( 1, preg_match( '/^[0-9]+$/', $retry_after ) );
		$this->assertGreaterThanOrEqual( 1, (int) $retry_after );
		$this->assertLessThanOrEqual( 60, (int) $retry_after );
		$this->assertSame( $retry_after, $result->get_header( 'RateLimit-Reset' ) );

		// A rejected request must never reach the insert.
		$this->assertSame( 0, $wpdb->insert_calls );
	}

	/**
	 * A failed insert (after a successful reserve) returns a 500.
	 */
	public function test_create_consent_log_failed_insert_returns_500() {
		global $wpdb;
		$wpdb = $this->make_wpdb( 1, false ); // Reserve succeeds, insert fails.

		$this->stub_write_path();

		$result = $this->controller->create_consent_log( $this->write_request() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'database_error', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
	}

	/**
	 * On sites with a persistent object cache the reserve uses the atomic wp_cache_incr path
	 * instead of the DB, and a count within the cap is allowed.
	 */
	public function test_reserve_uses_object_cache_when_available() {
		global $wpdb;
		$wpdb = $this->make_wpdb();

		Functions\when( 'wp_using_ext_object_cache' )->justReturn( true );
		Functions\when( 'wp_cache_add' )->justReturn( true );
		// Atomic increment returns the new count, one below the cap.
		Functions\expect( 'wp_cache_incr' )->once()->andReturn( 50 );
		$this->stub_write_path();

		$result = $this->controller->create_consent_log( $this->write_request() );

		$this->assertSame( array( 'consent_id' => 'fixed-id' ), $result );
		$this->assertSame( 1, $wpdb->insert_calls );
	}

	/**
	 * The object-cache path rejects once wp_cache_incr reports a count past the cap.
	 */
	public function test_object_cache_over_limit_returns_429() {
		global $wpdb;
		$wpdb = $this->make_wpdb();

		Functions\when( 'wp_using_ext_object_cache' )->justReturn( true );
		Functions\when( 'wp_cache_add' )->justReturn( true );
		Functions\when( 'wp_cache_incr' )->justReturn( 101 ); // One past RATE_LIMIT_MAX.
		$this->stub_write_path();

		$result = $this->controller->create_consent_log( $this->write_request() );

		$this->assertInstanceOf( WP_REST_Response::class, $result );
		$this->assertSame( 429, $result->get_status() );
		$this->assertSame( 0, $wpdb->insert_calls );
	}

	/**
	 * A missing IP collapses to a single shared, window-scoped "unknown" bucket so it can't be
	 * flooded, and the reserve key folds in the current fixed-window slot.
	 */
	public function test_missing_ip_uses_shared_window_scoped_unknown_bucket() {
		unset( $_SERVER['REMOTE_ADDR'] ); // jetpack-ip yields false -> 'unknown' bucket.

		global $wpdb;
		$wpdb = $this->make_wpdb( 1, 1 );

		$this->stub_write_path();

		$this->controller->create_consent_log( $this->write_request() );

		// Key is the shared 'unknown' bucket, scoped to the current fixed-window slot.
		$this->assertSame(
			1,
			preg_match( '/^_transient_jp_cc_rl_' . md5( 'unknown' ) . '_[0-9]+$/', $wpdb->reserved_option )
		);
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
