<?php
/**
 * Gutenberg Version Endpoint Test file.
 *
 * @package wpcomsh
 */

/**
 * Class GutenbergVersionEndpointTest.
 */
class GutenbergVersionEndpointTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tests that the route is registered under the wpcomsh/v1 namespace.
	 */
	public function test_route_is_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcomsh/v1/gutenberg-version', $routes );
	}

	/**
	 * Tests that the callback returns a WP_REST_Response with a version key.
	 */
	public function test_callback_returns_version_payload() {
		if ( ! defined( 'GUTENBERG_VERSION' ) ) {
			define( 'GUTENBERG_VERSION', '99.9.9-test' );
		}

		$response = wpcomsh_rest_api_gutenberg_version();

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'version' => GUTENBERG_VERSION ), $response->get_data() );
	}

	/**
	 * Tests that the permission callback denies access when the option is not set.
	 */
	public function test_permission_denied_without_option() {
		delete_option( 'wpcomsh_expose_gutenberg_version' );

		$this->assertFalse( wpcomsh_rest_api_gutenberg_version_permission() );
	}

	/**
	 * Tests that the permission callback grants access when the option is enabled.
	 */
	public function test_permission_granted_with_option() {
		update_option( 'wpcomsh_expose_gutenberg_version', 1 );

		$this->assertTrue( wpcomsh_rest_api_gutenberg_version_permission() );

		// Cleanup.
		delete_option( 'wpcomsh_expose_gutenberg_version' );
	}

	/**
	 * Tests that responses for this endpoint get a Cache-Control: no-cache header.
	 */
	public function test_nocache_header_added_for_endpoint() {
		$response = new WP_REST_Response();
		$request  = new WP_REST_Request( 'GET', '/wpcomsh/v1/gutenberg-version' );

		$result = wpcomsh_rest_api_gutenberg_version_nocache( $response, rest_get_server(), $request );

		$this->assertStringContainsString( 'no-cache', $result->get_headers()['Cache-Control'] );
	}

	/**
	 * Tests that responses for other endpoints are not touched.
	 */
	public function test_nocache_header_not_added_for_other_routes() {
		$response = new WP_REST_Response();
		$request  = new WP_REST_Request( 'GET', '/wp/v2/posts' );

		$result = wpcomsh_rest_api_gutenberg_version_nocache( $response, rest_get_server(), $request );

		$this->assertArrayNotHasKey( 'Cache-Control', $result->get_headers() );
	}
}
