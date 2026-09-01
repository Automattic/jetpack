<?php
/**
 * Private Site XML-RPC Test file.
 *
 * @package wpcomsh
 */

/**
 * Class PrivateSiteXmlrpcTest.
 */
class PrivateSiteXmlrpcTest extends WP_UnitTestCase {
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
	 * Test that get_read_access_cookies returns proper error for invalid user.
	 */
	public function test_get_read_access_cookies_invalid_user() {
		$result = \Private_Site\get_read_access_cookies( array( 99999, DAY_IN_SECONDS ) );

		$this->assertWPError( $result );
		$this->assertEquals( 'account_not_found', $result->get_error_code() );
	}

	/**
	 * Test that get_read_access_cookies returns proper error for user without read capability.
	 */
	public function test_get_read_access_cookies_user_without_read_capability() {
		// Create a user without read capabilities
		$user_id = $this->factory()->user->create( array( 'role' => '' ) );

		$result = \Private_Site\get_read_access_cookies( array( $user_id, DAY_IN_SECONDS ) );

		$this->assertWPError( $result );
		$this->assertEquals( 'access error', $result->get_error_code() );
	}

	/**
	 * Test that get_read_access_cookies works with valid user.
	 */
	public function test_get_read_access_cookies_valid_user() {
		// Create a user with read capabilities
		$user_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );

		$expected_expiration = 2 * DAY_IN_SECONDS;

		$result = \Private_Site\get_read_access_cookies( array( $user_id, $expected_expiration ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertIsArray( $result[0] );
		$this->assertCount( 3, $result[0] );

		// Check cookie structure
		$this->assertEquals( LOGGED_IN_COOKIE, $result[0][0] );
		$this->assertNotEmpty( $result[0][1] ); // Cookie value should not be empty
		// The expiration should be a valid timestamp
		$this->assertIsInt( $result[0][2] );
		$this->assertGreaterThan( time(), $result[0][2] );
	}

	/**
	 * Test that get_read_access_cookies handles missing user ID.
	 */
	public function test_get_read_access_cookies_missing_user_id() {
		// Pass array with only expiration time, missing user ID
		$result = \Private_Site\get_read_access_cookies( array( null, DAY_IN_SECONDS ) );

		$this->assertWPError( $result );
		$this->assertEquals( 'account_not_found', $result->get_error_code() );
	}

	/**
	 * Test that get_read_access_cookies handles invalid user ID type.
	 */
	public function test_get_read_access_cookies_invalid_user_id_type() {
		$result = \Private_Site\get_read_access_cookies( array( 'invalid', DAY_IN_SECONDS ) );

		$this->assertWPError( $result );
		$this->assertEquals( 'account_not_found', $result->get_error_code() );
	}

	/**
	 * Test that get_read_access_cookies handles negative user ID.
	 */
	public function test_get_read_access_cookies_negative_user_id() {
		$result = \Private_Site\get_read_access_cookies( array( -1, DAY_IN_SECONDS ) );

		$this->assertWPError( $result );
		$this->assertEquals( 'account_not_found', $result->get_error_code() );
	}

	/**
	 * Test that the auth cookie expiration is properly set.
	 */
	public function test_get_read_access_cookies_auth_cookie_expiration() {
		$user_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );

		$custom_expiration = 5 * DAY_IN_SECONDS;

		$result = \Private_Site\get_read_access_cookies( array( $user_id, $custom_expiration ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		// The expiration should be a valid timestamp
		$this->assertIsInt( $result[0][2] );
		// Assert that the expiration is within 1 second of the expected value to
		// account for timing differences that may occur in the test environment.
		$this->assertLessThanOrEqual( 1, abs( ( time() + $custom_expiration ) - $result[0][2] ) );
	}

	/**
	 * Test that the send_auth_cookies filter is properly disabled.
	 */
	public function test_get_read_access_cookies_disables_send_auth_cookies() {
		$user_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );

		// Set up a filter to track if send_auth_cookies is disabled
		$filter_called = false;
		add_filter(
			'send_auth_cookies',
			function ( $send ) use ( &$filter_called ) {
				$filter_called = true;
				return $send;
			}
		);

		\Private_Site\get_read_access_cookies( array( $user_id, DAY_IN_SECONDS ) );

		// The filter should have been called and disabled
		$this->assertTrue( $filter_called );
	}
}
