<?php
/**
 * Tests for REST_Pinghub_Token
 *
 * @package automattic/jetpack-rtc
 */

declare( strict_types = 1 );

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for the REST_Pinghub_Token controller.
 *
 * @covers \Automattic\Jetpack\RTC\REST_Pinghub_Token
 */
#[CoversClass( \Automattic\Jetpack\RTC\REST_Pinghub_Token::class )]
class REST_Pinghub_Token_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var \Automattic\Jetpack\RTC\REST_Pinghub_Token
	 */
	private $endpoint;

	/**
	 * @var \ReflectionMethod
	 */
	private $generate_token;

	/**
	 * Set up before each test.
	 */
	public function set_up(): void {
		parent::set_up();

		require_once __DIR__ . '/../../src/rest-api/class-rest-pinghub-token.php';

		$this->endpoint       = new \Automattic\Jetpack\RTC\REST_Pinghub_Token();
		$this->generate_token = new \ReflectionMethod( $this->endpoint, 'generate_token' );
		if ( PHP_VERSION_ID < 80100 ) {
			$this->generate_token->setAccessible( true );
		}

		// Enable RTC and pinghub so the permissions check passes when needed.
		add_filter( 'jetpack_rtc_enabled', '__return_true' );
		update_option( 'wp_collaboration_enabled', true );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down(): void {
		delete_option( 'wpcom_blog_id_stub' );
		delete_option( 'wp_collaboration_enabled' );
		remove_all_filters( 'jetpack_rtc_enabled' );
		parent::tear_down();
	}

	// -------------------------------------------------------------------------
	// create_item_permissions_check
	// -------------------------------------------------------------------------

	/**
	 * Allows users who are members of the blog and can edit posts.
	 */
	public function test_create_item_permissions_check_allows_user_who_can_edit_posts(): void {
		$user_id = wp_create_user( 'rtc_author', 'password', 'rtc-author@test.example' );
		$user    = new WP_User( $user_id );
		$user->set_role( 'author' );
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/rtc/pinghub-token' );

		$this->assertTrue( $this->endpoint->create_item_permissions_check( $request ) );
	}

	/**
	 * Rejects users who are members of the blog but cannot edit posts.
	 */
	public function test_create_item_permissions_check_rejects_user_without_edit_posts_capability(): void {
		$user_id = wp_create_user( 'rtc_subscriber', 'password', 'rtc-subscriber@test.example' );
		$user    = new WP_User( $user_id );
		$user->set_role( 'subscriber' );
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/rtc/pinghub-token' );
		$result  = $this->endpoint->create_item_permissions_check( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	// -------------------------------------------------------------------------
	// generate_token – unconnected user uses blog token path
	// -------------------------------------------------------------------------

	/**
	 * When the current user has no Jetpack user token, generate_token() falls
	 * back to the blog-token path (wpcom_json_api_request_as_blog). In the
	 * test environment (no real WPCOM connection), this returns null.
	 */
	public function test_generate_token_returns_null_for_unconnected_user(): void {
		if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
			$this->markTestSkipped( 'Jetpack Connection Manager not available.' );
		}

		// Create and log in a user who has no Jetpack user token.
		$user_id = wp_create_user( 'rtc_test_user', 'password', 'rtc@test.example' );
		wp_set_current_user( $user_id );

		$result = $this->generate_token->invoke( $this->endpoint, 123 );

		// Without a real WPCOM connection, the blog-token API call returns null.
		$this->assertNull( $result );
	}

	// -------------------------------------------------------------------------
	// create_item – blog ID missing
	// -------------------------------------------------------------------------

	/**
	 * Returns a 500 WP_Error when get_wpcom_blog_id() returns false.
	 */
	public function test_create_item_returns_500_when_no_blog_id(): void {
		// wpcom_blog_id_stub option not set → get_wpcom_blog_id() returns false.
		$request  = new WP_REST_Request( 'POST', '/wpcom/v2/rtc/pinghub-token' );
		$response = $this->endpoint->create_item( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'rest_pinghub_token_error', $response->get_error_code() );
		$this->assertSame( 500, $response->get_error_data()['status'] );
	}

	// -------------------------------------------------------------------------
	// create_item – null token returns 500
	// -------------------------------------------------------------------------

	/**
	 * When generate_token() returns null (e.g. no real WPCOM connection),
	 * create_item() returns a generic 500 error.
	 */
	public function test_create_item_returns_500_when_token_is_null(): void {
		if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
			$this->markTestSkipped( 'Jetpack Connection Manager not available.' );
		}

		// Provide a valid blog ID so create_item() proceeds to generate_token().
		update_option( 'wpcom_blog_id_stub', 123 );

		$user_id = wp_create_user( 'rtc_test_user2', 'password', 'rtc2@test.example' );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'POST', '/wpcom/v2/rtc/pinghub-token' );
		$response = $this->endpoint->create_item( $request );

		// Without a real WPCOM connection, generate_token() returns null → 500.
		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'rest_pinghub_token_error', $response->get_error_code() );
		$this->assertSame( 500, $response->get_error_data()['status'] );
	}
}
