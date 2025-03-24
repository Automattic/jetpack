<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Scheduled_Actions_Controller.
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Publicize\REST_API\Scheduled_Actions_Controller;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;
use WpOrg\Requests\Requests;

/**
 * Class Scheduled_Actions_Controller_Test
 *
 * @coversDefaultClass Automattic\Jetpack\Publicize\REST_API\Scheduled_Actions_Controller
 */
class Scheduled_Actions_Controller_Test extends TestCase {

	/**
	 * The user IDs.
	 *
	 * @var array
	 */
	private static $user_ids = array();

	/**
	 * The user IDs.
	 *
	 * @var array
	 */
	private static $post_ids = array();

	/**
	 * Route to endpoint.
	 *
	 * @var string
	 */
	private static $path = '';

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Publicize instance.
	 *
	 * @var ?Publicize
	 */
	private $publicize = null;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		global $publicize;

		$this->publicize = $this->getMockBuilder( Publicize::class )->onlyMethods( array( 'save_meta' ) )->getMock();

		$publicize = $this->publicize;

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		foreach ( array( 'editor', 'author', 'subscriber' ) as $role ) {
			static::$user_ids[ $role ] = wp_insert_user(
				array(
					'user_login' => 'dummy_' . $role,
					'user_pass'  => 'dummy_pass',
					'role'       => $role,
				)
			);

			if ( 'subscriber' === $role ) {
				continue;
			}

			$posts_by_status = array();

			foreach ( array( 'publish', 'draft' ) as $status ) {
				$posts_by_status[ $status ] = wp_insert_post(
					array(
						'post_author'  => static::$user_ids[ $role ],
						'post_title'   => 'acd',
						'post_excerpt' => 'dsad',
						'post_status'  => $status,
						'post_type'    => 'post',
					)
				);
			}

			static::$post_ids[ $role ] = $posts_by_status;
		}

		$connections = array(
			array(
				'connection_id' => '111',
				'display_name'  => 'Tumblr Connection',
				'service_name'  => 'tumblr',
				'service_label' => 'Tumblr',
				'shared'        => false,
				'wpcom_user_id' => 222,
			),
			array(
				'connection_id' => '112',
				'display_name'  => 'Mastodon Connection',
				'service_name'  => 'mastodon',
				'service_label' => 'Mastodon',
				'shared'        => true,
				'wpcom_user_id' => 221,
			),
		);

		set_transient( Connections::CONNECTIONS_TRANSIENT, $connections, DAY_IN_SECONDS );

		static::$path = '/wpcom/v2/publicize/scheduled-actions';

