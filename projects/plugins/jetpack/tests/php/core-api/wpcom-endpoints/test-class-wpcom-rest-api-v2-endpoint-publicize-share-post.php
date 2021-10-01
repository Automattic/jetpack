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
	 * Mock post ID.
	 *
	 * @var int
	 */
	private static $post_id = 0;

	/**
	 * Create 2 mock blog users and a mock blog post.
	 */
	public function set_up() {
		parent::set_up();

		static::$user_id_editor     = $this->factory->user->create( array( 'role' => 'editor' ) );
		static::$user_id_subscriber = $this->factory->user->create( array( 'role' => 'subscriber' ) );

		static::$post_id = $this->factory->post->create(
			array(
				'post_status' => 'published',
				'post_author' => (string) static::$user_id_editor,
			)
		);

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

		$request = wp_rest_request( Requests::POST, '/wpcom/v2/publicize/share/' . static::$post_id );
		$request->set_body_params(
			array(
				'message'           => 'test',
				'skipConnectionIds' => array(),
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

		$request = wp_rest_request( Requests::POST, '/wpcom/v2/publicize/share/' . static::$post_id );
		$request->set_body_params(
			array(
				'message'           => 'test',
				'skipConnectionIds' => array(),
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'unauthorized', $response, 401 );
	}
}
