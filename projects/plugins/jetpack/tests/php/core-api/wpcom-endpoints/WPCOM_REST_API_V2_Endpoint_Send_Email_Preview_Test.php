<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Send_Email_Preview.
 * To run this test by itself use the following command:
 * jetpack docker phpunit jetpack -- --filter=WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';
require_once __DIR__ . '/class-wpcom-rest-api-v2-endpoint-send-email-preview-test-stub.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Send_Email_Preview
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Send_Email_Preview::class )]
class WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test extends Jetpack_REST_TestCase {

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

	/**
	 * Test that prepare_post_for_akismet() builds the expected payload from the post author.
	 */
	public function test_prepare_post_for_akismet_builds_expected_payload() {
		$author_id = self::factory()->user->create(
			array(
				'role'         => 'editor',
				'display_name' => 'Ada Example',
				'user_email'   => 'ada@example.test',
				'user_url'     => 'https://ada.example.test',
			)
		);
		$post_id   = self::factory()->post->create(
			array(
				'post_title'   => 'Hello world',
				'post_content' => 'Some draft content.',
				'post_author'  => (string) $author_id,
				'post_status'  => 'draft',
			)
		);

		$controller = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$payload    = $controller->prepare_post_for_akismet_public( get_post( $post_id ) );

		$this->assertSame( 'blog-post-preview', $payload['comment_type'] );
		$this->assertSame( "Hello world\n\nSome draft content.", $payload['comment_content'] );
		$this->assertSame( 'Ada Example', $payload['comment_author'] );
		$this->assertSame( 'ada@example.test', $payload['comment_author_email'] );
		$this->assertSame( 'https://ada.example.test', $payload['comment_author_url'] );
		$this->assertSame( get_permalink( $post_id ), $payload['permalink'] );
		$this->assertSame( get_option( 'home' ), $payload['blog'] );
		$this->assertSame( get_bloginfo( 'language' ), $payload['blog_lang'] );
		$this->assertArrayHasKey( 'comment_date_gmt', $payload );
	}

	/**
	 * Test that the jetpack_send_email_preview_akismet_values filter runs.
	 */
	public function test_prepare_post_for_akismet_applies_filter() {
		$post_id = self::factory()->post->create(
			array(
				'post_title'  => 'x',
				'post_author' => (string) static::$user_id_editor,
			)
		);

		$called = false;
		$filter = function ( $payload, $post ) use ( &$called, $post_id ) {
			$called            = true;
			$payload['custom'] = 'injected';
			$this->assertSame( $post_id, $post->ID );
			return $payload;
		};
		add_filter( 'jetpack_send_email_preview_akismet_values', $filter, 10, 2 );

		$controller = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$payload    = $controller->prepare_post_for_akismet_public( get_post( $post_id ) );

		remove_filter( 'jetpack_send_email_preview_akismet_values', $filter, 10 );

		$this->assertTrue( $called, 'Filter should have fired.' );
		$this->assertSame( 'injected', $payload['custom'] );
	}

	/**
	 * Test that send_email_preview() returns a 404 error when the post id resolves to null.
	 *
	 * Called directly on the endpoint rather than via REST dispatch because the route
	 * only wires send_email_preview() as the callback on wpcom_simple hosts; in the
	 * test environment the callback is proxy_request_to_wpcom_as_user.
	 */
	public function test_send_email_preview_returns_404_for_invalid_post_id() {
		$controller = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();

		$request = new WP_REST_Request( Requests::POST, static::$path );
		$request->set_param( 'id', 999999 );

		$response = $controller->send_email_preview( $request );

		$this->assertTrue( is_wp_error( $response ) );
		$this->assertSame( 'rest_post_invalid_id', $response->get_error_code() );
		$this->assertSame( 404, $response->get_error_data()['status'] );
	}

