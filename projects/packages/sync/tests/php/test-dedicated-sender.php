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
		unset( $_SERVER['REQUEST_METHOD'] );
		unset( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
	}

	/**
	 * Tests Dedicated_Sender::is_dedicated_sync_request.
	 */
	public function test_is_dedicated_sync_request() {
		$_SERVER['REQUEST_METHOD']               = 'POST';
		$_POST['jetpack_dedicated_sync_request'] = 1;

		$result = Dedicated_Sender::is_dedicated_sync_request();

		$this->assertTrue( $result );
	}

	/**
	 * Tests Dedicated_Sender::is_dedicated_sync_request with a random request.
	 */
	public function test_is_dedicated_sync_request_with_random_request() {
		$_SERVER['REQUEST_METHOD'] = 'GET';

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
		$this->dedicated_sync_request_spawned = 'POST' === $args['method'] &&
			isset( $args['body']['jetpack_dedicated_sync_request'] );

		return array(
			'success' => true,
		);
	}
}
