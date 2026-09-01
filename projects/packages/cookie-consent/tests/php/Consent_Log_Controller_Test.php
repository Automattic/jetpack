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
		remove_all_filters( 'jetpack_cookie_consent_rate_limit_max' );
		remove_all_filters( 'jetpack_cookie_consent_log_retention_days' );
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

			$this->reset_cookie_consent_config();
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
	 * Test that an IP mode injected via init()'s log config takes priority over
	 * Cookie_Consent's global config, without a consumer needing to touch that config.
	 */
	public function test_ip_mode_read_from_injected_log_config() {
		$instance = Consent_Log_Controller::init( array( 'ip_mode' => 'hash' ) );

		$ref = new ReflectionMethod( Consent_Log_Controller::class, 'get_ip_mode' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}

		$this->assertSame( 'hash', $ref->invoke( $instance ) );
	}

	/**
	 * An unknown injected ip_mode falls back to the schema default. get_ip_mode() now
	 * validates against Config_Schema (the single enum source) rather than a local
	 * constant, so this guards that the controller and schema can't drift apart.
	 */
	public function test_get_ip_mode_falls_back_to_default_for_unknown_mode() {
		$instance = Consent_Log_Controller::init( array( 'ip_mode' => 'bogus' ) );

		$ref = new ReflectionMethod( Consent_Log_Controller::class, 'get_ip_mode' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}

		$this->assertSame( Config_Schema::default_ip_mode(), $ref->invoke( $instance ) );
	}

	/**
	 * The cleanup cutoff is derived from the retention_days injected via init().
	 */
	public function test_cleanup_uses_injected_retention_days() {
		$cutoff_ts = $this->capture_cleanup_cutoff( array( 'retention_days' => 1 ) );

		$this->assertEqualsWithDelta( time() - DAY_IN_SECONDS, $cutoff_ts, 600, 'Cutoff should be one day back for retention_days=1.' );
	}

	/**
	 * A malformed injected retention_days falls back to DEFAULT_RETENTION_DAYS rather than
	 * deleting everything (cutoff = now) or erroring. Guards the `log` group's deliberate
	 * lack of schema validation, whose sole protection is the filter_var/`<= 0` guard.
	 */
	public function test_cleanup_falls_back_on_malformed_retention_days() {
		$default_days = ( new \ReflectionClass( Consent_Log_Controller::class ) )->getConstant( 'DEFAULT_RETENTION_DAYS' );

		foreach ( array( 'nonsense', 0, -5 ) as $bad ) {
			$cutoff_ts = $this->capture_cleanup_cutoff( array( 'retention_days' => $bad ) );

			$this->assertEqualsWithDelta(
				time() - ( $default_days * DAY_IN_SECONDS ),
				$cutoff_ts,
				600,
				"Malformed retention_days ($bad) should fall back to DEFAULT_RETENTION_DAYS."
			);
		}
	}

	/**
	 * The `jetpack_cookie_consent_log_retention_days` filter stays as a back-compat
	 * override for sites that don't own the init() call, taking precedence over the
	 * injected retention_days.
	 */
	public function test_cleanup_retention_days_filter_overrides_injected_value() {
		add_filter(
			'jetpack_cookie_consent_log_retention_days',
			static function () {
				return 3;
			}
		);

		$cutoff_ts = $this->capture_cleanup_cutoff( array( 'retention_days' => 1 ) );

		$this->assertEqualsWithDelta( time() - ( 3 * DAY_IN_SECONDS ), $cutoff_ts, 600, 'Filter value should override the injected retention_days.' );
	}

	/**
	 * Run cleanup_expired_logs() against a $wpdb that records the DELETE cutoff instead of
	 * touching a real table, mirroring the insert-boundary interception used elsewhere.
	 *
	 * @param array $log_config Log config to inject via init().
	 * @return int Cutoff as a UNIX timestamp parsed from the captured GMT date.
	 */
	private function capture_cleanup_cutoff( array $log_config ) {
		$instance = Consent_Log_Controller::init( $log_config );

		global $wpdb;
		$real_wpdb = $wpdb;
		$wpdb      = new class( $real_wpdb ) {
			/**
			 * Underlying database handle.
			 *
			 * @var \wpdb
			 */
			private $real;

			/**
			 * Cutoff date (GMT) captured from the DELETE prepare() call.
			 *
			 * @var string|null
			 */
			public $cutoff = null;

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
			 * Delegate uncaptured method calls to the real handle.
			 *
			 * @param string $name Method name.
			 * @param array  $args Arguments.
			 * @return mixed
			 */
			public function __call( $name, $args ) {
				return $this->real->$name( ...$args );
			}

			/**
			 * Capture the cutoff argument, then delegate to the real prepare().
			 *
			 * @param string $query Query with placeholders.
			 * @param mixed  ...$args Positional args: table, cutoff, batch size.
			 * @return string
			 */
			public function prepare( $query, ...$args ) {
				if ( null === $this->cutoff && isset( $args[1] ) ) {
					$this->cutoff = $args[1];
				}
				return $this->real->prepare( $query, ...$args );
			}

			/**
			 * Report zero rows deleted so cleanup's batch loop terminates immediately.
			 *
			 * @return int
			 */
			public function query() {
				return 0;
			}
		};

		try {
			$instance->cleanup_expired_logs();
			$cutoff = $wpdb->cutoff;
		} finally {
			$wpdb = $real_wpdb;
		}

		$this->assertNotNull( $cutoff, 'cleanup_expired_logs() should reach the DELETE prepare().' );
		return (int) strtotime( $cutoff . ' UTC' );
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
		$this->set_cookie_consent_config(
			array(
				'log' => array(
					'ip_mode' => $mode,
				),
			)
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
		$categories   = Config_Schema::resolve()['consent']['categories'];
		$categories[] = array(
			'key'             => 'personalization',
			'label'           => 'Personalization',
			'description'     => 'Personalized site features.',
			'required'        => false,
			'default_checked' => false,
			'wp_consent_map'  => array( 'personalization' ),
		);
		$this->set_cookie_consent_config(
			array(
				'consent' => array(
					'categories' => $categories,
				),
			)
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

		$this->set_cookie_consent_config(
			array(
				'log' => array(
					'policy_version' => 'policy-2026-06',
					'banner_version' => 'banner-2026-06',
				),
			)
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
