<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Sync;

use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Unit tests for the Dedicated_Sender class.
 *
 * @covers Automattic\Jetpack\Sync\Dedicated_Sender
 *
 * @package automattic/jetpack-sync
 */
class Test_Dedicated_Sender extends BaseTestCase {
	/**
	 * Whether a dedicated Sync request was spawned.
	 *
	 * @var bool
	 */
	protected $dedicated_sync_request_spawned;

	/**
	 * Setting up the testing environment.
	 *
	 * @before
	 */
	public function set_up() {
		$this->dedicated_sync_request_spawned = false;

		// Setting the Dedicated Sync check transient here to avoid making a test
		// request every time dedicated Sync setting is updated.
		set_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT, Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING );

		$this->queue = $this->getMockBuilder( 'Automattic\Jetpack\Sync\Queue' )
			->setConstructorArgs( array( 'sync' ) )
			->setMethods( array( 'is_locked', 'size' ) )
			->getMock();
	}
	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		$_SERVER['REQUEST_URI'] = '';
	}

	/**
	 * Tests Dedicated_Sender::is_dedicated_sync_request.
	 */
	public function test_is_dedicated_sync_request() {
		$_SERVER['REQUEST_URI'] = rest_url( 'jetpack/v4/sync/spawn-sync' );

		$result = Dedicated_Sender::is_dedicated_sync_request();

		$this->assertTrue( $result );
	}

	/**
	 * Tests Dedicated_Sender::is_dedicated_sync_request with a random request.
	 */
	public function test_is_dedicated_sync_request_with_random_request() {
		$_SERVER['REQUEST_URI'] = '/';

		$result = Dedicated_Sender::is_dedicated_sync_request();

		$this->assertFalse( $result );
	}

	/**
	 * Tests Dedicated_Sender::spawn_sync with dedicated_sync_enabled set to 0.
	 */
	public function test_spawn_sync_with_dedicated_sync_disabled() {
		$this->queue->method( 'size' )->will( $this->returnValue( 0 ) );

		$result = Dedicated_Sender::spawn_sync( $this->queue );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'dedicated_sync_disabled', $result->get_error_code() );
	}

	/**
	 * Tests Dedicated_Sender::spawn_sync with an empty queue.
	 */
	public function test_spawn_sync_with_empty_queue() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		$this->queue->method( 'size' )->will( $this->returnValue( 0 ) );

		$result = Dedicated_Sender::spawn_sync( $this->queue );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'empty_queue_sync', $result->get_error_code() );
	}

	/**
	 * Tests Dedicated_Sender::spawn_sync with a locked queue.
	 */
	public function test_spawn_sync_with_locked_queue() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		$this->queue->method( 'is_locked' )->will( $this->returnValue( true ) );

		$result = Dedicated_Sender::spawn_sync( $this->queue );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'locked_queue_sync', $result->get_error_code() );
	}

	/**
	 * Tests Dedicated_Sender::spawn_sync with Retry-After set.
	 */
	public function test_spawn_sync_with_retry_after_set() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		// Simulate WPCOM sending us a response with `Retry-After` header set to 10 minutes.
		update_option( Actions::RETRY_AFTER_PREFIX . $this->queue->id, microtime( true ) + 10 * 60 );

		$result = Dedicated_Sender::spawn_sync( $this->queue );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'retry_after_sync', $result->get_error_code() );
	}

	/**
	 * Tests Dedicated_Sender::spawn_sync with Retry-After expired.
	 */
	public function test_spawn_sync_with_retry_after_expired() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		// Simulate WPCOM sending us a response with `Retry-After` header that has now expired.
		update_option( Actions::RETRY_AFTER_PREFIX . $this->queue->id, microtime( true ) - 10 * 60 );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ), 10, 3 );
		$result = Dedicated_Sender::spawn_sync( $this->queue );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->assertTrue( $result );
		$this->assertTrue( $this->dedicated_sync_request_spawned );
	}

	/**
	 * Tests Dedicated_Sender::spawn_sync with Sync throttled.
	 */
	public function test_spawn_sync_with_throttled() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		// Sync Throttled.
		update_option( Sender::NEXT_SYNC_TIME_OPTION_NAME . '_' . $this->queue->id, microtime( true ) + 10 * 60 );

		$result = Dedicated_Sender::spawn_sync( $this->queue );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'sync_throttled_sync', $result->get_error_code() );
	}

	/**
	 * Tests Dedicated_Sender::spawn_sync will spawn dedicated Sync request.
	 */
	public function test_spawn_sync_will_spawn_dedicated_sync_request() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		$this->queue->method( 'size' )->will( $this->returnValue( 1 ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ), 10, 3 );
		$result = Dedicated_Sender::spawn_sync( $this->queue );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->assertTrue( $result );
		$this->assertTrue( $this->dedicated_sync_request_spawned );
	}

	/**
	 * Tests Dedicated_Sender::can_spawn_dedicated_sync_request will return true if request succeeds.
	 */
	public function test_can_spawn_dedicated_sync_request_will_return_true_if_request_succeeds() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		delete_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ), 10, 3 );
		$can_spawn = Dedicated_Sender::can_spawn_dedicated_sync_request();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->assertSame( Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING, get_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT ) );
		$this->assertTrue( $this->dedicated_sync_request_spawned );
		$this->assertTrue( $can_spawn );
	}

	/**
	 * Tests Dedicated_Sender::can_spawn_dedicated_sync_request will return false if request fails.
	 */
	public function test_can_spawn_dedicated_sync_request_will_return_false_if_request_fails() {
		delete_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_failure' ), 10, 3 );
		$can_spawn = Dedicated_Sender::can_spawn_dedicated_sync_request();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_failure' ) );

		$transient = get_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT );
		$delta     = abs( time() - $transient );
		$this->assertTrue( $delta < 10 );
		$this->assertFalse( $can_spawn );
	}

	/**
	 * Tests Dedicated_Sender::can_spawn_dedicated_sync_request caching.
	 */
	public function test_can_spawn_dedicated_sync_request_with_cached_OK_response_body() {
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ), 10, 3 );
		$can_spawn = Dedicated_Sender::can_spawn_dedicated_sync_request();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		// Actual request should not be spawned if we already have a cached response code.
		$this->assertFalse( $this->dedicated_sync_request_spawned );
		$this->assertSame( Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING, get_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT ) );
		$this->assertTrue( $can_spawn );
	}

	/**
	 * Tests Dedicated_Sender::can_spawn_dedicated_sync_request caching.
	 */
	public function test_can_spawn_dedicated_sync_request_with_cached_empty_response_body() {
		set_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT, '' );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ), 10, 3 );
		$can_spawn = Dedicated_Sender::can_spawn_dedicated_sync_request();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		// Actual request should not be spawned if we already have a cached response code.
		$this->assertFalse( $this->dedicated_sync_request_spawned );
		$this->assertSame( '', get_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT ) );
		$this->assertFalse( $can_spawn );
	}

	/**
	 * Intercept HTTP request to run Sync and mock the response.
	 * Should be hooked on the `pre_http_request` filter.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public function pre_http_request_success( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->dedicated_sync_request_spawned = strpos( $url, 'spawn-sync' ) > 0;

		return array(
			'response'    => array(
				'code' => 200,
			),
			'status_code' => 200,
			'body'        => Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING,
		);
	}

	/**
	 * Intercept HTTP request to run Sync and mock the response.
	 * Should be hooked on the `pre_http_request` filter.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public function pre_http_request_failure( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->dedicated_sync_request_spawned = strpos( $url, 'spawn-sync' ) > 0;

		return array(
			'response'    => array(
				'code' => 500,
			),
			'status_code' => 500,
			'body'        => '',
		);
	}
}