		wp_set_current_user( static::$user_ids['editor'] );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		// Register REST routes.
		add_action( 'rest_api_init', array( new Scheduled_Actions_Controller(), 'register_routes' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		$this->publicize = null;
		delete_transient( Connections::CONNECTIONS_TRANSIENT );
	}

	/**
	 * Mock the user's tokens.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$user_ids['editor']     => 'pretend_this_is_valid.secret.' . static::$user_ids['editor'],
				static::$user_ids['author']     => 'pretend_this_is_valid.secret.' . static::$user_ids['author'],
				static::$user_ids['subscriber'] => 'pretend_this_is_valid.secret.' . static::$user_ids['subscriber'],
			),
		);
	}

	/**
	 * Mock the wpcom api proxy call.
	 *
	 * @param mixed $result The result to return.
	 *
	 * @return callable The clear mock function.
	 */
	public function mock_wpcom_api_proxy_call( $result ) {
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';
		update_option( 'jetpack_private_options', array( 'blog_token' => 'blog.token' ) );

		$callback = function () use ( $result ) {
			return array(
				'body' => wp_json_encode( $result ),
			);
		};

		add_filter( 'pre_http_request', $callback );

		return function () use ( $callback ) {
			remove_filter( 'pre_http_request', $callback );
		};
	}

	/**
	 * Test for get_items_permissions_check.
	 */
	public function test_get_items_permissions_check() {
		// For logged out users.
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, static::$path );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// For logged in users.
		// SUBSCRIBER.
		wp_set_current_user( static::$user_ids['subscriber'] );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// AUTHOR.
		wp_set_current_user( static::$user_ids['author'] );

		// Reset the request.
		$request = new WP_REST_Request( Requests::GET, static::$path );

		$response = $this->server->dispatch( $request );

		// Author should not be able to get items without post_id.
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You must pass a post ID to list scheduled shares.', $response->get_data()['message'] );

		// Now lets us pass an invalid post ID via query params.
		$request->set_query_params(
			array(
				'post_id' => 89898989, // Invalid post ID.
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'post_not_found', $response->as_error()->get_error_code() );

		// Now lets us pass a valid post ID via query params.
		$request->set_query_params(
			array(
				'post_id' => static::$post_ids['author']['publish'],
			)
		);
		$mock_item = array(
			'id'            => 123,
			'post_id'       => 123,
			'connection_id' => 123,
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( array( $mock_item ) );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		$this->assertEquals( array( $mock_item ), $response->get_data() );

		// EDITOR.
		wp_set_current_user( static::$user_ids['editor'] );

		// Reset the request.
		$request = new WP_REST_Request( Requests::GET, static::$path );

		$clear_mock = $this->mock_wpcom_api_proxy_call( array( $mock_item, $mock_item ) );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		// Editor shoudld be able to get items without post_id.
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( array( $mock_item, $mock_item ), $response->get_data() );

		// Now lets us pass an invalid post ID via query params.
		$request->set_query_params(
			array(
				'post_id' => 89898989, // Invalid post ID.
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'post_not_found', $response->as_error()->get_error_code() );

		// Now lets us pass a valid post ID via query params.
		$request->set_query_params(
			array(
				'post_id' => static::$post_ids['editor']['publish'],
			)
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( array( $mock_item ) );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		$this->assertEquals( array( $mock_item ), $response->get_data() );
	}

	/**
	 * Test for create_item_permissions_check.
	 */
	public function test_create_item_permissions_check() {
		// For logged out users.
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => 123,
				'connection_id' => 123,
			)
		);
		$response = $this->server->dispatch( $request );

		// 401 for logged out users.
		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// For logged in users.
		// SUBSCRIBER.
		wp_set_current_user( static::$user_ids['subscriber'] );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => 123,
				'connection_id' => 123,
			)
		);
		$response = $this->server->dispatch( $request );

		// 403 for logged in users.
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// AUTHOR.
		wp_set_current_user( static::$user_ids['author'] );

		// Without required params.
		$request  = new WP_REST_Request( Requests::POST, static::$path );
		$response = $this->server->dispatch( $request );
		// Items can't be created without required params.
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_missing_callback_param', $response->as_error()->get_error_code() );
		$this->assertEquals( array( 'post_id', 'connection_id' ), $response->get_data()['data']['params'] );

		// Let us pass invalid post ID.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => 8989898989, // Non existent post ID.
				'connection_id' => 123,
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'post_not_found', $response->as_error()->get_error_code() );

