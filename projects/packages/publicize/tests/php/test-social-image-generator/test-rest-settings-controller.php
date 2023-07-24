<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the REST Settings endpoint.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Testing the REST Settings endpoint.
 */
class REST_Settings_Controller_Test extends BaseTestCase {
	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( 'social-image-generator' );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
		add_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_password',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( 0 );

		// Register REST routes.
		add_action( 'rest_api_init', array( new Social_Image_Generator\REST_Settings_Controller(), 'register_routes' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		remove_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
	}

	/**
	 * Mock Publicize being active.
	 *
	 * @return array
	 */
	public function mock_publicize_being_active() {
		return array( 'publicize' );
	}

	/**
	 * Testing the `GET /jetpack/v4/social-image-generator/settings` endpoint without proper permissions.
	 */
	public function test_get_settings_without_proper_permission() {
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/social-image-generator/settings' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'rest_forbidden_context', $response->get_data()['code'] );
	}

	/**
	 * Testing the `GET /jetpack/v4/social-image-generator/settings` endpoint with proper permissions.
	 */
	public function test_get_settings_with_proper_permission() {
		wp_set_current_user( $this->admin_id );
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/social-image-generator/settings' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'enabled', $response->data );
		$this->assertArrayHasKey( 'defaults', $response->data );
	}

	/**
	 * Testing the `POST /jetpack/v4/social-image-generator/settings` endpoint to update a setting.
	 */
	public function test_update_settings() {
		wp_set_current_user( $this->admin_id );
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/social-image-generator/settings' );
		$request->set_body_params(
			array(
				'enabled'  => true,
				'defaults' => array(
					'template' => 'edge',
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->data['enabled'] );
		$this->assertEquals( 'edge', $response->data['defaults']['template'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/social-image-generator/settings` endpoint with an non-boolean for enabled.
	 */
	public function test_update_settings_with_non_boolean() {
		wp_set_current_user( $this->admin_id );
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/social-image-generator/settings' );
		$request->set_body_params( array( 'enabled' => 'string' ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
		$this->assertEquals( 'rest_invalid_type', $response->get_data()['data']['details']['enabled']['code'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/social-image-generator/settings` endpoint with an invalid template.
	 */
	public function test_update_settings_with_invalid_template() {
		wp_set_current_user( $this->admin_id );
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/social-image-generator/settings' );
		$request->set_body_params(
			array(
				'enabled'  => true,
				'defaults' => array(
					'template' => 'invalid_template',
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
		$this->assertEquals( 'rest_not_in_enum', $response->get_data()['data']['details']['defaults']['code'] );
	}
}
