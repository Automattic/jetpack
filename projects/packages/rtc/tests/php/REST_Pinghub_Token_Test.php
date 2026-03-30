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
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down(): void {
		delete_option( 'wpcom_blog_id_stub' );
		remove_all_filters( 'jetpack_rtc_enabled' );
		parent::tear_down();
	}

	// -------------------------------------------------------------------------
	// generate_token – user_not_connected path
	// -------------------------------------------------------------------------

	/**
	 * Returns WP_Error('user_not_connected') when the current user has no Jetpack
	 * user token and the Connection Manager is available.
	 */
	public function test_generate_token_returns_user_not_connected_when_no_token(): void {
		if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
			$this->markTestSkipped( 'Jetpack Connection Manager not available.' );
		}

		// Create and log in a user who has no Jetpack user token.
		$user_id = wp_create_user( 'rtc_test_user', 'password', 'rtc@test.example' );
		wp_set_current_user( $user_id );

		$result = $this->generate_token->invoke( $this->endpoint, 123 );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'user_not_connected', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
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
	// create_item – WP_Error passthrough
	// -------------------------------------------------------------------------

	/**
	 * Passes a WP_Error from generate_token() straight through to the caller,
	 * preserving its error code and HTTP status.
	 *
	 * Ensures a 403 user_not_connected reaches the client instead of being
	 * swallowed and replaced with a generic 500.
	 */
	public function test_create_item_passes_through_wp_error_from_generate_token(): void {
		if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
			$this->markTestSkipped( 'Jetpack Connection Manager not available.' );
		}

		// Provide a valid blog ID so create_item() proceeds to generate_token().
		update_option( 'wpcom_blog_id_stub', 123 );

		$user_id = wp_create_user( 'rtc_test_user2', 'password', 'rtc2@test.example' );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'POST', '/wpcom/v2/rtc/pinghub-token' );
		$response = $this->endpoint->create_item( $request );

		// generate_token() returns user_not_connected; create_item() must echo it.
		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'user_not_connected', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data()['status'] );
	}
}
