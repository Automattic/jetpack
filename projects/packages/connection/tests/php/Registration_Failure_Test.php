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
use PHPUnit\Framework\Attributes\DataProvider;
use WpOrg\Requests\Utility\CaseInsensitiveDictionary;

/**
 * Registration failure state and retry backoff testing.
 *
 * @covers \Automattic\Jetpack\Connection\Registration_Failure
 * @covers \Automattic\Jetpack\Connection\Manager
 */
#[CoversClass( Registration_Failure::class )]
#[CoversClass( Manager::class )]
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
		remove_filter( 'map_meta_cap', array( $this->manager, 'jetpack_connection_custom_caps' ), 1 );
		delete_transient( 'jetpack_assumed_site_creation_date' );
		Registration_Failure::clear();
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		$this->manager->reset_connection_status();
		remove_all_filters( 'jetpack_offline_mode' );
		unset( $_SERVER['HTTPS'] );
		StatusCache::clear();
		Constants::clear_constants();
		wp_set_current_user( 0 );
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

		$this->assertTrue( $this->manager->try_registration( true, true ) );
		$this->assertSame( 1, $this->register_request_count, 'An explicit request is attempted even in offline mode.' );
	}

	/**
	 * Test that an error describing the site's environment is retried daily at most.
	 */
	public function test_terminal_error_backs_off_for_a_day() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );

		$before = time();
		$first  = $this->manager->try_registration();

		$this->assertInstanceOf( \WP_Error::class, $first );
		$this->assertSame( 'siteurl_private_ip', $first->get_error_code() );
		$this->assertSame( 1, $this->register_request_count );

		$state = $this->recorded_failure();
		$this->assertTrue( $state['terminal'] );
		$this->assertSame( 1, $state['attempts'] );
		$this->assertGreaterThanOrEqual( $before + DAY_IN_SECONDS, $state['next_retry_after'] );
		$this->assertLessThanOrEqual( time() + DAY_IN_SECONDS * 1.1, $state['next_retry_after'] );

		$second = $this->manager->try_registration();

		$this->assertInstanceOf( \WP_Error::class, $second );
		$this->assertSame( 'siteurl_private_ip', $second->get_error_code() );
		$this->assertSame( 'The site URL is a private IP address.', $second->get_error_message() );
		$this->assertSame( 1, $this->register_request_count, 'A terminal failure must not be retried before its window elapses.' );

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
	 * Test that a transport failure, which has no HTTP response, backs off and is held back with an error status.
	 */
	public function test_transport_failure_is_held_back_with_an_error_status() {
		$this->register_response = new \WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out.' );

		$this->manager->try_registration();

		$state = $this->recorded_failure();
		$this->assertSame( 'register_http_request_failed', $state['error_code'] );
		$this->assertNull( $state['http_status'] );
		$this->assertFalse( $state['terminal'] );

		$held = $this->manager->try_registration();
		$this->assertSame( 1, $this->register_request_count );
		$this->assertSame( 400, $held->get_error_data()['status'] );
	}

	/**
	 * Test that a held-back attempt is counted as a suppression, not as an attempt.
	 */
	public function test_suppressed_attempt_does_not_count_as_an_attempt() {
		$this->register_response = self::error_response( 'connection_refused', 'Connection refused.', 400 );

		$this->manager->try_registration();
		$this->assertFalse( get_transient( Registration_Failure::SUPPRESSION_TRACKED_TRANSIENT ) );

		$first_held  = $this->manager->try_registration();
		$second_held = $this->manager->try_registration();

		$this->assertTrue( $first_held->get_error_data()['suppressed'] );
		$this->assertTrue( $second_held->get_error_data()['suppressed'] );

		$state = $this->recorded_failure();
		$this->assertSame( 1, $state['attempts'] );
		$this->assertNotFalse( get_transient( Registration_Failure::SUPPRESSION_TRACKED_TRANSIENT ), 'Suppressions are reported once per backoff window.' );
	}

	/**
	 * Test that failures landing inside an open window do not climb the schedule.
	 */
	public function test_overlapping_failures_do_not_escalate_the_backoff() {
		$this->register_response = self::error_response( 'connection_refused', 'Connection refused.', 400 );

		$this->manager->try_registration();
		// An attempt already in flight when the first failure was stored, then a forced one.
		$this->manager->register();
		$this->manager->try_registration( true, true );

		$this->assertSame( 3, $this->register_request_count );
		$this->assertSame( 1, $this->recorded_failure()['attempts'] );
	}

	/**
	 * Test that a failure from a 200 response is held back with an error status.
	 */
	public function test_held_back_error_never_carries_a_success_status() {
		$this->register_response         = self::success_response();
		$this->register_response['body'] = wp_json_encode( array( 'jetpack_id' => '12345' ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

		$this->manager->try_registration();
		$held = $this->manager->try_registration();

		$this->assertSame( 'jetpack_secret', $held->get_error_code() );
		$this->assertSame( 400, $held->get_error_data()['status'] );
	}

	/**
	 * Test that a 429 response defers the next attempt by at least the `Retry-After` window.
	 *
	 * @dataProvider retry_after_formats
	 *
	 * @param string $format Whether the header carries seconds or an HTTP date.
	 */
	#[DataProvider( 'retry_after_formats' )]
	public function test_too_many_requests_honors_retry_after_header( $format ) {
		$deadline = time() + 3600;
		$header   = 'seconds' === $format ? '3600' : gmdate( 'D, d M Y H:i:s', $deadline ) . ' GMT';

		$this->register_response = self::error_response(
			'too_many_requests',
			'Too many requests.',
			429,
			array( 'Retry-After' => $header )
		);

		$this->manager->try_registration();

		$state = $this->recorded_failure();

		$this->assertSame( 429, $state['http_status'] );
		$this->assertFalse( $state['terminal'] );
		$this->assertGreaterThanOrEqual( $deadline, $state['next_retry_after'] );
		$this->assertLessThanOrEqual( time() + 3600 + 360, $state['next_retry_after'] );
	}

	/**
	 * Formats the `Retry-After` header may use.
	 *
	 * @return array[]
	 */
	public static function retry_after_formats() {
		return array(
			'seconds'   => array( 'seconds' ),
			'HTTP date' => array( 'http-date' ),
		);
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

		$this->assertFalse( get_option( Registration_Failure::OPTION ) );
	}

	/**
	 * Test that the failure can be forgotten explicitly.
	 */
	public function test_clear_registration_failure_allows_the_next_attempt() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();
		$this->assertIsArray( $this->manager->get_registration_failure() );

		$this->manager->clear_registration_failure();

		$this->assertNull( $this->manager->get_registration_failure() );
		$this->manager->try_registration();
		$this->assertSame( 2, $this->register_request_count );
	}

	/**
	 * Test that moving the site to a different address gives it a fresh chance.
	 */
	public function test_changing_siteurl_allows_a_fresh_attempt() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();
		$this->assertIsArray( $this->manager->get_registration_failure() );

		// The constant path, which no option hook would ever see.
		Constants::set_constant( 'WP_SITEURL', 'https://reachable.example.com' );

		$this->assertNull( $this->manager->get_registration_failure() );

		$this->manager->try_registration();
		$this->assertSame( 2, $this->register_request_count, 'A site that moved should be allowed to try again.' );
	}

	/**
	 * Test that a failure stored under another address is ignored without being deleted.
	 */
	public function test_failure_for_another_address_is_ignored() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();

		$state                = get_option( Registration_Failure::OPTION );
		$state['fingerprint'] = 'stale';
		update_option( Registration_Failure::OPTION, $state, false );

		$this->assertNull( $this->manager->get_registration_failure() );
		$this->assertSame( 'stale', get_option( Registration_Failure::OPTION )['fingerprint'], 'Reading the state must not write it.' );
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
	 * Test the classification of error codes.
	 */
	public function test_is_terminal() {
		$this->assertTrue( Registration_Failure::is_terminal( 'siteurl_private_ip' ) );
		$this->assertTrue( Registration_Failure::is_terminal( 'secret_1_missing' ) );
		$this->assertTrue( Registration_Failure::is_terminal( 'siteurl_malformed' ) );
		$this->assertTrue( Registration_Failure::is_terminal( 'xml_extension_missing' ) );

		$this->assertFalse( Registration_Failure::is_terminal( 'site_inaccessible' ) );
		// Returned by the XML-RPC fallback after any failed REST verify.
		$this->assertFalse( Registration_Failure::is_terminal( 'site_inaccessible_403' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'site_requires_authorization' ) );
		// The verify step's codes are passed through by the server but describe expired or overwritten secrets.
		$this->assertFalse( Registration_Failure::is_terminal( 'verify_secrets_missing' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'verify_secret_1_missing' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'wpcom_5??' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'too_many_requests' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'request_cancelled' ) );
		$this->assertFalse( Registration_Failure::is_terminal( 'some_future_error' ) );
	}

	/**
	 * Test that the hourly rate limit backs off for at least its window.
	 */
	public function test_rate_limit_backs_off_for_at_least_an_hour() {
		$this->register_response = self::error_response( 'request_cancelled', 'Your site has been generating too many registration attempts.', 400 );

		$before = time();
		$this->manager->try_registration();

		$state = $this->recorded_failure();

		$this->assertFalse( $state['terminal'] );
		$this->assertGreaterThanOrEqual( $before + HOUR_IN_SECONDS, $state['next_retry_after'] );
		$this->assertLessThanOrEqual( time() + HOUR_IN_SECONDS + 360, $state['next_retry_after'] );
	}

	/**
	 * Test that being rate limited does not replace a stored terminal failure.
	 */
	public function test_rate_limit_does_not_overwrite_a_terminal_failure() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();
		self::expire_backoff();

		$this->register_response = self::error_response( 'request_cancelled', 'Your site has been generating too many registration attempts.', 400 );

		$before = time();
		$this->manager->try_registration( true, true );

		$state = $this->recorded_failure();
		$this->assertSame( 'siteurl_private_ip', $state['error_code'] );
		$this->assertSame( 'The site URL is a private IP address.', $state['error_message'] );
		$this->assertTrue( $state['terminal'] );
		$this->assertSame( 1, $state['attempts'] );
		$this->assertGreaterThanOrEqual( $before + HOUR_IN_SECONDS, $state['next_retry_after'], 'The next attempt must still be pushed out.' );

		$this->manager->try_registration();
		$this->assertSame( 2, $this->register_request_count, 'An expired window must not stay open after a rate-limited attempt.' );
	}

	/**
	 * Test that repeated rate limiting keeps a flat hourly window instead of climbing the schedule.
	 */
	public function test_rate_limit_does_not_climb_the_schedule() {
		$this->register_response = self::error_response( 'request_cancelled', 'Your site has been generating too many registration attempts.', 400 );

		$this->manager->try_registration();
		for ( $i = 0; $i < 5; $i++ ) {
			self::expire_backoff();
			$this->manager->try_registration();
		}

		$state = $this->recorded_failure();
		$this->assertSame( 6, $this->register_request_count );
		$this->assertSame( 1, $state['attempts'] );
		$this->assertLessThanOrEqual( time() + HOUR_IN_SECONDS + 360, $state['next_retry_after'] );
	}

	/**
	 * Test that a temporary error after a terminal one starts the schedule over.
	 */
	public function test_temporary_error_after_a_terminal_one_starts_the_schedule_over() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();
		self::expire_backoff();

		$this->register_response = self::error_response( 'connection_refused', 'Connection refused.', 400 );
		$this->manager->try_registration();

		$state = $this->recorded_failure();
		$this->assertFalse( $state['terminal'] );
		$this->assertSame( 1, $state['attempts'] );
	}

	/**
	 * Test that a failure recorded from an HTTP request still applies to an HTTPS one.
	 */
	public function test_failure_applies_whatever_the_request_scheme() {
		Constants::set_constant( 'WP_SITEURL', 'http://example.org' );
		Constants::set_constant( 'WP_HOME', 'http://example.org' );

		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();

		$_SERVER['HTTPS'] = 'on';
		$this->manager->try_registration();

		$this->assertSame( 1, $this->register_request_count );
	}

	/**
	 * Test that disconnecting forgets a failure recorded before the site got connected some other way.
	 */
	public function test_disconnect_clears_a_stale_failure() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();

		\Jetpack_Options::update_options(
			array(
				'id'         => 12345,
				'blog_token' => 'restored.token',
			)
		);
		$this->manager->reset_connection_status();

		$this->manager->disconnect_site( false );

		$this->assertFalse( get_option( Registration_Failure::OPTION ) );
	}

	/**
	 * Test that a message that is not user-facing copy is not stored.
	 *
	 * @dataProvider responses_without_user_facing_messages
	 *
	 * @param array $response The registration response.
	 */
	#[DataProvider( 'responses_without_user_facing_messages' )]
	public function test_message_that_is_not_user_facing_is_not_stored( $response ) {
		$this->register_response = $response;

		$this->manager->try_registration();

		$this->assertSame( '', $this->recorded_failure()['error_message'] );
	}

	/**
	 * Registration responses whose error message is not user-facing copy.
	 *
	 * @return array[]
	 */
	public static function responses_without_user_facing_messages() {
		return array(
			'WordPress.com 5xx, message is the status' => array(
				array(
					'headers'  => self::headers( array() ),
					'body'     => '',
					'response' => array(
						'code'    => 503,
						'message' => 'Service Unavailable',
					),
				),
			),
			'jetpack_id, message is the raw body'      => array(
				array(
					'headers'  => self::headers( array( 'content-type' => 'application/json' ) ),
					'body'     => '{"jetpack_secret":"sample_secret"}',
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
				),
			),
		);
	}

	/**
	 * Test that the public connection status route withholds the failure from visitors.
	 */
	public function test_connection_status_shows_the_failure_only_to_users_who_can_connect() {
		add_filter( 'map_meta_cap', array( $this->manager, 'jetpack_connection_custom_caps' ), 1, 4 );

		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();

		wp_set_current_user( 0 );
		$this->assertNull( REST_Connector::connection_status()->get_data()['registrationFailure'] );
		$this->assertNull( REST_Connector::connection_status( false )['registrationFailure'], 'The initial state reaches the block editor too.' );

		wp_set_current_user( $this->administrator_id() );
		$visible = REST_Connector::connection_status()->get_data()['registrationFailure'];
		$this->assertSame( 'siteurl_private_ip', $visible['code'] );
		$this->assertTrue( $visible['needsSiteChange'] );
		$this->assertSame( $visible, REST_Connector::connection_status( false )['registrationFailure'] );
	}

	/**
	 * Test that a site connected by other means no longer reports the old failure.
	 */
	public function test_connected_site_reports_no_failure() {
		$this->register_response = self::error_response( 'siteurl_private_ip', 'The site URL is a private IP address.', 400 );
		$this->manager->try_registration();
		$this->assertIsArray( $this->manager->get_registration_failure() );

		\Jetpack_Options::update_options(
			array(
				'id'         => 12345,
				'blog_token' => 'restored.token',
			)
		);
		$this->manager->reset_connection_status();

		$this->assertTrue( $this->manager->is_connected() );
		$this->assertNull( $this->manager->get_registration_failure() );
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
	 * Create an administrator and return their ID.
	 *
	 * @return int
	 */
	private function administrator_id() {
		return wp_insert_user(
			array(
				'user_login' => 'registration_admin',
				'user_pass'  => 'password',
				'user_email' => 'registration_admin@example.org',
				'role'       => 'administrator',
			)
		);
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
