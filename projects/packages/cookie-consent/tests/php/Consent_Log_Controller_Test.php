<?php
/**
 * Tests for the Consent_Log_Controller write-endpoint protections.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionMethod;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

require_once __DIR__ . '/consent-log-controller-test-functions.php';

/**
 * Tests for the consent-log write endpoint: input validation, sanitization, and the
 * per-IP rate limiter.
 *
 * The rate limiter is exercised through its object-cache backend (atomic wp_cache_incr),
 * which is portable to the test environment. The DB backend's atomic UPDATE is MySQL-specific
 * and is verified separately against a real database.
 *
 * @covers \Automattic\Jetpack\CookieConsent\Consent_Log_Controller
 */
#[CoversClass( Consent_Log_Controller::class )]
class Consent_Log_Controller_Test extends TestCase {

	/**
	 * Controller under test.
	 *
	 * @var Consent_Log_Controller
	 */
	private $controller;

	/**
	 * A bare request object for validate_* callbacks (which ignore it).
	 *
	 * @var WP_REST_Request
	 */
	private $request;

	/**
	 * Previous server state.
	 *
	 * @var array
	 */
	private $server;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->controller       = new Consent_Log_Controller();
		$this->request          = new WP_REST_Request();
		$this->server           = $_SERVER;
		$_SERVER['REMOTE_ADDR'] = '203.0.113.5';
		$GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_exists'] = true;
		$GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_calls']  = array();
		// Rate-limit counters live in the object cache; start each test from a clean slate.
		wp_cache_flush();
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		$_SERVER = $this->server;
		// Reset state some tests flip on, so sibling suites see the defaults.
		wp_using_ext_object_cache( false );
		remove_all_filters( 'jetpack_cookie_consent_config' );
		remove_all_filters( 'jetpack_cookie_consent_rate_limit_max' );
		unset( $GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_exists'] );
		unset( $GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_calls'] );
		wp_cache_flush();
		parent::tearDown();
	}

	/**
	 * Invoke a private method on the controller.
	 *
	 * @param string $name    Method name.
	 * @param mixed  ...$args Arguments to forward.
	 * @return mixed
	 */
	private function invoke( $name, ...$args ) {
		$method = new ReflectionMethod( $this->controller, $name );
		// setAccessible() is required on PHP < 8.1 but a no-op since, and deprecated in 8.5.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $this->controller, ...$args );
	}

	/**
	 * Force the rate limiter onto its object-cache backend at the given cap.
	 *
	 * @param int $max Maximum requests allowed per IP within the window.
	 */
	private function force_object_cache_limit( $max ) {
		wp_using_ext_object_cache( true );
		add_filter(
			'jetpack_cookie_consent_rate_limit_max',
			static function () use ( $max ) {
				return $max;
			}
		);
	}

	/**
	 * Test that IP handling defaults to dropping the IP address.
	 */
	public function test_ip_mode_defaults_to_drop() {
		$this->set_server_ip( '203.0.113.42' );

		$this->assertNull( $this->get_consent_log_ip_address() );
	}

	/**
	 * Test configured IP handling modes.
	 */
	public function test_ip_mode_formats_logged_ip_address() {
		foreach ( $this->get_ip_mode_cases() as $case => $args ) {
			list( $mode, $ip_address, $expected ) = $args;

			remove_all_filters( 'jetpack_cookie_consent_config' );
			$this->set_config_ip_mode( $mode );
			$this->set_server_ip( $ip_address );

			$this->assertSame( $expected, $this->get_consent_log_ip_address(), $case );
		}
	}

	/**
	 * Test that unknown IP modes fall back to the conservative default.
	 */
	public function test_invalid_ip_mode_defaults_to_drop() {
		$this->set_config_ip_mode( 'unknown' );
		$this->set_server_ip( '203.0.113.42' );

		$this->assertNull( $this->get_consent_log_ip_address() );
	}

	/**
	 * Test that raw mode stores the resolved IP address.
	 */
	public function test_raw_ip_mode_stores_resolved_ip_address() {
		$this->set_config_ip_mode( 'raw' );
		$this->set_server_ip( '203.0.113.42' );

		$this->assertSame( '203.0.113.42', $this->get_consent_log_ip_address() );
	}

	/**
	 * Test that hashed IP addresses are deterministic and do not persist the raw IP.
	 */
	public function test_hash_mode_stores_hashed_ip_address() {
		$ip_address = '203.0.113.42';

		$this->set_config_ip_mode( 'hash' );
		$this->set_server_ip( $ip_address );

		$stored_ip = $this->get_consent_log_ip_address();

		$this->assertNotSame( $ip_address, $stored_ip );
		$this->assertSame( 64, strlen( $stored_ip ) );
		$this->assertSame( hash_hmac( 'sha256', $ip_address, wp_salt( 'auth' ) ), $stored_ip );
	}

	/**
	 * Test that truncate mode uses WordPress's anonymizer when available.
	 */
	public function test_truncate_ip_mode_uses_wp_privacy_anonymize_ip() {
		$this->set_config_ip_mode( 'truncate' );

		$this->set_server_ip( '203.0.113.42' );
		$this->assertSame( '203.0.113.0', $this->get_consent_log_ip_address() );

		$this->set_server_ip( '2001:db8:abcd:1234:5678:90ab:cdef:1234' );
		$this->assertSame( '2001:db8:abcd:1234::', $this->get_consent_log_ip_address() );

		$this->assertSame(
			array(
				'203.0.113.42',
				'2001:db8:abcd:1234:5678:90ab:cdef:1234',
			),
			$GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_calls']
		);
	}

	/**
	 * Test that truncate mode falls back when WordPress's anonymizer is unavailable.
	 */
	public function test_truncate_ip_mode_uses_fallback_without_wp_privacy_anonymize_ip() {
		$GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_exists'] = false;
		$this->set_config_ip_mode( 'truncate' );

		$this->set_server_ip( '203.0.113.42' );
		$this->assertSame( '203.0.113.0', $this->get_consent_log_ip_address() );

		$this->set_server_ip( '2001:db8:abcd:1234:5678:90ab:cdef:1234' );
		$this->assertSame( '2001:db8:abcd:1234::', $this->get_consent_log_ip_address() );

		$this->assertSame( array(), $GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_calls'] );
	}

	/**
	 * Test that the read schema allows dropped IP addresses.
	 */
	public function test_consent_logs_schema_allows_null_ip_address() {
		$schema = $this->controller->get_consent_logs_schema();

		$this->assertSame( array( 'string', 'null' ), $schema['items']['properties']['ip_address']['type'] );
	}

	/**
	 * Get IP mode test cases.
	 *
	 * @return array
	 */
	private function get_ip_mode_cases() {
		return array(
			'raw'  => array( 'raw', '203.0.113.42', '203.0.113.42' ),
			'drop' => array( 'drop', '203.0.113.42', null ),
		);
	}

	/**
	 * Set the configured IP handling mode.
	 *
	 * @param string $mode IP handling mode.
	 */
	private function set_config_ip_mode( $mode ) {
		add_filter(
			'jetpack_cookie_consent_config',
			function ( $config ) use ( $mode ) {
				$config['log']['ip_mode'] = $mode;
				return $config;
			}
		);
	}

	/**
	 * Set the server IP address.
	 *
	 * @param string $ip_address IP address.
	 */
	private function set_server_ip( $ip_address ) {
		$_SERVER = array(
			'REMOTE_ADDR' => $ip_address,
		);
	}

	/**
	 * Invoke the private consent log IP resolver.
	 *
	 * @return string|null
	 */
	private function get_consent_log_ip_address() {
		return $this->invoke( 'get_consent_log_ip_address', $this->invoke( 'get_client_ip' ) );
	}

	/**
	 * A well-formed http(s) URL within the length cap validates.
	 */
	public function test_validate_url_accepts_valid_url() {
		$this->assertTrue( $this->controller->validate_url( 'https://example.com/page', $this->request, 'url' ) );
		$this->assertTrue( $this->controller->validate_url( 'http://example.com/page', $this->request, 'url' ) );
	}

	/**
	 * An empty URL is allowed (the field is optional).
	 */
	public function test_validate_url_allows_empty() {
		$this->assertTrue( $this->controller->validate_url( '', $this->request, 'url' ) );
	}

	/**
	 * A URL exceeding the length cap is rejected.
	 */
	public function test_validate_url_rejects_overlong_url() {
		$long = 'https://example.com/' . str_repeat( 'a', 2000 );

		$result = $this->controller->validate_url( $long, $this->request, 'url' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * A malformed URL (no http(s) scheme) is rejected.
	 */
	public function test_validate_url_rejects_invalid_url() {
		$this->assertInstanceOf( WP_Error::class, $this->controller->validate_url( 'not a url', $this->request, 'url' ) );
	}

	/**
	 * A non-http(s) scheme (e.g. javascript:) is rejected.
	 */
	public function test_validate_url_rejects_non_http_scheme() {
		$this->assertInstanceOf( WP_Error::class, $this->controller->validate_url( 'javascript:alert(1)', $this->request, 'url' ) );
	}

	/**
	 * An http(s) URL with no host is rejected.
	 */
	public function test_validate_url_rejects_hostless_url() {
		$this->assertInstanceOf( WP_Error::class, $this->controller->validate_url( 'http://', $this->request, 'url' ) );
	}

	/**
	 * A valid UUID and an empty value both validate (the field is optional).
	 */
	public function test_validate_uuid_accepts_valid_and_empty() {
		$this->assertTrue( $this->controller->validate_uuid( '', $this->request, 'consent_id' ) );
		$this->assertTrue( $this->controller->validate_uuid( wp_generate_uuid4(), $this->request, 'consent_id' ) );
	}

	/**
	 * A malformed UUID is rejected.
	 */
	public function test_validate_uuid_rejects_malformed() {
		$result = $this->controller->validate_uuid( 'not-a-uuid', $this->request, 'consent_id' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	/**
	 * Consent types are bounded to the configured category registry; unknown keys are dropped.
	 */
	public function test_sanitize_consent_types_filters_to_allowed_keys() {
		$result = $this->controller->sanitize_consent_types(
			array(
				'functional' => true,
				'analytics'  => false,
				'marketing'  => true,
				'evil'       => true,
			)
		);

		$this->assertSame(
			array(
				'functional' => true,
				'analytics'  => false,
				'marketing'  => true,
			),
			$result
		);
		$this->assertArrayNotHasKey( 'evil', $result );
	}

	/**
	 * Consent types are allowed from the configured category registry.
	 */
	public function test_sanitize_consent_types_allows_configured_category_keys() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['consent']['categories'][] = array(
					'key'             => 'personalization',
					'label'           => 'Personalization',
					'description'     => 'Personalized site features.',
					'required'        => false,
					'default_checked' => false,
					'wp_consent_map'  => array( 'personalization' ),
				);

				return $config;
			}
		);

		$result = $this->controller->sanitize_consent_types(
			array(
				'functional'      => true,
				'analytics'       => false,
				'marketing'       => false,
				'personalization' => true,
				'evil'            => true,
			)
		);

		$this->assertSame(
			array(
				'functional'      => true,
				'analytics'       => false,
				'marketing'       => false,
				'personalization' => true,
			),
			$result
		);
		$this->assertArrayNotHasKey( 'evil', $result );
	}

	/**
	 * Non-array consent types sanitize to null.
	 */
	public function test_sanitize_consent_types_rejects_non_array() {
		$this->assertNull( $this->controller->sanitize_consent_types( 'nope' ) );
	}

	/**
	 * The limiter admits requests up to the cap and rejects the one past it.
	 *
	 * Because the reserve is a single atomic increment, repeated calls keep advancing the same
	 * per-IP/per-window counter rather than racing on a stale read.
	 */
	public function test_rate_limiter_trips_at_max() {
		$this->force_object_cache_limit( 3 );

		// The first three requests fit within the cap.
		for ( $i = 1; $i <= 3; $i++ ) {
			$this->assertTrue(
				$this->invoke( 'reserve_rate_limit_slot', '198.51.100.7' ),
				"request {$i} should be admitted"
			);
		}

		// The fourth is over the cap.
		$this->assertFalse( $this->invoke( 'reserve_rate_limit_slot', '198.51.100.7' ) );
	}

	/**
	 * Each IP gets its own budget; one IP exhausting it doesn't block another.
	 */
	public function test_rate_limiter_buckets_are_per_ip() {
		$this->force_object_cache_limit( 1 );

		$this->assertTrue( $this->invoke( 'reserve_rate_limit_slot', '198.51.100.7' ) );
		$this->assertFalse( $this->invoke( 'reserve_rate_limit_slot', '198.51.100.7' ) );
		$this->assertTrue( $this->invoke( 'reserve_rate_limit_slot', '203.0.113.9' ) );
	}

	/**
	 * A missing IP collapses to a single shared bucket so it still can't be flooded.
	 */
	public function test_rate_limiter_shares_one_bucket_for_missing_ip() {
		$this->force_object_cache_limit( 1 );

		$this->assertTrue( $this->invoke( 'reserve_rate_limit_slot', false ) );
		$this->assertFalse( $this->invoke( 'reserve_rate_limit_slot', false ) );
	}

	/**
	 * The 429 response carries the conventional rate-limit headers.
	 */
	public function test_rate_limited_response_carries_headers() {
		$response = $this->invoke( 'rate_limited_response' );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 429, $response->get_status() );

		$headers = $response->get_headers();
		$this->assertSame( '100', $headers['RateLimit-Limit'] );
		$this->assertSame( '0', $headers['RateLimit-Remaining'] );

		// Retry-After is the seconds left in the current window (1..window); Reset mirrors it.
		$retry_after = $headers['Retry-After'];
		$this->assertSame( 1, preg_match( '/^[0-9]+$/', (string) $retry_after ) );
		$this->assertGreaterThanOrEqual( 1, (int) $retry_after );
		$this->assertLessThanOrEqual( 60, (int) $retry_after );
		$this->assertSame( $retry_after, $headers['RateLimit-Reset'] );
	}

	/**
	 * Once an IP is at the cap, a real write request is rejected with a 429 before any insert.
	 */
	public function test_create_consent_log_returns_429_when_rate_limited() {
		$this->force_object_cache_limit( 1 );

		// Consume the only slot for this request's IP (REMOTE_ADDR set in setUp).
		$this->assertTrue( $this->invoke( 'reserve_rate_limit_slot', '203.0.113.5' ) );

		$response = $this->controller->create_consent_log( new WP_REST_Request() );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 429, $response->get_status() );
	}

	/**
	 * A successful write sends the configured version columns to $wpdb->insert(), with the
	 * positional format map kept 1:1 with the data columns it describes.
	 *
	 * The consent-log table is MySQL-backed and not queryable in this harness (see class
	 * docblock), so the write is captured at the $wpdb->insert() boundary. This guards the
	 * load-bearing coupling between $data and its $format array: a future column reorder or
	 * addition that forgets the matching format entry would misformat values silently, and
	 * no helper-level unit test would catch it.
	 */
	public function test_create_consent_log_persists_version_columns() {
		// Admit the write past the rate limiter (object-cache backend is portable here).
		$this->force_object_cache_limit( 10 );

		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['log']['policy_version'] = 'policy-2026-06';
				$config['log']['banner_version'] = 'banner-2026-06';

				return $config;
			}
		);

