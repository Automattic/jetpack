<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\IdentityCrisis;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Identity_Crisis;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-identity-crisis
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

		Identity_Crisis::init();

		do_action( 'rest_api_init' );
		new REST_Connector( new Manager() );

		$this->api_host_original = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

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
	 * Testing the `/jetpack/v4/identity-crisis/confirm-safe-mode` endpoint.
	 */
	public function test_confirm_safe_mode() {

		Jetpack_Options::update_option( 'safe_mode_confirmed', false );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/confirm-safe-mode' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'jetpack_disconnect' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
		$this->assertTrue( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/confirm-safe-mode` endpoint returns an error when user does not have permissions.
	 */
	public function test_confirm_safe_mode_no_access() {

		Jetpack_Options::update_option( 'safe_mode_confirmed', false );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/confirm-safe-mode' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertFalse( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/migrate` endpoint.
	 */
	public function test_migrate_stats_and_subscribers() {

		Jetpack_Options::update_option( 'sync_error_idc', true );
		Jetpack_Options::update_option( 'migrate_for_idc', false );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/migrate' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'jetpack_disconnect' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
		$this->assertTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/migrate` endpoint returns an error when user does not have permissions.
	 */
	public function test_migrate_stats_and_subscribers_no_access() {

		Jetpack_Options::update_option( 'sync_error_idc', true );
		Jetpack_Options::update_option( 'migrate_for_idc', false );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/migrate' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertFalse( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
		$this->assertTrue( Jetpack_Options::get_option( 'sync_error_idc' ) );
		$this->assertFalse( Jetpack_Options::get_option( 'migrate_for_idc' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/start-fresh` endpoint returns an error when user does not have permissions.
	 */
	public function test_start_fresh_no_access() {

		$user = wp_get_current_user();
		$user->remove_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/start-fresh' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

}
