<?php
/**
 * Registration failure state and retry backoff testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Utility\CaseInsensitiveDictionary;

/**
 * Registration failure state and retry backoff testing.
 *
 * @covers \Automattic\Jetpack\Connection\Registration_Failure
 */
#[CoversClass( Registration_Failure::class )]
class Registration_Failure_Test extends \WorDBless\BaseTestCase {

	/**
	 * The connection manager.
	 *
	 * @var Manager
	 */
	private $manager;

	/**
	 * Number of registration requests the HTTP mock has intercepted.
	 *
	 * @var int
	 */
	private $register_request_count = 0;

	/**
	 * The canned response the HTTP mock returns for a registration request.
	 *
	 * @var array|\WP_Error
	 */
	private $register_response;

	/**
	 * Set up the test.
	 */
	public function set_up() {
		$this->manager                = new Manager();
		$this->register_request_count = 0;
		$this->register_response      = self::success_response();

		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		// Avoid an extra request to determine the site creation date.
		set_transient( 'jetpack_assumed_site_creation_date', '2021-01-01 01:01:01' );

		add_filter( 'pre_http_request', array( $this, 'intercept_http_request' ), 10, 3 );
	}

	/**
	 * Clean up after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'intercept_http_request' ), 10 );
		delete_transient( 'jetpack_assumed_site_creation_date' );
		Registration_Failure::clear();
		remove_all_filters( 'jetpack_offline_mode' );
		StatusCache::clear();
		Constants::clear_constants();
	}

	/**
	 * Intercept every outgoing HTTP request so that no test reaches the network.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args     The request arguments.
	 * @param string     $url      The request URL.
	 *
	 * @return array|\WP_Error
	 */
	public function intercept_http_request( $response, $args, $url ) {
		if ( str_contains( $url, 'jetpack.register' ) ) {
			++$this->register_request_count;
			return $this->register_response;
		}

		return array(
			'headers'  => self::headers( array() ),
			'body'     => '',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Test that no registration request is made while the site is in offline mode.
	 */
	public function test_offline_mode_prevents_registration_request() {
		add_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();

		$result = $this->manager->try_registration();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'offline_mode', $result->get_error_code() );
		$this->assertSame( 0, $this->register_request_count );
		$this->assertNull( $this->manager->get_registration_failure() );
	}

	/**
	 * Test that an error which cannot resolve on its own stops further attempts.
	 */
	public function test_terminal_error_blocks_subsequent_attempts() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );

		$first = $this->manager->try_registration();

		$this->assertInstanceOf( \WP_Error::class, $first );
		$this->assertSame( 'siteurl_private_ip', $first->get_error_code() );
		$this->assertSame( 1, $this->register_request_count );

		$state = $this->recorded_failure();
		$this->assertTrue( $state['terminal'] );
		$this->assertNull( $state['next_retry_after'] );
		$this->assertSame( 1, $state['attempts'] );

		$second = $this->manager->try_registration();

		$this->assertInstanceOf( \WP_Error::class, $second );
		$this->assertSame( 'siteurl_private_ip', $second->get_error_code() );
		$this->assertSame( 'The site URL is a private IP address.', $second->get_error_message() );
		$this->assertSame( 1, $this->register_request_count, 'A terminal failure must not be retried automatically.' );

