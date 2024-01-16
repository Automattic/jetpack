<?php // phpcs:ignore
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Send_Email_Preview.
 * To run this test by itself use the following command:
 * jetpack docker phpunit -- --filter=WP_Test_WPCOM_REST_API_V2_Endpoint_Send_Email_Preview
 */

use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Class WP_Test_WPCOM_REST_API_V2_Endpoint_Send_Email_Preview
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Send_Email_Preview
 */
class WP_Test_WPCOM_REST_API_V2_Endpoint_Send_Email_Preview extends WP_Test_Jetpack_REST_Testcase {

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

		static::$user_id_editor     = self::factory()->user->create( array( 'role' => 'editor' ) );
		static::$user_id_subscriber = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		static::$path = '/wpcom/v2/send-email-preview';

		wp_set_current_user( static::$user_id_editor );
		static::$post_id = self::factory()->post->create(
			array(
				'post_status' => 'published',
				'post_author' => (string) static::$user_id_editor,
			)
		);

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
	 * Test that a non wp.com connected user shouldn't be able to use the endpoint.
	 *
	 * @covers ::permissions_check
	 */
	public function test_email_preview_permissions_check_wrong_user() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'id' => static::$post_id,
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_send_email_preview', $response, 401 );
	}

	/**
	 * Test that a subscriber shouldn't be able to use the endpoint.
	 *
	 * @covers ::permissions_check
	 */
	public function test_email_preview_permissions_check_wrong_role() {
		wp_set_current_user( static::$user_id_subscriber );

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_body_params(
			array(
				'id' => static::$post_id,
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
	}
}
