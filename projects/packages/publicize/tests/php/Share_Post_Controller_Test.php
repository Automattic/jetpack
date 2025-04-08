<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Share_Post_Controller.
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\REST_API\Share_Post_Controller;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;
use WpOrg\Requests\Requests;

/**
 * Class Test_Share_Post_Controller
 *
 * @coversDefaultClass Automattic\Jetpack\Publicize\REST_API\Share_Post_Controller
 */
class Share_Post_Controller_Test extends TestCase {

	/**
	 * Mock user ID with editor permissions.
	 *
	 * @var int
	 */
	private static $user_id_editor = 0;

	/**
	 * Mock user ID with subscriber permissions.
	 *
	 * @var int
	 */
	private static $user_id_subscriber = 0;

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
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		static::$user_id_editor = wp_insert_user(
			array(
				'user_login' => 'dummy_editor',
				'user_pass'  => 'dummy_pass',
				'role'       => 'editor',
			)
		);

		static::$user_id_subscriber = wp_insert_user(
			array(
				'user_login' => 'dummy_subscriber',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);

		$post_id = wp_insert_post(
			array(
				'post_author'  => static::$user_id_editor,
				'post_title'   => 'acd',
				'post_excerpt' => 'dsad',
				'post_status'  => 'published',
				'post_type'    => 'post',
			)
		);

		static::$path = "/wpcom/v2/publicize/share-post/$post_id";

		wp_set_current_user( static::$user_id_editor );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		// Register REST routes.
		add_action( 'rest_api_init', array( new Share_Post_Controller(), 'register_routes' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
	}

	/**
	 * Mock the user's tokens.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$user_id_editor     => 'pretend_this_is_valid.secret.' . static::$user_id_editor,
				static::$user_id_subscriber => 'pretend_this_is_valid.secret.' . static::$user_id_subscriber,
			),
		);
	}

	/**
	 * Test if the user has a valid token for this blog.
	 *
	 * @covers ::permissions_check
	 */
	public function test_publicize_share_post_permissions_check_wrong_user() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'message'             => 'string',
				'skipped_connections' => array(),
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'Sorry, you are not allowed to access Jetpack Social data on this site.', $response->get_data()['message'] );
	}

	/**
	 * Test if the user can publish posts on this blog.
	 *
	 * @covers ::permissions_check
	 */
	public function test_publicize_share_post_permissions_check_wrong_role() {
		wp_set_current_user( static::$user_id_subscriber );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'message'             => 'string',
				'skipped_connections' => array(),
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );

		$this->assertEquals( 'Sorry, you are not allowed to access Jetpack Social data on this site.', $response->get_data()['message'] );

		$this->assertEquals( 'invalid_user_permission_publicize', $response->as_error()->get_error_code() );
	}

	/**
	 * Test that we check for invalid parameters.
	 *
	 * @dataProvider rest_invalid_params
	 *
	 * @param array $input The test post content to parse.
	 */
	public function test_publicize_share_post_rest_invalid_param( $input ) {
		wp_set_current_user( static::$user_id_subscriber );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params( $input );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );

		$this->assertEquals( 'rest_invalid_param', $response->as_error()->get_error_code() );
	}

	/**
	 * Test that we check for missing parameters.
	 *
	 * @dataProvider rest_missing_callback_params
	 *
	 * @param array $input The test post content to parse.
	 */
	public function test_publicize_share_post_rest_missing_callback_param( $input ) {
		wp_set_current_user( static::$user_id_subscriber );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params( $input );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );

		$this->assertEquals( 'rest_missing_callback_param', $response->as_error()->get_error_code() );
	}

	/**
	 * Data provider for missing parameters.
	 *
	 * @return array[]
	 */
	public static function rest_missing_callback_params() {
		return array(
			'message can not be null.' => array(
				array(
					'message'             => null,
					'skipped_connections' => array(),
				),
			),
			'message is required.'     => array(
				array(
					'skipped_connections' => array(),
				),
			),
		);
	}

	/**
	 * Data provider for invalid parameters.
	 *
	 * @return array[]
	 */
	public static function rest_invalid_params() {
		return array(
			'message can not be an int.'               => array(
				array(
					'message'             => 123,
					'skipped_connections' => array(),
				),
			),
			'message can not be an array.'             => array(
				array(
					'message'             => array(),
					'skipped_connections' => array(),
				),
			),
			'skipped_connections can not be an int.'   => array(
				array(
					'message'             => 'string',
					'skipped_connections' => 123,
				),
			),
			'skipped_connections can not be a string.' => array(
				array(
					'message'             => 'string',
					'skipped_connections' => 'string',
				),
			),
		);
	}
}