		// Let us pass a draft post ID.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['author']['draft'],
				'connection_id' => 123,
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'post_not_published', $response->as_error()->get_error_code() );
		$this->assertEquals( 'The post must be published to schedule it for sharing.', $response->get_data()['message'] );

		// Let us pass a valid post ID, which the author does not own.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['editor']['publish'],
				'connection_id' => 123,
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'rest_forbidden', $response->as_error()->get_error_code() );
		$this->assertEquals( 'Sorry, you are not allowed to view or scheduled shares for that post.', $response->get_data()['message'] );

		// Now let us try with an invalid connection ID.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['author']['publish'],
				'connection_id' => 8989898989, // Non existent connection ID.
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'connection_not_found', $response->as_error()->get_error_code() );

		// Now let us try with a valid connection ID but not a shared connection.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['author']['publish'],
				'connection_id' => 111,
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'rest_forbidden', $response->as_error()->get_error_code() );
		$this->assertEquals( 'Sorry, you cannot schedule shares to that connection.', $response->get_data()['message'] );

		// Now let us try with a shared connection.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['author']['publish'],
				'connection_id' => 112,
			)
		);
		$mock_item = array(
			'id'            => 123,
			'post_id'       => static::$post_ids['author']['publish'],
			'connection_id' => 112,
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );

		// EDITOR.
		wp_set_current_user( static::$user_ids['editor'] );

		// Without required params.
		$request  = new WP_REST_Request( Requests::POST, static::$path );
		$response = $this->server->dispatch( $request );
		// Items can't be created without required params.
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_missing_callback_param', $response->as_error()->get_error_code() );
		$this->assertEquals( array( 'post_id', 'connection_id' ), $response->get_data()['data']['params'] );

		// Let us pass invalid post ID.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => 8989898989, // Non existent post ID.
				'connection_id' => 123,
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'post_not_found', $response->as_error()->get_error_code() );

		// Let us pass a draft post ID.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['editor']['draft'],
				'connection_id' => 123,
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'post_not_published', $response->as_error()->get_error_code() );
		$this->assertEquals( 'The post must be published to schedule it for sharing.', $response->get_data()['message'] );

		// Let us pass a valid post ID, which the editor does not own with an invalid connection ID.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['editor']['publish'],
				'connection_id' => 8989898989, // Non existent connection ID.
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'connection_not_found', $response->as_error()->get_error_code() );

		// Now let us try with a valid connection ID but not a shared connection.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['editor']['publish'],
				'connection_id' => 111,
			)
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );

		// Now let us try with a shared connection.
		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'post_id'       => static::$post_ids['editor']['publish'],
				'connection_id' => 112,
			)
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );
	}

	/**
	 * Test for get_item_permissions_check.
	 */
	public function test_get_item_permissions_check() {
		// For logged out users.
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, static::$path . '/123' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// For logged in users.
		// SUBSCRIBER.
		wp_set_current_user( static::$user_ids['subscriber'] );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// AUTHOR.
		wp_set_current_user( static::$user_ids['author'] );

		// Reset the request.
		$request = new WP_REST_Request( Requests::GET, static::$path . '/123' );

		$mock_item = array(
			'id'            => 123,
			'post_id'       => 123,
			'connection_id' => 123,
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );

		// EDITOR.
		wp_set_current_user( static::$user_ids['editor'] );

		// Reset the request.
		$request = new WP_REST_Request( Requests::GET, static::$path . '/123' );

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		// Editor shoudld be able to get items without post_id.
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );
	}

	/**
	 * Test for update_item_permissions_check.
	 */
	public function test_update_item_permissions_check() {
		// For logged out users.
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::POST, static::$path . '/123' );
		$request->set_body_params(
			array(
				'message' => 'Test',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// For logged in users.
		// SUBSCRIBER.
		wp_set_current_user( static::$user_ids['subscriber'] );
		$request = new WP_REST_Request( Requests::POST, static::$path . '/123' );
		$request->set_body_params(
			array(
				'message' => 'Test',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// AUTHOR.
		wp_set_current_user( static::$user_ids['author'] );
		$request = new WP_REST_Request( Requests::POST, static::$path . '/123' );
		$request->set_body_params(
			array(
				'message' => 'Test',
			)
		);

		$mock_item = array(
			'id'            => 123,
			'post_id'       => 123,
			'connection_id' => 123,
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );

		// EDITOR.
		wp_set_current_user( static::$user_ids['editor'] );

		// Reset the request.
		$request = new WP_REST_Request( Requests::GET, static::$path . '/123' );
		$request->set_body_params(
			array(
				'message' => 'Test',
			)
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		// Editor shoudld be able to get items without post_id.
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );
	}

	/**
	 * Test for delete_item_permissions_check.
	 */
	public function test_delete_item_permissions_check() {
		// For logged out users.
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::DELETE, static::$path . '/123' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// For logged in users.
		// SUBSCRIBER.
		wp_set_current_user( static::$user_ids['subscriber'] );
		$request  = new WP_REST_Request( Requests::DELETE, static::$path . '/123' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to do that.', $response->get_data()['message'] );

		// AUTHOR.
		wp_set_current_user( static::$user_ids['author'] );
		$request = new WP_REST_Request( Requests::DELETE, static::$path . '/123' );

		$mock_item = array(
			'id'            => 123,
			'post_id'       => 123,
			'connection_id' => 123,
		);

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );

		// EDITOR.
		wp_set_current_user( static::$user_ids['editor'] );

		// Reset the request.
		$request = new WP_REST_Request( Requests::DELETE, static::$path . '/123' );

		$clear_mock = $this->mock_wpcom_api_proxy_call( $mock_item );
		$response   = $this->server->dispatch( $request );
		$clear_mock();

		// Editor shoudld be able to get items without post_id.
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $mock_item, $response->get_data() );
	}
}
