<?php
/**
 * Tests for the launch button's `ref` value.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launch-button/index.php';

/**
 * Exercises wpcom_get_launch_button_ref(), which tells Calypso the page the launch flow should
 * return to.
 */
class Launch_Button_Ref_Test extends \WorDBless\BaseTestCase {

	/**
	 * Original $pagenow global value, restored after each test.
	 *
	 * @var string|null
	 */
	private $original_pagenow;

	/**
	 * Original $GLOBALS['current_screen'] value, restored after each test.
	 *
	 * @var WP_Screen|null
	 */
	private $original_current_screen;

	/**
	 * Original $_GET value, restored after each test.
	 *
	 * @var array
	 */
	private $original_get;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		global $pagenow;
		$this->original_pagenow        = $pagenow;
		$this->original_current_screen = $GLOBALS['current_screen'] ?? null;
		$this->original_get            = $_GET;
		$_GET                          = array();
	}

	/**
	 * Restore globals touched by the tests.
	 *
	 * Calling set_current_screen() decides is_admin() for everything that runs afterwards, so
	 * leaving it set here would put unrelated suites in an admin context they never asked for.
	 */
	public function tear_down() {
		global $pagenow;
		$pagenow = $this->original_pagenow;
		$_GET    = $this->original_get;

		if ( $this->original_current_screen === null ) {
			unset( $GLOBALS['current_screen'] );
		} else {
			$GLOBALS['current_screen'] = $this->original_current_screen;
		}

		parent::tear_down();
	}

	/**
	 * On the front end there is no admin screen to return to.
	 */
	public function test_returns_admin_root_on_the_front_end() {
		set_current_screen( 'front' );

		global $pagenow;
		$pagenow = 'index.php';

		$this->assertSame( 'wp-admin', wpcom_get_launch_button_ref() );
	}

	/**
	 * A menu page keeps its `page` arg, so Back lands on the same screen.
	 */
	public function test_keeps_the_page_arg_for_a_menu_screen() {
		set_current_screen( 'dashboard' );

		global $pagenow;
		$pagenow      = 'admin.php';
		$_GET['page'] = 'stats';

		$this->assertSame( 'wp-admin/admin.php?page=stats', wpcom_get_launch_button_ref() );
	}

	/**
	 * An argument-less admin screen resolves to its own file.
	 */
	public function test_resolves_an_argument_less_admin_screen() {
		set_current_screen( 'options-reading' );

		global $pagenow;
		$pagenow = 'options-reading.php';

		$this->assertSame( 'wp-admin/options-reading.php', wpcom_get_launch_button_ref() );
	}

	/**
	 * Screens that need query args we don't replay fall back to the admin root, rather than sending
	 * the user to a screen that errors without them.
	 */
	public function test_falls_back_for_screens_needing_other_query_args() {
		set_current_screen( 'post' );

		global $pagenow;
		$pagenow        = 'post.php';
		$_GET['post']   = '123';
		$_GET['action'] = 'edit';

		$this->assertSame( 'wp-admin', wpcom_get_launch_button_ref() );
	}

	/**
	 * The admin.php file without its `page` arg isn't a screen, so it falls back to the admin root.
	 */
	public function test_falls_back_for_admin_php_without_a_page_arg() {
		set_current_screen( 'dashboard' );

		global $pagenow;
		$pagenow = 'admin.php';

		$this->assertSame( 'wp-admin', wpcom_get_launch_button_ref() );
	}

	/**
	 * A $pagenow that isn't a plain PHP filename is never interpolated into the ref.
	 */
	public function test_rejects_an_unexpected_pagenow() {
		set_current_screen( 'dashboard' );

		global $pagenow;
		$pagenow = '../../evil';

		$this->assertSame( 'wp-admin', wpcom_get_launch_button_ref() );
	}
}
