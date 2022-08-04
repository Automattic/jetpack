<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Helper_Script;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-helper-script
 */
class Test_REST_Controller extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );

		// Register REST routes.
		add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Helper_Script\\REST_Controller', 'register_rest_routes' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		unset(
			$_GET['_for'],
			$_GET['token'],
			$_GET['timestamp'],
			$_GET['nonce'],
			$_GET['body-hash'],
			$_GET['signature'],
			$_SERVER['REQUEST_METHOD']
		);
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Testing the `POST /jetpack/v4/helper-script` endpoint when the `helper` param is missing.
	 */
	public function test_install_helper_script_missing_required_param() {
		$request  = new WP_REST_Request( 'POST', '/jetpack/v4/helper-script' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): helper', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/helper-script` endpoint with admin user.
	 */
	public function test_install_helper_script_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$body    = array(
			'helper' => 'dummy',
		);
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/helper-script` endpoint on success.
	 */
	public function test_install_helper_script_success() {
		$body = array(
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			'helper' => base64_encode( "<?php /* Jetpack Helper Script */\n" ),
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 200, $response->get_status() );
		$response_data = $response->get_data();
		$this->assertArrayHasKey( 'url', $response_data );
		$this->assertArrayHasKey( 'abspath', $response_data );
		$this->assertArrayHasKey( 'path', $response_data );

		// Cleanup.
		unlink( $response_data['path'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/helper-script` endpoint when the `path` param is missing.
	 */
	public function test_delete_helper_script_missing_required_param() {
		$request  = new WP_REST_Request( 'DELETE', '/jetpack/v4/helper-script' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): path', $response->get_data()['message'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/helper-script` endpoint with admin user.
	 */
	public function test_delete_helper_script_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$body = array(
			'path' => 'dummy',
		);

		$request = new WP_REST_Request( 'DELETE', '/jetpack/v4/helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/helper-script` endpoint on success.
	 */
	public function test_delete_helper_script_success() {
		$body = array(
			'path' => 'dummy',
		);

		$request = new WP_REST_Request( 'DELETE', '/jetpack/v4/helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 200, $response->get_status() );

		$this->assertTrue( $response->get_data()['success'] );
	}

}
