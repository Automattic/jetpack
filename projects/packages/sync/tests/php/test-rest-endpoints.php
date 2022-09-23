<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sync\Main as Sync_Main;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-sync
 */
class Test_REST_Endpoints extends TestCase {

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
	 *
	 * @before
	 */
	public function set_up() {
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Sync_Main::configure();

		do_action( 'rest_api_init' );
		new REST_Connector( new Manager() );

		$this->api_host_original                                  = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';

		Constants::$set_constants['JETPACK__API_BASE'] = 'https://jetpack.wordpress.com/jetpack.';

		set_transient( 'jetpack_assumed_site_creation_date', '2020-02-28 01:13:27' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $this->api_host_original;

		delete_transient( 'jetpack_assumed_site_creation_date' );

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
	 * Array of Sync Endpoints and method.
	 *
	 * @return int[][]
	 */
	public function endpoint_provider() {
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
	public function test_no_access_response( $endpoint, $method, $data = null ) {

		$request = new WP_REST_Request( $method, '/jetpack/v4/' . $endpoint );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( $data );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );

	}

}
