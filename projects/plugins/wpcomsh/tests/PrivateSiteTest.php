<?php
/**
 * Private Site Test file.
 *
 * @package wpcomsh
 */

/**
 * Class PrivateSiteTest.
 */
class PrivateSiteTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up test environment before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock the AT_PRIVACY_MODEL constant to simulate private site
		if ( ! defined( 'AT_PRIVACY_MODEL' ) ) {
			define( 'AT_PRIVACY_MODEL', 'wp_uploads' );
		}

		// Define constants if not already defined
		if ( ! defined( 'DAY_IN_SECONDS' ) ) {
			define( 'DAY_IN_SECONDS', 86400 );
		}
		if ( ! defined( 'COOKIEHASH' ) ) {
			define( 'COOKIEHASH', 'test_hash' );
		}
		if ( ! defined( 'LOGGED_IN_COOKIE' ) ) {
			define( 'LOGGED_IN_COOKIE', 'wordpress_logged_in_' . COOKIEHASH );
		}
	}

	/**
	 * Test that site_is_private() returns true when AT_PRIVACY_MODEL is set correctly.
	 */
	public function test_site_is_private_returns_true_when_constant_set() {
		$this->assertTrue( \Private_Site\site_is_private() );
	}

	/**
	 * Test get_read_access_cookies with non-existent user.
	 */
	public function test_get_read_access_cookies_with_nonexistent_user() {
		$non_existent_user_id = 99999;

		$result = \Private_Site\get_read_access_cookies( array( $non_existent_user_id, time() + DAY_IN_SECONDS ) );

		$this->assertWPError( $result );
		$this->assertEquals( 'account_not_found', $result->get_error_code() );
	}

	/**
	 * Test that the XML-RPC method is registered correctly.
	 */
	public function test_xmlrpc_method_registration() {
		$methods = array( 'existing.method' => 'some_callback' );

		$result = \Private_Site\register_additional_jetpack_xmlrpc_methods( $methods );

		$this->assertArrayHasKey( 'existing.method', $result );
		$this->assertArrayHasKey( 'jetpack.getClosestThumbnailSizeUrl', $result );
		$this->assertArrayHasKey( 'jetpack.getReadAccessCookies', $result );
		$this->assertEquals( '\Private_Site\get_closest_thumbnail_size_url', $result['jetpack.getClosestThumbnailSizeUrl'] );
		$this->assertEquals( '\Private_Site\get_read_access_cookies', $result['jetpack.getReadAccessCookies'] );
	}

	/**
	 * Test get_closest_thumbnail_size_url with invalid URL.
	 */
	public function test_get_closest_thumbnail_size_url_with_invalid_url() {
		$args = array(
			'url'    => 'https://example.com/nonexistent-image.jpg',
			'width'  => 150,
			'height' => 150,
		);

		$result = \Private_Site\get_closest_thumbnail_size_url( $args );

		$this->assertFalse( $result );
	}

	/**
	 * Test that should_prevent_site_access returns true for unauthenticated users.
	 */
	public function test_should_prevent_site_access_returns_true_for_unauthenticated_users() {
		wp_set_current_user( 0 );

		$this->assertTrue( \Private_Site\should_prevent_site_access() );
	}

	/**
	 * Test that blog_user_can returns false for non-logged-in users.
	 */
	public function test_blog_user_can_returns_false_for_non_logged_in_users() {
		wp_set_current_user( 0 );

		$this->assertFalse( \Private_Site\blog_user_can( 'read' ) );
	}

	/**
	 * Test that is_private_blog_user returns false for non-authenticated users.
	 */
	public function test_is_private_blog_user_returns_false_for_non_authenticated_users() {
		wp_set_current_user( 0 );

		$this->assertFalse( \Private_Site\is_private_blog_user() );
	}
}
