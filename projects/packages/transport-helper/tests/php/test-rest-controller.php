<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Transport_Helper\V0002;

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use function add_action;
use function do_action;
use function remove_filter;
use function wp_delete_file;
use function wp_insert_user;
use function wp_json_encode;
use function wp_set_current_user;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-transport-helper
 */
class Test_REST_Controller extends TestCase {

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
		add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Transport_Helper\\V0002\\REST_Controller', 'register_rest_routes' ) );

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
	public function test_install_helper_script_missing_required_param() {
		$request  = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): helper', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/backup-helper-script` endpoint with admin user.
	 */
	public function test_install_helper_script_unauthorized() {
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
	public function test_install_helper_script_success() {
		$body = array(
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			'helper' => base64_encode( "<?php /* Jetpack Backup Helper Script */\n\$path = '[wp_path]'\n" ),
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response      = $this->dispatch_request_signed_with_blog_token( $request );
		$response_data = $response->get_data();
		$this->assertEquals(
			200,
			$response->get_status(),
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			'Non-HTTP 200 response with data: ' . var_export( $response_data, true )
		);
		$this->assertArrayHasKey(
			'url',
			$response_data,
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			'Response should have "url" key: ' . var_export( $response_data, true )
		);
		$this->assertArrayHasKey(
			'abspath',
			$response_data,
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			'Response should have "abspath" key: ' . var_export( $response_data, true )
		);
		$this->assertArrayHasKey(
			'path',
			$response_data,
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			'Response should have "path" key: ' . var_export( $response_data, true )
		);

		// Cleanup.
		wp_delete_file( $response_data['path'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/backup-helper-script` endpoint with bad helper script contents.
	 */
	public function test_install_helper_script_bad_header() {
		$body = array(
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			'helper' => base64_encode( 'totally not a helper script' ),
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertTrue( false !== strpos( $response->get_data()['message'], 'Bad helper script header' ) );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/backup-helper-script` endpoint when the `path` param is missing.
	 */
	public function test_delete_helper_script_missing_required_param() {
		$request  = new WP_REST_Request( 'DELETE', '/jetpack/v4/backup-helper-script' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'Missing parameter(s): path', $response->get_data()['message'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/backup-helper-script` endpoint with admin user.
	 */
	public function test_delete_helper_script_unauthorized() {
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
	public function test_delete_helper_script_success() {
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
	 * Testing the `DELETE /jetpack/v4/backup-helper-script` endpoint on success.
	 */
	public function test_delete_helper_script_bad_header() {
		$path = tempnam( sys_get_temp_dir(), 'helper-script' );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $path, str_repeat( 'a', 1024 ) );

		$body = array( 'path' => $path );

		$request = new WP_REST_Request( 'DELETE', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 500, $response->get_status() );
		$this->assertTrue( false !== strpos( $response->get_data()['message'], 'Bad helper script header' ) );

		wp_delete_file( $path );
	}

	/**
	 * Signs a request with a blog token before dispatching it.
	 *
	 * Ensures that these tests pass through Connection_Rest_Authentication::wp_rest_authenticate,
	 * because WP_REST_Server::dispatch doesn't call any auth logic (in a real
	 * request, this would all happen earlier).
	 *
	 * @param WP_REST_Request $request The request to sign before dispatching.
	 *
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
