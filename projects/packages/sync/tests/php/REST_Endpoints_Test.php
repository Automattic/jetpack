<?php

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sync\Main as Sync_Main;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-sync
 */
class REST_Endpoints_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The original hostname to restore after tests are finished.
	 *
	 * @var string
	 */
	private $api_host_original;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->reset_activity_log_event_initialized();
		Sync_Main::configure();
		Activity_Log_Event::register_post_type();
		$this->add_activity_log_event_filters();

		do_action( 'rest_api_init' );
		new REST_Connector( new Manager() );

		$this->api_host_original                                  = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';

		Constants::$set_constants['JETPACK__API_BASE'] = 'https://jetpack.wordpress.com/jetpack.';

		set_transient( 'jetpack_assumed_site_creation_date', '2020-02-28 01:13:27' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $this->api_host_original;

		delete_transient( 'jetpack_assumed_site_creation_date' );

		$this->remove_activity_log_event_filters();
		$this->reset_activity_log_event_initialized();

		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Testing the `/jetpack/v4/sync/settings` GET endpoint.
	 */
	public function test_sync_settings() {

		$settings = Settings::get_settings();

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/sync/settings' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $settings, $data );
	}

	/**
	 * Testing the `/jetpack/v4/sync/settings` POST endpoint.
	 */
	public function test_update_sync_settings() {

		// Update Settings to off state.
		$settings                        = Settings::get_settings();
		$settings['sync_sender_enabled'] = 0;
		Settings::update_settings( $settings );
		$settings['sync_sender_enabled'] = 1;

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/settings' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "sync_sender_enabled": 1 }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $settings, $data );
	}

	/**
	 * Testing the `/jetpack/v4/sync/status` endpoint.
	 */
	public function test_sync_status() {

		$sync_status = Actions::get_sync_status( 'debug_details' );

		// Unset next_sync times as they will vary.
		unset( $sync_status['queue_next_sync'] );
		unset( $sync_status['full_queue_next_sync'] );

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/sync/status' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "fields": "debug_details" }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$user->remove_cap( 'manage_options' );

		// Unset next_sync times as they will vary.
		unset( $data['queue_next_sync'] );
		unset( $data['full_queue_next_sync'] );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $sync_status, $data );
		$this->assertArrayHasKey( 'debug_details', $data );
	}

	/**
	 * Testing the `/jetpack/v4/sync/health`  endpoint.
	 */
	public function test_sync_health() {

		Health::update_status( Health::STATUS_UNKNOWN );

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/health' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "status": "' . Health::STATUS_IN_SYNC . '" }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( Health::STATUS_IN_SYNC, $data['success'] );
	}

	/**
	 * Testing the `/jetpack/v4/sync/health` endpoint when the queue is unhealthy.
	 * Setting IN_SYNC should be blocked and the status should be set to OUT_OF_SYNC
	 * only when both size AND lag are over their limits.
	 */
	public function test_sync_health_blocked_when_queue_unhealthy() {

		Health::update_status( Health::STATUS_IN_SYNC );
		Settings::update_settings(
			array(
				'max_queue_size' => 0,
				'max_queue_lag'  => 0,
			)
		);

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/health' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "status": "' . Health::STATUS_IN_SYNC . '" }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( Health::STATUS_OUT_OF_SYNC, $data['success'] );
		$this->assertEquals( Health::STATUS_OUT_OF_SYNC, Health::get_status() );
		$this->assertArrayHasKey( 'message', $data );
	}

	/**
	 * Testing the `/jetpack/v4/sync/health` endpoint when only queue size is over the limit.
	 * Setting IN_SYNC should be allowed because lag is still within limits (queue is still draining).
	 */
	public function test_sync_health_allowed_when_only_queue_size_over_limit() {

		Health::update_status( Health::STATUS_OUT_OF_SYNC );
		Settings::update_settings( array( 'max_queue_size' => 0 ) );

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/health' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "status": "' . Health::STATUS_IN_SYNC . '" }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( Health::STATUS_IN_SYNC, $data['success'] );
		$this->assertEquals( Health::STATUS_IN_SYNC, Health::get_status() );
	}

	/**
	 * Testing the `/jetpack/v4/sync/health` endpoint when only queue lag is over the limit.
	 * Setting IN_SYNC should be allowed because size is still within limits.
	 */
	public function test_sync_health_allowed_when_only_queue_lag_over_limit() {

		Health::update_status( Health::STATUS_OUT_OF_SYNC );
		Settings::update_settings( array( 'max_queue_lag' => 0 ) );

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/health' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "status": "' . Health::STATUS_IN_SYNC . '" }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( Health::STATUS_IN_SYNC, $data['success'] );
		$this->assertEquals( Health::STATUS_IN_SYNC, Health::get_status() );
	}

	/**
	 * Testing the `/jetpack/v4/sync/now` endpoint.
	 */
	public function test_sync_now() {

		// TODO add items to queue to verify response.

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/now' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "queue": "sync" }' );

		$response = $this->server->dispatch( $request );
		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Testing the `/jetpack/v4/sync/checkout` endpoint.
	 */
	public function test_sync_checkout() {

		// TODO add items to queue to verify response.

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/now' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "queue": "sync", "number_of_items": 50 }' );

		$response = $this->server->dispatch( $request );
		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Testing the `/jetpack/v4/sync/checkout` endpoint with use_memory_limit skips number_of_items validation.
	 */
	public function test_sync_checkout_with_memory_limit_skips_number_of_items_validation() {

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/checkout' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "queue": "sync", "use_memory_limit": true }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$user->remove_cap( 'manage_options' );

		// Should not get invalid_number_of_items error. queue_size is expected since the queue is empty.
		$this->assertNotEquals( 'invalid_number_of_items', $data['code'] ?? null );
		$this->assertEquals( 'queue_size', $data['code'] ?? null );
	}

	/**
	 * Testing the `/jetpack/v4/sync/checkout` endpoint returns error for invalid number_of_items.
	 */
	public function test_sync_checkout_invalid_number_of_items() {

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/checkout' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "queue": "sync", "number_of_items": 0 }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 'invalid_number_of_items', $data['code'] );
	}

	/**
	 * Testing the `/jetpack/v4/sync/checkout` endpoint with use_memory_limit ignores invalid number_of_items.
	 */
	public function test_sync_checkout_with_memory_limit_ignores_invalid_number_of_items() {

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/checkout' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "queue": "sync", "use_memory_limit": true, "number_of_items": 0 }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$user->remove_cap( 'manage_options' );

		// With use_memory_limit, the invalid number_of_items should be ignored.
		// We expect queue_size (empty queue), not invalid_number_of_items.
		$this->assertEquals( 'queue_size', $data['code'] ?? null );
	}

	/**
	 * Testing the `/jetpack/v4/sync/checkout` endpoint rejects pop with use_memory_limit.
	 */
	public function test_sync_checkout_pop_with_memory_limit_rejected() {

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/checkout' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "queue": "sync", "pop": true, "use_memory_limit": true }' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 'invalid_args', $data['code'] );
	}

	/**
	 * Testing the `/jetpack/v4/sync/unlock` endpoint.
	 */
	public function test_sync_unlock() {

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/unlock' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( '{ "queue": "sync" }' );

		$response = $this->server->dispatch( $request );
		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertFalse( get_option( 'jpsq_sync_checkout' ) );
	}

	/**
	 * Testing the `/jetpack/v4/sync/spawn-sync` GET endpoint with Dedicated Sync disabled.
	 */
	public function test_sync_spawn_sync_dedicated_sync_disabled() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/sync/spawn-sync' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 422, $response->get_status() );
		$this->assertEquals( 'dedicated_sync_disabled', $data['code'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/sync/locks` endpoint.
	 */
	public function test_sync_reset_locks() {

		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		$request = new WP_REST_Request( 'DELETE', '/jetpack/v4/sync/locks' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Testing the `POST /jetpack/v4/sync/clear-queue` endpoint clears the sync queue.
	 */
	public function test_sync_clear_queue() {
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		set_transient( Sender::TEMP_SYNC_DISABLE_TRANSIENT_NAME, time() );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/sync/clear-queue' );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'manage_options' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $data['success'] );
		$this->assertFalse( get_transient( Sender::TEMP_SYNC_DISABLE_TRANSIENT_NAME ) );
	}

	/**
	 * Testing the core REST CPT endpoint creates and normalizes a custom Activity Log event.
	 */
	public function test_core_rest_activity_log_event_endpoint_creates_event() {
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		try {
			$request = new WP_REST_Request( 'POST', '/wp/v2/activity-log-events' );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body(
				wp_json_encode(
					array(
						'title'    => ' <strong>Cache flushed</strong> ',
						'content'  => "Plain <em>text</em>\nnote.",
						'source'   => ' <code>mc</code> ',
						'severity' => ' WARNING ',
					),
					JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
				)
			);

			$response = $this->server->dispatch( $request );
			$data     = $response->get_data();

			$this->assertEquals( 201, $response->get_status() );
			$this->assertIsInt( $data['id'] );

			$post = get_post( $data['id'] );

			$this->assertInstanceOf( \WP_Post::class, $post );
			$this->assertSame( Activity_Log_Event::POST_TYPE, $post->post_type );
			$this->assertSame( 'publish', $post->post_status );
			$this->assertSame( 'Cache flushed', $post->post_title );

			$payload = $this->get_activity_log_payload( $post );

			$this->assertSame( 'Cache flushed', $payload['title'] );
			$this->assertSame( 'Plain text note.', $payload['content'] );
			$this->assertSame( 'mc', $payload['source'] );
			$this->assertSame( 'warning', $payload['severity'] );
		} finally {
			$user->remove_cap( 'manage_options' );
		}
	}

	/**
	 * Testing the core REST CPT endpoint rejects invalid custom Activity Log event payloads.
	 */
	public function test_core_rest_activity_log_event_endpoint_rejects_invalid_payload() {
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		try {
			$request = new WP_REST_Request( 'POST', '/wp/v2/activity-log-events' );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body(
				wp_json_encode(
					array(
						'title'    => 'Cache flushed',
						'content'  => 'Plain text note.',
						'severity' => 'critical',
					),
					JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
				)
			);

			$response = $this->server->dispatch( $request );

			$this->assertEquals( 400, $response->get_status() );
		} finally {
			$user->remove_cap( 'manage_options' );
		}
	}

	/**
	 * Testing the core REST CPT endpoint requires manage_options.
	 */
	public function test_core_rest_activity_log_event_endpoint_requires_manage_options() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/activity-log-events' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'title'   => 'Cache flushed',
					'content' => 'Plain text note.',
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Testing the core REST CPT endpoint does not expose Activity Log events publicly.
	 */
	public function test_core_rest_activity_log_event_endpoint_rejects_public_reads() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/activity-log-events' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Testing the core REST CPT endpoint rejects updates.
	 */
	public function test_core_rest_activity_log_event_endpoint_rejects_updates() {
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		try {
			$post_id = Activity_Log_Event::create(
				array(
					'title'   => 'Cache flushed',
					'content' => 'Plain text note.',
				)
			);

			$this->assertIsInt( $post_id );

			$request = new WP_REST_Request( 'POST', '/wp/v2/activity-log-events/' . $post_id );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body(
				wp_json_encode(
					array(
						'title'   => 'Updated title',
						'content' => 'Updated content.',
					),
					JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
				)
			);

			$response = $this->server->dispatch( $request );

			$this->assertContains( $response->get_status(), array( 401, 403 ) );

			$post = get_post( $post_id );
			$this->assertInstanceOf( \WP_Post::class, $post );
			$this->assertSame( 'Cache flushed', $post->post_title );

			$payload = $this->get_activity_log_payload( $post );
			$this->assertSame( 'Plain text note.', $payload['content'] );
		} finally {
			$user->remove_cap( 'manage_options' );
		}
	}

	/**
	 * Testing the core REST CPT endpoint rejects deletes.
	 */
	public function test_core_rest_activity_log_event_endpoint_rejects_deletes() {
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );

		try {
			$post_id = Activity_Log_Event::create(
				array(
					'title'   => 'Cache flushed',
					'content' => 'Plain text note.',
				)
			);

			$this->assertIsInt( $post_id );

			$request  = new WP_REST_Request( 'DELETE', '/wp/v2/activity-log-events/' . $post_id );
			$response = $this->server->dispatch( $request );

			$this->assertContains( $response->get_status(), array( 401, 403 ) );
			$this->assertInstanceOf( \WP_Post::class, get_post( $post_id ) );
		} finally {
			$user->remove_cap( 'manage_options' );
		}
	}

	/**
	 * Gets the stored activity log payload for a post.
	 *
	 * @param \WP_Post $post Activity Log event post.
	 * @return array
	 */
	private function get_activity_log_payload( \WP_Post $post ) {
		$payload = json_decode( $post->post_content, true );
		if ( ! is_array( $payload ) ) {
			$payload = json_decode( wp_unslash( $post->post_content ), true );
		}

		$this->assertIsArray( $payload );

		return $payload;
	}

	/**
	 * Adds Activity Log event filters for REST tests.
	 */
	private function add_activity_log_event_filters() {
		add_filter( 'rest_request_before_callbacks', array( Activity_Log_Event::class, 'authorize_rest_request' ), 10, 3 );
		add_filter( 'rest_pre_insert_' . Activity_Log_Event::POST_TYPE, array( Activity_Log_Event::class, 'normalize_rest_post' ), 10, 2 );
		add_filter( 'wp_insert_post_empty_content', array( Activity_Log_Event::class, 'prevent_invalid_post_insert' ), 10, 2 );
		add_filter( 'wp_insert_post_data', array( Activity_Log_Event::class, 'normalize_post_data' ), 10, 2 );
	}

	/**
	 * Removes Activity Log event filters for REST tests.
	 */
	private function remove_activity_log_event_filters() {
		remove_filter( 'rest_request_before_callbacks', array( Activity_Log_Event::class, 'authorize_rest_request' ), 10 );
		remove_filter( 'rest_pre_insert_' . Activity_Log_Event::POST_TYPE, array( Activity_Log_Event::class, 'normalize_rest_post' ), 10 );
		remove_filter( 'wp_insert_post_empty_content', array( Activity_Log_Event::class, 'prevent_invalid_post_insert' ), 10 );
		remove_filter( 'wp_insert_post_data', array( Activity_Log_Event::class, 'normalize_post_data' ), 10 );
	}

	/**
	 * Resets Activity Log event initialization state for tests.
	 */
	private function reset_activity_log_event_initialized() {
		$reflection = new \ReflectionProperty( Activity_Log_Event::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, false );
	}

	/**
	 * Array of Sync Endpoints and method.
	 *
	 * @return int[][]
	 */
	public static function endpoint_provider() {
		return array(
			array( 'sync/full-sync', 'POST', null ),
			array( 'sync/settings', 'POST', null ),
			array( 'sync/settings', 'GET', null ),
			array( 'sync/status', 'GET', null ),
			array( 'sync/health', 'POST', '{ "status": "' . Health::STATUS_IN_SYNC . '" }' ),
			array( 'sync/object', 'GET', null ),
			array( 'sync/now', 'POST', '{ "queue": "sync" }' ),
			array( 'sync/checkout', 'POST', null ),
			array( 'sync/close', 'POST', null ),
			array( 'sync/unlock', 'POST', '{ "queue": "sync" }' ),
			array( 'sync/object-id-range', 'GET', '{ "sync_module": "posts", "batch_size": "10" }' ),
			array( 'sync/data-check', 'GET', null ),
			array( 'sync/data-histogram', 'POST', null ),
			array( 'sync/locks', 'DELETE', null ),
			array( 'sync/clear-queue', 'POST', null ),
		);
	}

	/**
	 * Verify that Sync Endpoints require user permissions.
	 *
	 * @dataProvider endpoint_provider
	 *
	 * @param string $endpoint Sync endpoint under test.
	 * @param string $method   Request Method (get, post, etc).
	 * @param string $data      Data to be set to body.
	 */
	#[DataProvider( 'endpoint_provider' )]
	public function test_no_access_response( $endpoint, $method, $data = null ) {

		$request = new WP_REST_Request( $method, '/jetpack/v4/' . $endpoint );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( $data );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}
}
