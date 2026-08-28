<?php
/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-backup
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Backup\V0005\REST\Wpcom_Request_Mock;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function remove_filter;
use function wp_delete_file;
use function wp_insert_post;
use function wp_insert_user;
use function wp_json_encode;
use function wp_set_current_user;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

class REST_Controller_Test extends TestCase {

	use Wpcom_Request_Mock;

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
	 */
	public function setUp(): void {
		parent::setUp();
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
		add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\Backup\\V0005\\REST_Controller', 'register_rest_routes' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		$this->reset_wpcom_request_mock();
		wp_set_current_user( 0 );

		unset(
			$_GET['_for'],
			$_GET['token'],
			$_GET['timestamp'],
			$_GET['nonce'],
			$_GET['body-hash'],
			$_GET['signature'],
			$_SERVER['REQUEST_METHOD']
		);

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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/backup-helper-script` endpoint on success.
	 */
	public function test_install_backup_helper_script_success() {
		$body = array(
			'helper' => base64_encode( "<?php /* Jetpack Backup Helper Script */\n\$path = '[wp_path]'\n" ),
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );

		$response      = $this->dispatch_request_signed_with_blog_token( $request );
		$response_data = $response->get_data();
		$this->assertEquals(
			200,
			$response->get_status(),
			'Non-HTTP 200 response with data: ' . var_export( $response_data, true )
		);
		$this->assertArrayHasKey(
			'url',
			$response_data,
			'Response should have "url" key: ' . var_export( $response_data, true )
		);
		$this->assertArrayHasKey(
			'abspath',
			$response_data,
			'Response should have "abspath" key: ' . var_export( $response_data, true )
		);
		$this->assertArrayHasKey(
			'path',
			$response_data,
			'Response should have "path" key: ' . var_export( $response_data, true )
		);

		// Cleanup.
		wp_delete_file( $response_data['path'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/backup-helper-script` endpoint with bad helper script contents.
	 */
	public function test_install_backup_helper_script_bad_header() {
		$body = array(
			'helper' => base64_encode( 'totally not a helper script' ),
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertTrue( false !== strpos( $response->get_data()['message'], 'Bad helper script header' ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 200, $response->get_status() );

		$this->assertTrue( $response->get_data()['success'] );
	}

	/**
	 * Testing the `DELETE /jetpack/v4/backup-helper-script` endpoint on success.
	 */
	public function test_delete_backup_helper_script_bad_header() {
		$path = tempnam( sys_get_temp_dir(), 'helper-script' );
		file_put_contents( $path, str_repeat( 'a', 1024 ) );

		$body = array( 'path' => $path );

		$request = new WP_REST_Request( 'DELETE', '/jetpack/v4/backup-helper-script' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 500, $response->get_status() );
		$this->assertTrue( false !== strpos( $response->get_data()['message'], 'Bad helper script header' ) );

		wp_delete_file( $path );
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

	/**
	 * Testing the existence of `/jetpack/v4/orders/(?P<id>\d+)/backup endpoint.
	 * No WooCommerce code available.
	 */
	public function test_backup_order_endpoint_no_wc_code() {

		$order_id = 1;

		$request = new WP_REST_Request( 'GET', "/jetpack/v4/orders/{$order_id}/backup" );

		$response = $this->dispatch_request_signed_with_blog_token( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Sign in and have WordPress.com answer, with the constants a signed
	 * request needs already in place.
	 *
	 * `Client::validate_args_for_wpcom_json_api_request()` reads
	 * `JETPACK__WPCOM_JSON_API_BASE` before `build_signed_request()` installs
	 * the filter that supplies its default, so without this the first signed
	 * request of the process is built against a host-less URL and refused
	 * before the wire — which would make these tests pass or fail on where
	 * they land in the run order. Plugins prime the constants at bootstrap;
	 * tests have to do it themselves.
	 *
	 * @param string     $body   Raw body WordPress.com should answer with.
	 * @param int|string $status HTTP status WordPress.com should answer with.
	 */
	private function arrange_signed_wpcom( $body, $status ) {
		Connection_Utils::init_default_constants();
		$this->arrange_wpcom_raw( $body, $status );
	}

	/**
	 * Preflight reads a success code reported as a string.
	 *
	 * `wp_remote_retrieve_response_code()` hands back whatever the transport
	 * put there, and this route was the one place in the package that then
	 * forwarded the status it had just read straight into `data.status`.
	 * Uncast, `'200'` failed the comparison and the error envelope was served
	 * as HTTP 200 — `WP_HTTP_Response::set_status()` runs the value through
	 * `absint()` — so `apiFetch` resolves, nothing throws, and a failure
	 * arrives at the caller looking like a successful preflight.
	 *
	 * The decoded payload is asserted rather than the absence of an error,
	 * and that is the point: the bug served a *success* status, so a test
	 * that only checked for "not a failure status" would have passed on it.
	 */
	public function test_preflight_treats_a_string_status_as_its_number() {
		$this->arrange_signed_wpcom( '{"ok":true,"score":42}', '200' );

		$response = REST_Controller::get_site_backup_preflight();

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame( 42, $response->get_data()['score'] );
	}

	/**
	 * A real failure status still travels, which is what the route is for.
	 *
	 * Guards the clamp below from being "fixed" into a flat 500: the reason
	 * this route forwards the status at all is that 403 and 503 mean
	 * different things to whoever is reading. 403 rather than 500, because
	 * 500 is also what the clamp falls back to.
	 */
	public function test_preflight_forwards_a_genuine_failure_status() {
		$this->arrange_signed_wpcom( '{}', 403 );

		$data = REST_Controller::get_site_backup_preflight()->get_error_data();

		$this->assertSame( 403, $data['status'] );
	}

	/**
	 * A status outside the failure range never reaches `data.status`.
	 *
	 * The cast alone does not make the forward safe. `(int)` is total, so an
	 * absent code becomes `0` and `'2 Bad'` becomes `2`; `status_header()`
	 * emits an invalid status line for either. A 3xx is servable and still
	 * wrong — an error envelope under a redirect code, with no `Location`.
	 *
	 * @param string $label    What this response carries.
	 * @param mixed  $upstream The status code the transport reports.
	 * @dataProvider provide_preflight_statuses_that_are_not_failures
	 */
	#[DataProvider( 'provide_preflight_statuses_that_are_not_failures' )]
	public function test_preflight_never_forwards_a_status_it_cannot_serve( $label, $upstream ) {
		$this->arrange_signed_wpcom( '{}', $upstream );

		$data = REST_Controller::get_site_backup_preflight()->get_error_data();

		$this->assertSame( 500, $data['status'], $label );
	}

	/**
	 * Statuses the preflight route must not forward as its own.
	 *
	 * @return array
	 */
	public static function provide_preflight_statuses_that_are_not_failures() {
		return array(
			'a 3xx'                    => array( 'a 3xx', 302 ),
			'a status with a suffix'   => array( 'a status with a suffix', '2 Bad' ),
			'no status at all'         => array( 'no status at all', '' ),
			'a status above the range' => array( 'a status above the range', 600 ),
		);
	}

	/**
	 * The undo-event route reads a success code reported as a string.
	 *
	 * Uncast, a `'200'` discarded a perfectly good activity page and the
	 * route answered `null` — which it also answers when the site genuinely
	 * has nothing to undo, so the caller cannot tell the two apart.
	 *
	 * The fixture needs two rewindable events: the first that is not itself a
	 * backup becomes `last_rewindable_event`, and the next one after it
	 * supplies the `rewind_id` to undo to. With only one, the route returns
	 * `null` for a reason that has nothing to do with the status.
	 */
	public function test_undo_event_treats_a_string_status_as_its_number() {
		$this->arrange_signed_wpcom(
			'{"current":{"orderedItems":['
				. '{"name":"plugin__updated","is_rewindable":true,"rewind_id":"1786663613.94"},'
				. '{"name":"rewind__backup_complete_full","is_rewindable":true,"rewind_id":"1786600000.11"}'
				. ']}}',
			'200'
		);

		$response = REST_Controller::get_site_backup_undo_event();

		$this->assertNotNull( $response );
		$data = $response->get_data();
		$this->assertSame( 'plugin__updated', $data['last_rewindable_event']['name'] );
		$this->assertSame( '1786600000.11', $data['undo_backup_id'] );
	}
}
