<?php
/**
 * WordPress Versions Endpoint Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class WordPressVersionsEndpointTest.
 */
class WordPressVersionsEndpointTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tests that the route is registered under the wpcomsh/v1 namespace.
	 */
	public function test_route_is_registered() {
		$this->assertArrayHasKey( '/wpcomsh/v1/wordpress-versions', rest_get_server()->get_routes() );
	}

	/**
	 * Tests that only users who can manage the site get the versions.
	 *
	 * @param string $role     Role of the current user.
	 * @param bool   $expected Whether the user gets the versions.
	 * @dataProvider role_provider
	 */
	#[DataProvider( 'role_provider' )]
	public function test_permission_requires_manage_options( $role, $expected ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );

		$this->assertSame( $expected, wpcomsh_rest_api_wordpress_versions_permission() );
	}

	/**
	 * Data provider for test_permission_requires_manage_options.
	 *
	 * @return array
	 */
	public static function role_provider() {
		return array(
			'administrator' => array( 'administrator', true ),
			'editor'        => array( 'editor', false ),
		);
	}
}