		global $wpdb;
		$real_wpdb = $wpdb;
		// Intercept only the consent-log insert; delegate everything else (option reads, the
		// table prefix) to the real handle so the rest of the request path behaves normally.
		$wpdb = new class( $real_wpdb ) {
			/**
			 * Underlying database handle.
			 *
			 * @var \wpdb
			 */
			private $real;

			/**
			 * Arguments captured from the last insert() call.
			 *
			 * @var array<string, mixed>
			 */
			public $insert_args = array();

			/**
			 * Wrap the real database handle.
			 *
			 * @param \wpdb $real Real database handle.
			 */
			public function __construct( $real ) {
				$this->real = $real;
			}

			/**
			 * Delegate property reads (e.g. prefix) to the real handle.
			 *
			 * @param string $name Property name.
			 * @return mixed
			 */
			public function __get( $name ) {
				return $this->real->$name;
			}

			/**
			 * Delegate method calls (e.g. get_results) to the real handle.
			 *
			 * @param string $name Method name.
			 * @param array  $args Arguments.
			 * @return mixed
			 */
			public function __call( $name, $args ) {
				return $this->real->$name( ...$args );
			}

			/**
			 * Stand in for wpdb::insert(), recording its arguments.
			 *
			 * @param string $table  Table name.
			 * @param array  $data   Column => value pairs.
			 * @param array  $format Positional placeholder formats.
			 * @return int Rows "affected".
			 */
			public function insert( $table, $data, $format ) {
				$this->insert_args = compact( 'table', 'data', 'format' );
				return 1;
			}
		};

		$response    = null;
		$insert_args = array();
		try {
			$request = new WP_REST_Request();
			$request->set_param( 'event_type', 'accept_all' );
			$response    = $this->controller->create_consent_log( $request );
			$insert_args = $wpdb->insert_args;
		} finally {
			$wpdb = $real_wpdb;
		}

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$this->assertNotEmpty( $insert_args, 'create_consent_log() should reach $wpdb->insert().' );
		$data   = $insert_args['data'];
		$format = $insert_args['format'];

		// The configured proof-of-consent versions are written to the record.
		$this->assertSame( 'policy-2026-06', $data['policy_version'] );
		$this->assertSame( 'banner-2026-06', $data['banner_version'] );

		// The positional format map must stay 1:1 with the data columns.
		$this->assertSameSize( $data, $format );
	}
}
