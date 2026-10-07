<?php
/**
 * Tests for the launch button's `back_to` value.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launch-button/index.php';

/**
 * Exercises wpcom_get_launch_button_back_to(), which tells Calypso the screen the launch flow's Back
 * button should return to.
 */
class Launch_Button_Back_To_Test extends \WorDBless\BaseTestCase {

	/**
	 * Original $_SERVER value, restored after each test.
	 *
	 * @var array
	 */
	private $original_server;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_server = $_SERVER;
	}

	/**
	 * Restore globals touched by the tests.
	 */
	public function tear_down() {
		$_SERVER = $this->original_server;

		parent::tear_down();
	}

	/**
	 * The current screen is returned as an https URL, query args included.
	 */
	public function test_returns_the_current_screen() {
		$_SERVER['HTTP_HOST']   = 'example.wordpress.com';
		$_SERVER['REQUEST_URI'] = '/wp-admin/post.php?post=1&action=edit';

		$this->assertSame(
			'https://example.wordpress.com/wp-admin/post.php?post=1&action=edit',
			wpcom_get_launch_button_back_to()
		);
	}

	/**
	 * Without a request host there is no screen to return to, so it falls back to the admin root.
	 */
	public function test_falls_back_to_the_admin_root_without_a_host() {
		unset( $_SERVER['HTTP_HOST'] );

		$this->assertSame( admin_url(), wpcom_get_launch_button_back_to() );
	}
}
