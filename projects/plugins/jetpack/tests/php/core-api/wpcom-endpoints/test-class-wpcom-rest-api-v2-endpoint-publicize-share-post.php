<?php // phpcs:ignore
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Publicize_Share_Post.
 * To run this test by itself use the following command:
 * jetpack docker phpunit -- --filter=WP_Test_WPCOM_REST_API_V2_Endpoint_Publicize_Share_Post
 */

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Class WP_Test_WPCOM_REST_API_V2_Endpoint_Publicize_Share_Post
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Publicize_Share_Post
 */
class WP_Test_WPCOM_REST_API_V2_Endpoint_Publicize_Share_Post extends WP_Test_Jetpack_REST_Testcase {

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
	 * Create 2 mock blog users and a mock blog post.
	 */
	public function set_up() {
		parent::set_up();

		static::$user_id_editor     = self::factory()->user->create( array( 'role' => 'editor' ) );
		static::$user_id_subscriber = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'published',
				'post_author' => (string) static::$user_id_editor,
			)
		);

		static::$path = "/wpcom/v2/posts/$post_id/publicize";

		wp_set_current_user( static::$user_id_editor );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		parent::tear_down();
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

		$request = wp_rest_request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'message'             => 'string',
				'skipped_connections' => array(),
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 * Test if the user can publish posts on this blog.
	 *
	 * @covers ::permissions_check
	 */
	public function test_publicize_share_post_permissions_check_wrong_role() {
		wp_set_current_user( static::$user_id_subscriber );

		$request = wp_rest_request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'message'             => 'string',
				'skipped_connections' => array(),
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'unauthorized', $response, 401 );
	}

	/**
	 * Test that we check for invalid parameters.
	 *
	 * @dataProvider rest_invalid_params
	 *
	 * @param string $input The test post content to parse.
	 */
	public function test_publicize_share_post_rest_invalid_param( $input ) {
		wp_set_current_user( static::$user_id_subscriber );

		$request = wp_rest_request( Requests::POST, static::$path );
		$request->set_body_params( $input );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Test that we check for missing parameters.
	 *
	 * @dataProvider rest_missing_callback_params
	 *
	 * @param string $input The test post content to parse.
	 */
	public function test_publicize_share_post_rest_missing_callback_param( $input ) {
		wp_set_current_user( static::$user_id_subscriber );

		$request = wp_rest_request( Requests::POST, static::$path );
		$request->set_body_params( $input );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
	}

	/**
	 * Data provider for missing parameters.
	 *
	 * @return array[]
	 */
	public function rest_missing_callback_params() {
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
	public function rest_invalid_params() {
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
