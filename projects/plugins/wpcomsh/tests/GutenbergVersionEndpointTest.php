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
	 * Tests that the permission callback denies access when the sticker is not applied.
	 */
	public function test_permission_denied_without_sticker() {
		Atomic_Persistent_Data::delete( 'site_sticker_gutenberg-version-endpoint' );

		$this->assertFalse( wpcomsh_rest_api_gutenberg_version_permission() );
	}

	/**
	 * Tests that the permission callback grants access when the sticker is applied.
	 */
	public function test_permission_granted_with_sticker() {
		Atomic_Persistent_Data::set( 'site_sticker_gutenberg-version-endpoint', true );

		$this->assertTrue( wpcomsh_rest_api_gutenberg_version_permission() );

		// Cleanup.
		Atomic_Persistent_Data::delete( 'site_sticker_gutenberg-version-endpoint' );
	}
}
