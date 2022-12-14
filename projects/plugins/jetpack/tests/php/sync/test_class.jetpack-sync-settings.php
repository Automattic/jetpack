<?php

use Automattic\Jetpack\Sync\Dedicated_Sender;
use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Settings extends WP_Test_Jetpack_Sync_Base {

	/**
	 * Whether a dedicated Sync test request was spawned.
	 *
	 * @var bool
	 */
	protected $dedicated_sync_test_request_spawned;

	/**
	 * Setting up the testing environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->dedicated_sync_test_request_spawned = false;
	}

	public function test_can_write_settings() {
		$settings = Settings::get_settings();
		// store original value.
		$dequeue_max_bytes = $settings['dequeue_max_bytes'];
		foreach (
			array(
				'dequeue_max_bytes',
				'sync_wait_time',
				'upload_max_bytes',
				'upload_max_rows',
				'max_queue_size',
				'max_queue_lag',
				'disable',
				'render_filtered_content',
			) as $key
		) {
			$this->assertTrue( isset( $settings[ $key ] ) );
		}

		$settings['dequeue_max_bytes'] = 50;
		Settings::update_settings( $settings );

		$updated_settings = Settings::get_settings();

		// reset original value.
		$settings['dequeue_max_bytes'] = $dequeue_max_bytes;
		Settings::update_settings( $settings );

		$this->assertSame( 50, $updated_settings['dequeue_max_bytes'] );
	}

	public function test_settings_disable_enqueue_and_clears_queue() {
		$event = $this->server_event_storage->reset(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// create a post - this will end up in the queue before data is sent
		$post_id = self::factory()->post->create(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertTrue( $this->listener->get_sync_queue()->size() > 0 );

		Settings::update_settings( array( 'disable' => 1 ) );

		$this->assertFalse( Settings::is_sync_enabled() );

		// generating posts should no longer affect queue size
		$this->assertSame( 0, $this->listener->get_sync_queue()->size() );
		$post_id = self::factory()->post->create(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertSame( 0, $this->listener->get_sync_queue()->size() );

		// syncing sends no data
		$this->sender->do_sync();
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'wp_insert_post' ) );

		Settings::update_settings( array( 'disable' => 0 ) );
		$this->assertTrue( Settings::is_sync_enabled() );
	}

	public function test_settings_disable_network_enqueue_and_clears_queue() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with single site mode' );
		}

		$event = $this->server_event_storage->reset(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// create a post - this will end up in the queue before data is sent
		$post_id = self::factory()->post->create(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertTrue( $this->listener->get_sync_queue()->has_any_items() );

		Settings::update_settings( array( 'network_disable' => 1 ) );

		// generating posts should no longer affect queue size
		$this->assertSame( 0, $this->listener->get_sync_queue()->size() );
		$post_id = self::factory()->post->create(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertSame( 0, $this->listener->get_sync_queue()->size() );

		// syncing sends no data
		$this->sender->do_sync();
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'wp_insert_post' ) );

		Settings::update_settings( array( 'network_disable' => 0 ) );
	}

	public function test_setting_network_option_on_single_site_does_not_work() {
		if ( is_multisite() ) {
			Settings::update_settings( array( 'network_disable' => 1 ) );
			$this->assertSame( 1, Settings::get_setting( 'network_disable' ) );
			$this->assertFalse( Settings::is_sync_enabled() );
			Settings::update_settings( array( 'network_disable' => 0 ) ); // reset things
			$this->assertTrue( Settings::is_sync_enabled() );
		} else {
			Settings::update_settings( array( 'network_disable' => 1 ) );
			// Notice that the value is unchanged
			$this->assertSame( 0, Settings::get_setting( 'network_disable' ) );
			$this->assertTrue( Settings::is_sync_enabled() );
		}
	}

	public function test_enabling_dedicated_sync_setting_with_failed_sync_spawn_test_request() {
		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned_failure' ), 10, 3 );
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned_failure' ) );

		$this->assertTrue( $this->dedicated_sync_test_request_spawned );
		$this->assertFalse( Settings::is_dedicated_sync_enabled() );
	}

	public function test_enabling_dedicated_sync_setting_with_successful_sync_spawn_test_request() {
		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned_success' ), 10, 3 );
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned_success' ) );

		$this->assertTrue( $this->dedicated_sync_test_request_spawned );
		$this->assertTrue( Settings::is_dedicated_sync_enabled() );
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
	public function pre_http_sync_request_spawned_success( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->dedicated_sync_test_request_spawned = strpos( $url, 'spawn-sync' ) > 0;

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
	public function pre_http_sync_request_spawned_failure( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->dedicated_sync_test_request_spawned = strpos( $url, 'spawn-sync' ) > 0;

		return array(
			'response'    => array(
				'code' => 500,
			),
			'status_code' => 500,
			'body'        => '',
		);
	}

}
