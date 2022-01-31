<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Backup;

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-backup
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
		add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Backup\\REST_Controller', 'register_rest_routes' ) );

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
	 * Testing the `POST /jetpack/v4/backup-helper-script` endpoint when the `helper` param is missing.
	 */
	public function test_install_backup_helper_script_missing_required_param() {
		$request  = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): helper', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/backup-helper-script` endpoint with admin user.
	 */
	public function test_install_backup_helper_script_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$body    = array(
			'helper' => 'dummy',
		);
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/backup-helper-script` endpoint on success.
	 */
	public function test_install_backup_helper_script_success() {
		$body = array(
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			'helper' => base64_encode( "<?php /* Jetpack Backup Helper Script */\n" ),
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
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
	 * Testing the `DELETE /jetpack/v4/backup-helper-script` endpoint when the `path` param is missing.
	 */
	public function test_delete_backup_helper_script_missing_required_param() {
		$request  = new WP_REST_Request( 'DELETE', '/jetpack/v4/backup-helper-script' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): path', $response->get_data()['message'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/backup-helper-script` endpoint with admin user.
	 */
	public function test_delete_backup_helper_script_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$body = array(
			'path' => 'dummy',
		);

		$request = new WP_REST_Request( 'DELETE', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/backup-helper-script` endpoint on success.
	 */
	public function test_delete_backup_helper_script_success() {
		$body = array(
			'path' => 'dummy',
		);

		$request = new WP_REST_Request( 'DELETE', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 200, $response->get_status() );

		$this->assertTrue( $response->get_data()['success'] );
	}

	/**
	 * Testing the `/jetpack/v4/database-object/backup` endpoint with invalid params.
	 */
	public function test_backup_database_object_invalid_params() {
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/database-object/backup' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): object_type, object_id', $response->get_data()['message'] );

		$request->set_query_params(
			array(
				'object_id'   => 123,
				'object_type' => 'dummy',
			)
		);
		$response      = $this->server->dispatch( $request );
		$response_data = $response->get_data();
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Invalid parameter(s): object_type', $response_data['message'] );
		$this->assertEquals( 'The object_type argument should be one of woocommerce_attribute, woocommerce_downloadable_product_permission, woocommerce_order_item, woocommerce_payment_token, woocommerce_tax_rate, woocommerce_webhook', $response_data['data']['params']['object_type'] );

		$request->set_query_params(
			array(
				'object_id'   => 'should_be_integer',
				'object_type' => 'woocommerce_attribute',
			)
		);
		$response      = $this->server->dispatch( $request );
		$response_data = $response->get_data();
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Invalid parameter(s): object_id', $response_data['message'] );
		$this->assertEquals( 'object_id is not of type integer.', $response_data['data']['params']['object_id'] );
	}

	/**
	 * Testing the `/jetpack/v4/database-object/backup` endpoint with admin user.
	 */
	public function test_backup_database_object_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/database-object/backup' );
		$request->set_query_params(
			array(
				'object_id'   => 123,
				'object_type' => 'woocommerce_attribute',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/database-object/backup` endpoint on success.
	 */
	public function test_backup_database_object_success() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/database-object/backup' );
		$request->set_query_params(
			array(
				'object_id'   => 123,
				'object_type' => 'woocommerce_attribute',
			)
		);

		$response = $this->dispatch_request_signed_with_blog_token( $request );

		$this->assertEquals( 404, $response->get_status() ); // success in this context.

		$this->assertEquals( 'Object not found', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/options/backup` endpoint with invalid params.
	 */
	public function test_backup_options_invalid_params() {
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/options/backup' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): name', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/options/backup` endpoint with admin user.
	 */
	public function test_backup_options_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/options/backup' );
		$request->set_query_params(
			array(
				'name' => 'home',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/options/backup` endpoint on success.
	 */
	public function test_backup_options_success() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/options/backup' );
		$request->set_query_params(
			array(
				'name' => 'home',
			)
		);

		$response = $this->dispatch_request_signed_with_blog_token( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Testing the `/jetpack/v4/comments/(?P<id>\d+)/backup` endpoint with admin user.
	 */
	public function test_backup_comment_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/comments/1234/backup' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/comments/(?P<id>\d+)/backup` endpoint on success.
	 */
	public function test_backup_comment_success() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/comments/1234/backup' );

		$response = $this->dispatch_request_signed_with_blog_token( $request );

		$this->assertEquals( 404, $response->get_status() ); // success in this context.

		$this->assertEquals( 'Comment not found', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/posts/(?P<id>\d+)/backup` endpoint with admin user.
	 */
	public function test_backup_post_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/posts/1/backup' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/posts/(?P<id>\d+)/backup endpoint on success.
	 */
	public function test_backup_post_success() {
		$post_id = wp_insert_post(
			array(
				'post_content' => 'dummy',
			)
		);

		$request = new WP_REST_Request( 'GET', "/jetpack/v4/posts/{$post_id}/backup" );

		$response = $this->dispatch_request_signed_with_blog_token( $request );

		$this->assertEquals( 200, $response->get_status() );

		$this->assertEquals( $post_id, $response->get_data()['post']['ID'] );
	}

	/**
	 * Testing the `/jetpack/v4/users/(?P<id>\d+)/backup` endpoint with admin user.
	 */
	public function test_backup_user_unauthorized() {
		wp_set_current_user( $this->admin_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/users/1/backup' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );

		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/users/(?P<id>\d+)/backup endpoint on success.
	 */
	public function test_backup_user_success() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'GET', "/jetpack/v4/users/{$this->admin_id}/backup" );

		$response = $this->dispatch_request_signed_with_blog_token( $request );

		$this->assertEquals( 200, $response->get_status() );

		$this->assertEquals( $this->admin_id, $response->get_data()['user']['ID'] );
	}

	/**
	 * Signs a request with a blog token before dispatching it.
	 *
	 * Ensures that these tests pass through Connection_Rest_Authentication::wp_rest_authenticate,
	 * because WP_REST_Server::dispatch doesn't call any auth logic (in a real
	 * request, this would all happen earlier).
	 *
	 * @param WP_REST_Request $request The request to sign before dispatching.
	 * @return WP_REST_Response
	 */
	private function dispatch_request_signed_with_blog_token( $request ) {
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		$token     = 'new:1:0';
		$timestamp = (string) time();
		$nonce     = 'testing123';
		$body_hash = '';

		$_SERVER['REQUEST_METHOD'] = 'POST';

		$_GET['_for']      = 'jetpack';
		$_GET['token']     = $token;
		$_GET['timestamp'] = $timestamp;
		$_GET['nonce']     = $nonce;
		$_GET['body-hash'] = $body_hash;
		// This is intentionally using base64_encode().
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$token,
						$timestamp,
						$nonce,
						$body_hash,
						'POST',
						'anything.example',
						'80',
						'',
					)
				) . "\n",
				'blogtoken',
				true
			)
		);

		$jp_connection_auth = Connection_Rest_Authentication::init();
		$jp_connection_auth->wp_rest_authenticate( false );

		$response = $this->server->dispatch( $request );

		$jp_connection_auth->reset_saved_auth_state();

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );

		return $response;
	}

	/**
	 * Intercept the `Jetpack_Options` call and mock the values.
	 * Site-level connection set-up.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function mock_jetpack_site_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'new.blogtoken';
			case 'id':
				return '999';
		}

		return $value;
	}

}
