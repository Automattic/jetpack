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
	 * Tests that only users who can manage the site get the versions.
	 *
	 * @param string $role            Role of the current user.
	 * @param int    $expected_status Expected response status.
	 * @dataProvider role_provider
	 */
	#[DataProvider( 'role_provider' )]
	public function test_endpoint_requires_manage_options( $role, $expected_status ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wpcomsh/v1/wordpress-versions' ) );

		$this->assertSame( $expected_status, $response->get_status() );
	}

	/**
	 * Data provider for test_endpoint_requires_manage_options.
	 *
	 * @return array
	 */
	public static function role_provider() {
		return array(
			'administrator' => array( 'administrator', 200 ),
			'editor'        => array( 'editor', 403 ),
		);
	}
}