		$data = $second->get_error_data();
		$this->assertIsArray( $data );
		$this->assertTrue( $data['suppressed'] );
	}

	/**
	 * Test that a temporary error is retried on a lengthening schedule.
	 */
	public function test_transient_error_backs_off_and_retries_after_expiry() {
		$this->register_response = self::error_response( 'connection_refused', 'Connection refused.', 400 );

		$this->manager->try_registration();

		$first_state = $this->recorded_failure();
		$this->assertFalse( $first_state['terminal'] );
		$this->assertGreaterThan( time(), $first_state['next_retry_after'] );
		$this->assertSame( 1, $this->register_request_count );

		// Still within the backoff window: no request, and the stored error comes back.
		$blocked = $this->manager->try_registration();
		$this->assertInstanceOf( \WP_Error::class, $blocked );
		$this->assertSame( 'connection_refused', $blocked->get_error_code() );
		$this->assertSame( 1, $this->register_request_count );

		self::expire_backoff();

		$this->manager->try_registration();

		$second_state = $this->recorded_failure();
		$this->assertSame( 2, $this->register_request_count );
		$this->assertSame( 2, $second_state['attempts'] );
		$this->assertGreaterThan(
			$first_state['next_retry_after'] - $first_state['last_attempt_at'],
			$second_state['next_retry_after'] - $second_state['last_attempt_at'],
			'Each successive failure should wait longer than the last.'
		);
	}

	/**
	 * Test that a 429 response defers the next attempt by at least the `Retry-After` window.
	 */
	public function test_too_many_requests_honors_retry_after_header() {
		$this->register_response = self::error_response(
			'too_many_requests',
			'Too many requests.',
			429,
			array( 'Retry-After' => '3600' )
		);

		$before = time();
		$this->manager->try_registration();

		$state = $this->recorded_failure();

		$this->assertSame( 429, $state['http_status'] );
		$this->assertFalse( $state['terminal'] );
		$this->assertGreaterThanOrEqual( $before + 3600, $state['next_retry_after'] );
		// The window may be padded with jitter, but not stretched beyond it.
		$this->assertLessThanOrEqual( time() + 3600 + 360, $state['next_retry_after'] );
	}

	/**
	 * Test that a successful registration forgets the previous failure.
	 */
	public function test_successful_registration_clears_state() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();
		$this->assertIsArray( $this->manager->get_registration_failure() );

		$this->register_response = self::success_response();
		$this->assertTrue( $this->manager->try_registration( true, true ) );

		$this->assertNull( $this->manager->get_registration_failure() );
	}

	/**
	 * Test that moving the site to a different address gives it a fresh chance.
	 */
	public function test_changing_siteurl_clears_state() {
		Registration_Failure::init_hooks();

		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();
		$this->assertIsArray( $this->manager->get_registration_failure() );

		update_option( 'siteurl', 'https://reachable.example.com' );

		$this->assertNull( $this->manager->get_registration_failure() );

		$this->manager->try_registration();
		$this->assertSame( 2, $this->register_request_count, 'A site that moved should be allowed to try again.' );
	}

	/**
	 * Test that an attempt a user asked for is never held back.
	 */
	public function test_forced_attempt_bypasses_the_gate() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );

		$this->manager->try_registration();
		$blocked = $this->manager->try_registration();

		$this->assertInstanceOf( \WP_Error::class, $blocked );
		$this->assertSame( 1, $this->register_request_count );

		$this->manager->try_registration( true, true );

		$this->assertSame( 2, $this->register_request_count );
	}

	/**
	 * Get the recorded failure state, asserting that there is one.
	 *
	 * @return array
	 */
	private function recorded_failure() {
		$state = $this->manager->get_registration_failure();
		$this->assertIsArray( $state );

		return (array) $state;
	}

	/**
	 * Test the classification of error codes.
	 */
	public function test_is_terminal() {
		$this->assertTrue( Registration_Failure::is_terminal( 'siteurl_private_ip' ) );
		$this->assertTrue( Registration_Failure::is_terminal( 'request_cancelled' ) );
		$this->assertTrue( Registration_Failure::is_terminal( 'secret_1_missing' ) );
		$this->assertTrue( Registration_Failure::is_terminal( 'siteurl_malformed' ) );

		$this->assertFalse( Registration_Failure::is_terminal( 'site_inaccessible' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'wpcom_5??' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'too_many_requests' ) );
		// Codes the client does not know about could be temporary, so they are retried.
		$this->assertFalse( Registration_Failure::is_terminal( 'some_future_error' ) );
	}

	/**
	 * Move the stored backoff window into the past.
	 *
	 * @return void
	 */
	private static function expire_backoff() {
		$state                     = get_option( Registration_Failure::OPTION );
		$state['next_retry_after'] = time() - 1;
		update_option( Registration_Failure::OPTION, $state, false );
	}

	/**
	 * Build a successful registration response.
	 *
	 * @return array
	 */
	private static function success_response() {
		return array(
			'headers'  => self::headers( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode(
				array(
					'jetpack_id'     => '12345',
					'jetpack_secret' => 'sample_secret',
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Build a failed registration response.
	 *
	 * @param string $error       The error code returned by the server.
	 * @param string $description The error description returned by the server.
	 * @param int    $status      The HTTP status code.
	 * @param array  $headers     Additional response headers.
	 *
	 * @return array
	 */
	private static function error_response( $error, $description, $status, array $headers = array() ) {
		return array(
			'headers'  => self::headers( array_merge( array( 'content-type' => 'application/json' ), $headers ) ),
			'body'     => wp_json_encode(
				array(
					'error'             => $error,
					'error_description' => $description,
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			),
			'response' => array(
				'code'    => $status,
				'message' => 'Error',
			),
		);
	}

	/**
	 * Build a response headers object.
	 *
	 * @param array $headers The headers.
	 *
	 * @return CaseInsensitiveDictionary
	 */
	private static function headers( array $headers ) {
		return new CaseInsensitiveDictionary( $headers );
	}
}
