<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Email_Preview.
 * To run this test by itself use the following command:
 * jetpack docker phpunit jetpack -- --filter=WPCOM_REST_API_V2_Endpoint_Email_Preview_Test
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Email_Preview_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Email_Preview
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Email_Preview::class )]
class WPCOM_REST_API_V2_Endpoint_Email_Preview_Test extends Jetpack_REST_TestCase {

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
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		static::$user_id_editor     = self::factory()->user->create( array( 'role' => 'editor' ) );
		static::$user_id_subscriber = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		static::$path = '/wpcom/v2/email-preview';

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
	 * Test that the endpoint route is registered.
	 */
	public function test_route_is_registered() {
		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/email-preview', $routes );
	}

	/**
	 * Test that an unauthenticated user cannot access the endpoint.
	 */
	public function test_permissions_check_rejects_unauthenticated_user() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_send_email_preview', $response, 401 );
	}

	/**
	 * Test that a subscriber cannot access the endpoint.
	 */
	public function test_permissions_check_rejects_subscriber() {
		wp_set_current_user( static::$user_id_subscriber );

		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
	}

	/**
	 * Test that a non-existent post returns a 404 error.
	 */
	public function test_permissions_check_returns_404_for_missing_post() {
		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', 999999 );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'post_not_found', $response, 404 );
	}

	/**
	 * Test that the access parameter only accepts valid values.
	 */
	public function test_access_param_rejects_invalid_value() {
		$request = new WP_REST_Request( Requests::GET, static::$path );
		$request->set_param( 'post_id', static::$post_id );
		$request->set_param( 'access', 'invalid_value' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Test that the access parameter accepts all valid enum values.
	 */
	public function test_access_param_accepts_valid_values() {
		$valid_values = array( 'everybody', 'subscribers', 'paid_subscribers' );

		foreach ( $valid_values as $value ) {
			$request = new WP_REST_Request( Requests::GET, static::$path );
			$request->set_param( 'post_id', static::$post_id );
			$request->set_param( 'access', $value );
			$response = $this->server->dispatch( $request );

			// Should not be a 400 (validation error).
			$this->assertNotSame( 400, $response->get_status(), "Access value '$value' should be accepted." );
		}
	}

	/**
	 * Test that the access parameter defaults to 'everybody'.
	 */
	public function test_access_param_defaults_to_everybody() {
		$routes     = $this->server->get_routes();
		$route_data = $routes['/wpcom/v2/email-preview'];
		$args       = $route_data[0]['args'];

		$this->assertSame( 'everybody', $args['access']['default'] );
	}
}
