<?php
/**
 * Tests for which requests Newsletter Mode considers its own.
 *
 * `Mode_Flag_Test` covers whether the mode is on at all. These cover the two
 * request-scoping helpers that answer "is this request the mode's?" — the
 * predicates every later surface (the menu takeover, the mode header, the nav
 * marking) gates itself on.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use Automattic\Jetpack\Newsletter\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The mode scopes itself to the Newsletter page, its own pages, and marked core screens.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode
 */
#[CoversClass( Mode::class )]
class Mode_Surface_Test extends BaseTestCase {

	/**
	 * Original GET params.
	 *
	 * @var array
	 */
	private $original_get;

	/**
	 * Original pagenow value.
	 *
	 * @var string|null
	 */
	private $original_pagenow;

	/**
	 * Original current screen.
	 *
	 * @var mixed
	 */
	private $original_current_screen;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_get            = $_GET;
		$this->original_pagenow        = $GLOBALS['pagenow'] ?? null;
		$this->original_current_screen = $GLOBALS['current_screen'] ?? null;

		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );
		update_option( Mode::OPTION_NAME, true );
		$this->set_admin_request();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		$_GET = $this->original_get;

		if ( null === $this->original_pagenow ) {
			unset( $GLOBALS['pagenow'] );
		} else {
			$GLOBALS['pagenow'] = $this->original_pagenow;
		}

		if ( null === $this->original_current_screen ) {
			unset( $GLOBALS['current_screen'] );
		} else {
			$GLOBALS['current_screen'] = $this->original_current_screen;
		}

		remove_filter( 'jetpack_newsletter_mode_available', '__return_true' );
		delete_option( Mode::OPTION_NAME );

		parent::tear_down();
	}

	/**
	 * Put the test request in wp-admin.
	 *
	 * @param string $pagenow Current admin script.
	 */
	private function set_admin_request( $pagenow = 'admin.php' ) {
		set_current_screen( 'dashboard' );
		$GLOBALS['pagenow'] = $pagenow;
		$_GET               = array();
	}

	/**
	 * Put the test request on a specific admin page.
	 *
	 * @param string $page Page slug.
	 */
	private function visit_admin_page( $page ) {
		$this->set_admin_request();
		$_GET['page'] = $page;
	}

	/**
	 * The unified Newsletter page is active, but an unrelated admin page is not.
	 */
	public function test_active_for_request_matches_newsletter_settings_page() {
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		$this->assertTrue( Mode::is_active_for_request() );

		$this->visit_admin_page( 'jetpack' );

		$this->assertFalse( Mode::is_active_for_request() );

		set_current_screen( 'front' );
		$_GET['page'] = Settings::ADMIN_PAGE_SLUG;

		$this->assertFalse( Mode::is_active_for_request() );
	}

	/**
	 * Nothing is a mode surface while the mode is switched off.
	 */
	public function test_no_surface_matches_while_the_mode_is_off() {
		delete_option( Mode::OPTION_NAME );

		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );

		$this->assertFalse( Mode::is_active_for_request() );
		$this->assertFalse( Mode::is_mode_surface() );
	}

	/**
	 * Mode surfaces are the two package pages plus marked Posts and Comments.
	 */
	public function test_mode_surface_matches_own_pages_and_marked_core_screens() {
		$this->visit_admin_page( Settings::ADMIN_PAGE_SLUG );
		$this->assertTrue( Mode::is_mode_surface() );

		$this->visit_admin_page( Mode::PAGE_DASHBOARD );
		$this->assertTrue( Mode::is_mode_surface() );

		$this->set_admin_request( 'edit.php' );
		$this->assertFalse( Mode::is_mode_surface() );

		$_GET[ Mode::NAV_QUERY_ARG ] = 1;
		$this->assertTrue( Mode::is_mode_surface() );

		$this->set_admin_request( 'edit-comments.php' );
		$_GET[ Mode::NAV_QUERY_ARG ] = 1;
		$this->assertTrue( Mode::is_mode_surface() );
	}
}