	/**
	 * Test that a filter returning a non-array value falls back to the unfiltered payload.
	 */
	public function test_prepare_post_for_akismet_ignores_non_array_filter_return() {
		$post_id = self::factory()->post->create(
			array( 'post_author' => (string) static::$user_id_editor )
		);

		$filter = static function () {
			return 'not-an-array';
		};
		add_filter( 'jetpack_send_email_preview_akismet_values', $filter );

		$controller = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$payload    = $controller->prepare_post_for_akismet_public( get_post( $post_id ) );

		remove_filter( 'jetpack_send_email_preview_akismet_values', $filter );

		$this->assertIsArray( $payload );
		$this->assertArrayHasKey( 'comment_type', $payload );
	}

	/**
	 * Test that check_post_for_spam() returns false when Akismet isn't available.
	 */
	public function test_check_post_for_spam_fails_open_when_akismet_unavailable() {
		$post_id = self::factory()->post->create(
			array( 'post_author' => (string) static::$user_id_editor )
		);

		$controller                         = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$controller->mock_akismet_available = false;
		$controller->mock_akismet_response  = array( array(), 'true' ); // would be spam, but unavailable wins

		$this->assertFalse( $controller->check_post_for_spam_public( get_post( $post_id ) ) );
	}

	/**
	 * Test that a 'false' body from Akismet means not spam.
	 */
	public function test_check_post_for_spam_returns_false_on_ham() {
		$post_id = self::factory()->post->create(
			array( 'post_author' => (string) static::$user_id_editor )
		);

		$controller                        = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$controller->mock_akismet_response = array( array(), 'false' );

		$this->assertFalse( $controller->check_post_for_spam_public( get_post( $post_id ) ) );
	}

	/**
	 * Test that a 'true' body from Akismet means spam.
	 */
	public function test_check_post_for_spam_returns_true_on_spam() {
		$post_id = self::factory()->post->create(
			array( 'post_author' => (string) static::$user_id_editor )
		);

		$controller                        = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$controller->mock_akismet_response = array( array(), 'true' );

		$this->assertTrue( $controller->check_post_for_spam_public( get_post( $post_id ) ) );
	}

	/**
	 * Test that a malformed or empty Akismet response leaves the send unblocked.
	 */
	public function test_check_post_for_spam_returns_false_on_malformed_response() {
		$post_id = self::factory()->post->create(
			array( 'post_author' => (string) static::$user_id_editor )
		);

		$controller                        = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$controller->mock_akismet_response = array( array(), '' ); // empty body — nothing to parse

		$this->assertFalse( $controller->check_post_for_spam_public( get_post( $post_id ) ) );
	}

	/**
	 * Test that discard pro-tip + akismet_strictness=1 is treated as spam.
	 */
	public function test_check_post_for_spam_returns_true_on_strict_discard() {
		$post_id = self::factory()->post->create(
			array( 'post_author' => (string) static::$user_id_editor )
		);

		update_option( 'akismet_strictness', '1' );

		$controller                        = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$controller->mock_akismet_response = array(
			array( 'x-akismet-pro-tip' => 'discard' ),
			'false', // body says not spam, but strict-discard wins
		);

		$result = $controller->check_post_for_spam_public( get_post( $post_id ) );

		delete_option( 'akismet_strictness' );

		$this->assertTrue( $result );
	}

	/**
	 * Test that discard pro-tip without strictness falls back to body evaluation.
	 */
	public function test_check_post_for_spam_ignores_discard_without_strictness() {
		$post_id = self::factory()->post->create(
			array( 'post_author' => (string) static::$user_id_editor )
		);

		delete_option( 'akismet_strictness' );

		$controller                        = new WPCOM_REST_API_V2_Endpoint_Send_Email_Preview_Test_Stub();
		$controller->mock_akismet_response = array(
			array( 'x-akismet-pro-tip' => 'discard' ),
			'false',
		);

		$this->assertFalse( $controller->check_post_for_spam_public( get_post( $post_id ) ) );
	}
}
