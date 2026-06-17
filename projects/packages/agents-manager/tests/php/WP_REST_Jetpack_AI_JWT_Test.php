<?php
/**
 * WP_REST_Jetpack_AI_JWT Tests File
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../src/class-wp-rest-jetpack-ai-jwt.php';

/**
 * Class WP_REST_Jetpack_AI_JWT_Test
 *
 * @covers \Automattic\Jetpack\Agents_Manager\WP_REST_Jetpack_AI_JWT
 */
#[CoversClass( WP_REST_Jetpack_AI_JWT::class )]
class WP_REST_Jetpack_AI_JWT_Test extends \WorDBless\BaseTestCase {

	/**
	 * The controller instance.
	 *
	 * @var WP_REST_Jetpack_AI_JWT
	 */
	private $controller;

	/**
	 * Connected user ID used for JWT API tests.
	 *
	 * @var int
	 */
	private $connected_user_id;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$this->controller = new WP_REST_Jetpack_AI_JWT();
	}

	/**
	 * Sets up a connected user for JWT API tests.
	 */
	private function set_up_connected_user() {
		$this->connected_user_id = wp_insert_user(
			array(
				'user_login' => 'jwt_api_user',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $this->connected_user_id );

		\Jetpack_Options::update_option(
			'user_tokens',
			array( $this->connected_user_id => 'test.token.' . $this->connected_user_id )
		);
		\Jetpack_Options::update_option( 'id', 12345 );
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );
		remove_all_filters( 'pre_http_request' );

		parent::tear_down();
	}

	/**
	 * Tests that the constructor sets the correct namespace.
	 */
	public function test_constructor_sets_correct_namespace() {
		$reflection = new \ReflectionClass( $this->controller );
		$property   = $reflection->getProperty( 'namespace' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}

		$this->assertEquals( 'jetpack/v4', $property->getValue( $this->controller ) );
	}

	/**
	 * Tests that the constructor sets the correct rest_base.
	 */
	public function test_constructor_sets_correct_rest_base() {
		$reflection = new \ReflectionClass( $this->controller );
		$property   = $reflection->getProperty( 'rest_base' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}

		$this->assertEquals( '/jetpack-ai-jwt', $property->getValue( $this->controller ) );
	}

	/**
	 * Tests that register_rest_route registers the expected routes.
	 */
	public function test_register_rest_route_registers_routes() {
		$this->controller->register_rest_route();

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/jetpack/v4/jetpack-ai-jwt', $routes );

		$route_data = $routes['/jetpack/v4/jetpack-ai-jwt'];
		$methods    = array();

		foreach ( $route_data as $endpoint ) {
			if ( isset( $endpoint['methods'] ) ) {
				$methods = array_merge( $methods, array_keys( $endpoint['methods'] ) );
			}
		}

		$this->assertContains( 'POST', $methods );
	}

	/**
	 * Tests that the endpoint uses the controller permission callback.
	 */
	public function test_endpoint_uses_permission_callback() {
		$this->controller->register_rest_route();

		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/jetpack/v4/jetpack-ai-jwt'];

		$post_endpoint = null;
		foreach ( $route_data as $endpoint ) {
			if ( isset( $endpoint['methods']['POST'] ) && $endpoint['methods']['POST'] ) {
				$post_endpoint = $endpoint;
				break;
			}
		}

		$this->assertNotNull( $post_endpoint );
		$this->assertEquals( array( $this->controller, 'permission_callback' ), $post_endpoint['permission_callback'] );
	}

	/**
	 * Tests that register_rest_route does not register a duplicate route.
	 */
	public function test_register_rest_route_does_not_register_duplicate_route() {
		$this->controller->register_rest_route();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Intentionally calling twice to ensure duplicates are not registered.
		$this->controller->register_rest_route();

		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/jetpack/v4/jetpack-ai-jwt'];

		$this->assertCount( 1, $route_data );
	}

	/**
	 * Tests that the controller extends WP_REST_Controller.
	 */
	public function test_controller_extends_wp_rest_controller() {
		$this->assertInstanceOf( \WP_REST_Controller::class, $this->controller );
	}

	/**
	 * Tests that permission_callback returns false when the user is not connected.
	 */
	public function test_permission_callback_returns_false_when_user_not_connected() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jwt_editor',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$this->assertFalse( $this->controller->permission_callback() );
	}

	/**
	 * Tests that permission_callback returns false when the user cannot edit posts.
	 */
	public function test_permission_callback_returns_false_when_user_cannot_edit_posts() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jwt_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );

		$this->assertFalse( $this->controller->permission_callback() );
	}

	/**
	 * Tests that permission_callback returns true when the user is connected and can edit posts.
	 */
	public function test_permission_callback_returns_true_when_user_connected_and_can_edit_posts() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jwt_connected_editor',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'test.token.' . $user_id ) );

		$this->assertTrue( $this->controller->permission_callback() );
	}

	/**
	 * Tests that get_jwt returns the token and blog ID on success.
	 */
	public function test_get_jwt_returns_token_and_blog_id_on_success() {
		$this->set_up_connected_user();

		add_filter( 'pre_http_request', array( $this, 'mock_jwt_api_success' ), 10, 3 );

		$response = $this->controller->get_jwt();

		remove_filter( 'pre_http_request', array( $this, 'mock_jwt_api_success' ), 10 );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertEquals(
			array(
				'token'   => 'test-jwt-token',
				'blog_id' => 12345,
			),
			$response->get_data()
		);
	}

	/**
	 * Tests that get_jwt returns an error when WPCOM does not return a token.
	 */
	public function test_get_jwt_returns_error_when_no_token_in_response() {
		$this->set_up_connected_user();

		add_filter( 'pre_http_request', array( $this, 'mock_jwt_api_missing_token' ), 10, 3 );

		$response = $this->controller->get_jwt();

		remove_filter( 'pre_http_request', array( $this, 'mock_jwt_api_missing_token' ), 10 );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertEquals( 'no-token', $response->get_error_code() );
	}

	/**
	 * Tests that get_jwt returns a WP_Error when the HTTP request fails.
	 */
	public function test_get_jwt_returns_wp_error_when_request_fails() {
		$this->set_up_connected_user();

		add_filter( 'pre_http_request', array( $this, 'mock_jwt_api_error' ), 10, 3 );

		$response = $this->controller->get_jwt();

		remove_filter( 'pre_http_request', array( $this, 'mock_jwt_api_error' ), 10 );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertEquals( 'http_request_failed', $response->get_error_code() );
	}

	/**
	 * Mock a successful JWT API response.
	 *
	 * @param false|array|\WP_Error $response The preemptive HTTP response.
	 * @param array                 $args     HTTP request arguments.
	 * @param string                $url      The request URL.
	 * @return false|array|\WP_Error
	 */
	public function mock_jwt_api_success( $response, $args, $url ) {
		if ( strpos( $url, '/jetpack-openai-query/jwt' ) === false ) {
			return $response;
		}

		return array(
			'body'     => wp_json_encode( array( 'token' => 'test-jwt-token' ), JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Mock a JWT API response without a token.
	 *
	 * @param false|array|\WP_Error $response The preemptive HTTP response.
	 * @param array                 $args     HTTP request arguments.
	 * @param string                $url      The request URL.
	 * @return false|array|\WP_Error
	 */
	public function mock_jwt_api_missing_token( $response, $args, $url ) {
		if ( strpos( $url, '/jetpack-openai-query/jwt' ) === false ) {
			return $response;
		}

		return array(
			'body'     => wp_json_encode( array(), JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Mock a failed JWT API response.
	 *
	 * @param false|array|\WP_Error $response The preemptive HTTP response.
	 * @param array                 $args     HTTP request arguments.
	 * @param string                $url      The request URL.
	 * @return false|array|\WP_Error
	 */
	public function mock_jwt_api_error( $response, $args, $url ) {
		if ( strpos( $url, '/jetpack-openai-query/jwt' ) === false ) {
			return $response;
		}

		return new \WP_Error( 'http_request_failed', 'Connection failed' );
	}
}
