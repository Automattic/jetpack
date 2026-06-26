<?php
/**
 * Consent log controller test suite.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use ReflectionMethod;

require_once __DIR__ . '/consent-log-controller-test-functions.php';

/**
 * Consent log controller test suite.
 */
class Consent_Log_Controller_Test extends TestCase {
	/**
	 * Controller under test.
	 *
	 * @var Consent_Log_Controller
	 */
	private $controller;

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

		$this->controller = new Consent_Log_Controller();
		$this->server     = $_SERVER;
		$GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_exists'] = true;
		$GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_calls']  = array();
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		$_SERVER = $this->server;
		remove_all_filters( 'jetpack_cookie_consent_config' );
		unset( $GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_exists'] );
		unset( $GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_calls'] );

		parent::tearDown();
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
	 * Test that forwarded IP addresses use the first valid address.
	 */
	public function test_raw_ip_mode_uses_first_forwarded_ip_address() {
		$this->set_config_ip_mode( 'raw' );
		$_SERVER = array(
			'HTTP_X_FORWARDED_FOR' => '203.0.113.42, 198.51.100.10',
			'REMOTE_ADDR'          => '198.51.100.20',
		);

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
		$this->assertSame( 44, strlen( $stored_ip ) );
		$this->assertSame( base64_encode( hash_hmac( 'sha256', $ip_address, wp_salt( 'auth' ), true ) ), $stored_ip );
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
		$method = new ReflectionMethod( Consent_Log_Controller::class, 'get_consent_log_ip_address' );

		// setAccessible() is required to invoke private methods on PHP < 8.1, but
		// is a no-op (and deprecated as of 8.5) on newer versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $this->controller );
	}
}
