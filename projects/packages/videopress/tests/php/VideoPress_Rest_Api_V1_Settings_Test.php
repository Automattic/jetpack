<?php
/**
 * Tests for VideoPress_Rest_Api_V1_Settings.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Tokens;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the VideoPress settings REST API endpoint.
 */
class VideoPress_Rest_Api_V1_Settings_Test extends BaseTestCase {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => 'password',
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );

		// Mock a Jetpack connection with a connected owner so the endpoint's
		// permission and owner checks pass.
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'master_user', $this->user_id );
		( new Tokens() )->update_user_token( $this->user_id, sprintf( '%s.%s.%d', 'key', 'private', $this->user_id ), false );

		VideoPress_Rest_Api_V1_Settings::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		parent::tearDown();

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );
	}

	/**
	 * Dispatches a POST request to the settings endpoint with the given params.
	 *
	 * @param array $params Request body params.
	 * @return \WP_REST_Response The response object.
	 */
	private function update_settings( array $params ) {
		$request = new WP_REST_Request( 'POST', '/videopress/v1/settings' );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return $this->server->dispatch( $request );
	}

	/**
	 * Test that the REST route is registered.
	 */
	public function test_rest_route_is_registered() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/videopress/v1/settings', $routes );
	}

	/**
	 * Test that requests from users without manage_options are rejected.
	 */
	public function test_unauthorized_request_rejected() {
		wp_set_current_user( 0 );

		$response = $this->update_settings( array( 'videopress_auto_subtitles_disabled' => true ) );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test that posting videopress_auto_subtitles_disabled persists the option.
	 */
	public function test_update_persists_auto_subtitles_disabled() {
		delete_option( 'videopress_auto_subtitles_disabled' );

		$response = $this->update_settings( array( 'videopress_auto_subtitles_disabled' => true ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( boolval( get_option( 'videopress_auto_subtitles_disabled' ) ) );
	}

	/**
	 * Test that posting videopress_videos_private_for_site persists the option.
	 */
	public function test_update_persists_private_for_site() {
		delete_option( 'videopress_private_enabled_for_site' );

		$response = $this->update_settings( array( 'videopress_videos_private_for_site' => true ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( boolval( get_option( 'videopress_private_enabled_for_site' ) ) );
	}

	/**
	 * Test that omitted params leave their stored options untouched.
	 */
	public function test_update_leaves_omitted_options_unchanged() {
		update_option( 'videopress_private_enabled_for_site', true );
		update_option( 'videopress_auto_subtitles_disabled', true );

		// Send only the captions/subtitles param; the privacy option must be untouched.
		$response = $this->update_settings( array( 'videopress_auto_subtitles_disabled' => false ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertFalse( boolval( get_option( 'videopress_auto_subtitles_disabled' ) ) );
		$this->assertTrue( boolval( get_option( 'videopress_private_enabled_for_site' ) ) );
	}

	/**
	 * Test that the GET endpoint exposes the auto-generated subtitles setting.
	 */
	public function test_get_settings_returns_auto_subtitles_disabled() {
		update_option( 'videopress_auto_subtitles_disabled', true );

		$request  = new WP_REST_Request( 'GET', '/videopress/v1/settings' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'videopress_auto_subtitles_disabled', $data );
		$this->assertTrue( $data['videopress_auto_subtitles_disabled'] );
	}
}
