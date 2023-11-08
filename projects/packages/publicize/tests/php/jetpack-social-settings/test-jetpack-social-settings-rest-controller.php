<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the REST Settings endpoint.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Testing the REST Settings endpoint.
 */
class Jetpack_Social_Settings_REST_Controller_Test extends BaseTestCase {
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

		add_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		global $publicize;
		$publicize = $this->getMockBuilder( Publicize::class )->setMethods( array( 'has_social_auto_conversion_feature', 'has_social_image_generator_feature' ) )->getMock();
		$publicize->method( 'has_social_auto_conversion_feature' )
			->withAnyParameters()
			->willReturn( true );
		$publicize->method( 'has_social_image_generator_feature' )
			->withAnyParameters()
			->willReturn( true );
		$publicize->register_post_meta();

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
		add_action( 'rest_api_init', array( new Jetpack_Social_Settings\REST_Settings_Controller(), 'register_routes' ) );

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
	 * Testing the `GET /jetpack/v4/jetpack-social/settings` endpoint without proper permissions.
	 */
	public function test_get_settings_without_proper_permission() {
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/jetpack-social/settings' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'rest_forbidden_context', $response->get_data()['code'] );
	}

	/**
	 * Testing the `GET /jetpack/v4/jetpack-social/settings` endpoint with proper permissions.
	 */
	public function test_get_settings_with_proper_permission() {
		wp_set_current_user( $this->admin_id );
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/jetpack-social/settings' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$this->assertArrayHasKey( 'autoConversionSettings', $response->data );
		$this->assertArrayHasKey( 'socialImageGeneratorSettings', $response->data );
		$this->assertArrayHasKey( 'defaults', $response->data['socialImageGeneratorSettings'] );

		$this->assertTrue( $response->data['autoConversionSettings']['image'] );
		$this->assertFalse( $response->data['socialImageGeneratorSettings']['enabled'] );
	}

	/**
	 * Private function just to test the endpoint response against values.
	 *
	 * @param WP_REST_Response $response        The response object.
	 * @param bool|null        $image           The expected value for the image setting.
	 * @param bool|null        $video           The expected value for the video setting.
	 * @param bool|null        $sig_enabled     The expected value for the SIG enabled setting.
	 * @param string|null      $sig_template    The expected value for the SIG template setting.
	 */
	private function test_response( $response, $image, $video, $sig_enabled, $sig_template ) {
		$this->assertEquals( 200, $response->get_status() );

		$response_data = $response->data;
		if ( $image !== null ) {
			$this->assertEquals( $image, $response_data['autoConversionSettings']['image'] );
		}
		if ( $video !== null ) {
			$this->assertEquals( $video, $response_data['autoConversionSettings']['video'] );
		}
		if ( $sig_enabled !== null ) {
			$this->assertEquals( $sig_enabled, $response_data['socialImageGeneratorSettings']['enabled'] );
		}
		if ( $sig_template !== null ) {
			$this->assertEquals( $sig_template, $response_data['socialImageGeneratorSettings']['defaults']['template'] );
		}
	}

	/**
	 * Testing the `GET /jetpack/v4/jetpack-social/settings` endpoint with proper permissions.
	 */
	public function test_update_settings() {
		wp_set_current_user( $this->admin_id );
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/jetpack-social/settings' );
		$request->set_body_params(
			array(
				'autoConversionSettings' => array(
					'image' => false,
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$this->test_response( $response, false, null, false, TEMPLATES::DEFAULT_TEMPLATE );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/jetpack-social/settings' );
		$request->set_body_params(
			array(
				'autoConversionSettings' => array(
					'image' => true,
					'video' => true,
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$this->test_response( $response, true, true, false, TEMPLATES::DEFAULT_TEMPLATE );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/jetpack-social/settings' );
		$request->set_body_params(
			array(
				'socialImageGeneratorSettings' => array(
					'enabled' => true,
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$this->test_response( $response, true, true, true, TEMPLATES::DEFAULT_TEMPLATE );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/jetpack-social/settings' );
		$request->set_body_params(
			array(
				'socialImageGeneratorSettings' => array(
					'defaults' => array(
						'template' => 'fullscreen',
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$this->test_response( $response, true, true, true, 'fullscreen' );
	}
}
