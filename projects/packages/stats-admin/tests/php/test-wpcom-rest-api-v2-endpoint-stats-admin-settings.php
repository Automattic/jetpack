<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats\Options;
use Automattic\Jetpack\Stats_Admin\Test_Case as Stats_Test_Case;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Test_WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings extends Stats_Test_Case {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * An instance of WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings
	 *
	 * @var WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings
	 */
	protected $rest_controller;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		wp_set_current_user( 0 );

		$this->rest_controller = new WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings();

		// Register REST routes.
		add_action( 'rest_api_init', array( $this->rest_controller, 'register_rest_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		remove_action( 'rest_api_init', array( $this->rest_controller, 'register_rest_routes' ) );
		parent::tear_down();
	}

	/**
	 * Test update modules not allowed.
	 */
	public function test_update_stats_modules_not_allowed() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/stats-admin/modules' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test update modules success.
	 */
	public function test_update_stats_modules_success() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/stats-admin/modules' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( '{"traffic":{"videos":true, "some-unknow-module":true}}' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( array( 'updated' => true ), $response->get_data() );
		$this->assertArrayNotHasKey( 'some-unknow-module', Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['traffic'] );
		$this->assertTrue( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['traffic']['videos'] );
	}

	/**
	 * Test update multiple modules success.
	 */
	public function test_update_multiple_stats_modules_success() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/stats-admin/modules' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( '{"traffic":{"videos":true, "highlights":false}, "wordads":{"chart":false}}' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( array( 'updated' => true ), $response->get_data() );
		$this->assertTrue( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['traffic']['videos'] );
		$this->assertFalse( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['traffic']['highlights'] );
		$this->assertFalse( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['wordads']['chart'] );
	}

	/**
	 * Test update multiple modules success.
	 */
	public function test_update_multiple_stats_modules_only_affect_keys_set() {
		wp_set_current_user( $this->admin_id );
		Options::set_option(
			WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES,
			array( 'traffic' => array( 'posts-pages' => true ) )
		);

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/stats-admin/modules' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( '{"traffic":{"videos":true, "highlights":false}, "wordads":{"chart":false}}' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( array( 'updated' => true ), $response->get_data() );
		$this->assertTrue( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['traffic']['videos'] );
		$this->assertFalse( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['traffic']['highlights'] );
		$this->assertFalse( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['wordads']['chart'] );
		$this->assertTrue( Options::get_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES )['traffic']['posts-pages'] );
	}

	/**
	 * Test get modules not allowed.
	 */
	public function test_get_stats_modules_not_allowed() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/stats-admin/modules' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test get modules success.
	 */
	public function test_get_stats_modules_success() {
		wp_set_current_user( $this->admin_id );
		$expected = array( 'traffic' => array( 'videos' => true ) );
		Options::set_option( WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings::DASHBOARD_MODULES, $expected );

		$request  = new WP_REST_Request( 'GET', '/wpcom/v2/stats-admin/modules' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( $expected, $response->get_data() );
	}

}
