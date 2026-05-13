<?php
/**
 * Tests for Jetpack_Application_Password_Extras class
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/Jetpack_REST_TestCase.php';
require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-application-password-extras.php';

/**
 * Class Jetpack_Application_Password_Extras_Test
 *
 * @covers \Jetpack_Application_Password_Extras
 */
#[CoversClass( Jetpack_Application_Password_Extras::class )]
class Jetpack_Application_Password_Extras_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

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
	}

	/**
	 * Tear down the environment after a test.
	 */
	public function tear_down() {
		parent::tear_down();
		unset( $_REQUEST['action'] );
		unset( $GLOBALS['wp_current_filter'] );
	}

	/**
	 * Test that init method registers the hook correctly.
	 */
	public function test_init_registers_hook() {
		remove_all_filters( 'application_password_is_api_request' );
		Jetpack_Application_Password_Extras::init();

		$this->assertNotFalse(
			has_filter( 'application_password_is_api_request', array( 'Jetpack_Application_Password_Extras', 'application_password_extras' ) ),
			'Hook should be registered'
		);
	}

	/**
	 * Test that non-matching requests preserve original false value.
	 */
	public function test_non_matching_request_preserves_original_false_value() {
		set_current_screen( 'dashboard' );

		$result = Jetpack_Application_Password_Extras::application_password_extras( false );
		$this->assertFalse( $result, 'Should preserve false when not in matching context' );
	}

	/**
	 * Test that non-matching requests preserve original true value.
	 */
	public function test_non_matching_request_preserves_original_true_value() {
		set_current_screen( 'dashboard' );

		$result = Jetpack_Application_Password_Extras::application_password_extras( true );
		$this->assertTrue( $result, 'Should preserve true when not in matching context' );
	}

	/**
	 * Test that a VideoPress AJAX action is allowed.
	 */
	public function test_videopress_ajax_action_allowed() {
		set_current_screen( 'dashboard' );
		add_filter( 'wp_doing_ajax', '__return_true' );
		$_REQUEST['action'] = 'videopress-get-upload-token';

		$result = Jetpack_Application_Password_Extras::application_password_extras( false );

		remove_filter( 'wp_doing_ajax', '__return_true' );

		$this->assertTrue( $result, 'VideoPress action should be allowed' );
	}

	/**
	 * Test that a non-VideoPress AJAX action is NOT allowed.
	 */
	public function test_non_videopress_ajax_action_not_allowed() {
		set_current_screen( 'dashboard' );
		add_filter( 'wp_doing_ajax', '__return_true' );
		$_REQUEST['action'] = 'heartbeat';

		$result = Jetpack_Application_Password_Extras::application_password_extras( false );

		remove_filter( 'wp_doing_ajax', '__return_true' );

		$this->assertFalse( $result, 'Non-VideoPress action should NOT be allowed' );
	}

	/**
	 * Test that AJAX request with empty action is NOT allowed.
	 */
	public function test_ajax_request_with_empty_action_not_allowed() {
		set_current_screen( 'dashboard' );
		add_filter( 'wp_doing_ajax', '__return_true' );
		$_REQUEST['action'] = '';

		$result = Jetpack_Application_Password_Extras::application_password_extras( false );

		remove_filter( 'wp_doing_ajax', '__return_true' );

		$this->assertFalse( $result, 'AJAX request with empty action should NOT be allowed' );
	}

	/**
	 * Test that AJAX request with no action set is NOT allowed.
	 */
	public function test_ajax_request_with_no_action_not_allowed() {
		set_current_screen( 'dashboard' );
		add_filter( 'wp_doing_ajax', '__return_true' );
		unset( $_REQUEST['action'] );

		$result = Jetpack_Application_Password_Extras::application_password_extras( false );

		remove_filter( 'wp_doing_ajax', '__return_true' );

		$this->assertFalse( $result, 'AJAX request with no action should NOT be allowed' );
	}

	/**
	 * Test that get_abilities returns all expected abilities.
	 */
	public function test_get_abilities_complete() {
		$abilities = Jetpack_Application_Password_Extras::get_abilities();

		$expected_abilities = array(
			'admin-ajax' => true,
		);

		$this->assertEquals( $expected_abilities, $abilities, 'get_abilities should return all expected abilities' );
	}
}
