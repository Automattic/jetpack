<?php
/**
 * Test Jetpack Application Password Android CORS functionality.
 *
 * @package jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/Jetpack_REST_TestCase.php';
require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-application-password-extras.php';

/**
 * Test class for Android CORS headers.
 *
 * @covers \Jetpack_Application_Password_Extras
 */
#[CoversClass( Jetpack_Application_Password_Extras::class )]
class Jetpack_Application_Password_Android_CORS_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Original server globals backup.
	 *
	 * @var array
	 */
	private $server_backup = array();

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( static::$user_id );
		$this->server_backup = $_SERVER;
		Jetpack_Application_Password_Extras::init();
	}

	/**
	 * Tear down the environment after a test.
	 */
	public function tear_down() {
		parent::tear_down();
		$_SERVER = $this->server_backup;
		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'ajax_allowed_cors_origins' );
	}

	/**
	 * Test that CORS origin is added with authorization header.
	 */
	public function test_cors_origin_added_with_authorization() {
		$_SERVER['HTTP_ORIGIN']        = 'https://android-app-assets.jetpack.com';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Basic xxxxx';
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertContains( 'https://android-app-assets.jetpack.com', $result, 'Android origin should be added when authorization is present' );
	}

	/**
	 * Test that CORS origin is not added without authorization.
	 */
	public function test_cors_origin_not_added_without_authorization() {
		$_SERVER['HTTP_ORIGIN'] = 'https://android-app-assets.jetpack.com';
		unset( $_SERVER['HTTP_AUTHORIZATION'] );
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertNotContains( 'https://android-app-assets.jetpack.com', $result, 'Android origin should not be added without authorization' );
	}

	/**
	 * Test that CORS origin is added for preflight requests with Authorization header.
	 */
	public function test_cors_origin_added_for_preflight_with_auth() {
		$_SERVER['HTTP_ORIGIN']                         = 'https://android-app-assets.jetpack.com';
		$_SERVER['REQUEST_METHOD']                      = 'OPTIONS';
		$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] = 'Authorization, Content-Type';
		unset( $_SERVER['HTTP_AUTHORIZATION'] );
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertContains( 'https://android-app-assets.jetpack.com', $result, 'Android origin should be added for preflight requests with Authorization header' );
	}

	/**
	 * Test that CORS is not added for preflight requests without Authorization header.
	 */
	public function test_cors_not_added_for_preflight_without_auth() {
		$_SERVER['HTTP_ORIGIN']                         = 'https://android-app-assets.jetpack.com';
		$_SERVER['REQUEST_METHOD']                      = 'OPTIONS';
		$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] = 'Content-Type, X-Requested-With';
		unset( $_SERVER['HTTP_AUTHORIZATION'] );
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertNotContains( 'https://android-app-assets.jetpack.com', $result, 'Android origin should not be added for preflight without Authorization header' );
	}

	/**
	 * Test that CORS is not added outside admin-ajax context.
	 */
	public function test_cors_not_added_outside_admin_ajax() {
		$_SERVER['HTTP_ORIGIN']        = 'https://android-app-assets.jetpack.com';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Basic xxxxx';
		// Not setting admin-ajax context

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertEmpty( $result, 'CORS should not be added outside admin-ajax context' );
	}

	/**
	 * Test that CORS is not added for non-admin context even with wp_doing_ajax.
	 */
	public function test_cors_not_added_for_non_admin_context() {
		$_SERVER['HTTP_ORIGIN']        = 'https://android-app-assets.jetpack.com';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Basic xxxxx';
		add_filter( 'wp_doing_ajax', '__return_true' );
		// Not setting admin screen

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertEmpty( $result, 'CORS should not be added when not in admin context' );
	}

	/**
	 * Test that CORS is not added for different origin.
	 */
	public function test_cors_not_added_for_different_origin() {
		$_SERVER['HTTP_ORIGIN']        = 'https://evil.com';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Basic xxxxx';
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertNotContains( 'https://evil.com', $result, 'Non-allowed origins should not be added' );
	}

	/**
	 * Test that existing allowed origins are preserved.
	 */
	public function test_preserves_existing_allowed_origins() {
		$_SERVER['HTTP_ORIGIN']        = 'https://android-app-assets.jetpack.com';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Basic xxxxx';
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$existing = array( 'https://example.com', 'https://test.com' );
		$result   = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( $existing );

		$this->assertContains( 'https://example.com', $result, 'Existing origins should be preserved' );
		$this->assertContains( 'https://test.com', $result, 'Existing origins should be preserved' );
		$this->assertContains( 'https://android-app-assets.jetpack.com', $result, 'Android origin should be added' );
	}

	/**
	 * Test that duplicate origins are not added.
	 */
	public function test_no_duplicate_origins() {
		$_SERVER['HTTP_ORIGIN']        = 'https://android-app-assets.jetpack.com';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Basic xxxxx';
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$existing = array( 'https://android-app-assets.jetpack.com' );
		$result   = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( $existing );

		$this->assertCount( 1, $result, 'Should not add duplicate origins' );
		$this->assertEquals( array( 'https://android-app-assets.jetpack.com' ), $result );
	}

	/**
	 * Test ajax_allowed_cors_origins filter extensibility.
	 */
	public function test_ajax_allowed_cors_origins_filter_extensibility() {
		add_filter(
			'ajax_allowed_cors_origins',
			function ( $origins ) {
				$origins[] = 'https://custom.origin.com';
				return $origins;
			}
		);

		$_SERVER['HTTP_ORIGIN']        = 'https://custom.origin.com';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Basic xxxxx';
		set_current_screen( 'admin-ajax' );
		add_filter( 'wp_doing_ajax', '__return_true' );

		$result = Jetpack_Application_Password_Extras::allow_ajax_cors_origins( array() );

		$this->assertContains( 'https://custom.origin.com', $result, 'Custom origins added via filter should be allowed' );
	}
}
