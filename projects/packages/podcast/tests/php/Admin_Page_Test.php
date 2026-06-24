<?php
/**
 * Tests for the Podcast admin page menu registration.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Admin_Page;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Admin_Page
 */
#[CoversClass( Admin_Page::class )]
class Admin_Page_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		// WorDBless does not reset the admin menu globals between tests.
		$GLOBALS['menu']    = array();
		$GLOBALS['submenu'] = array();
		remove_all_actions( 'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG );
	}

	protected function tearDown(): void {
		remove_all_actions( 'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG );
		unset( $GLOBALS['menu'], $GLOBALS['submenu'] );
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Self-hosted: the page registers through the shared Admin_Menu, which sorts
	 * items by position. We assert the page-load callback Admin_Menu wires for us.
	 */
	public function test_add_wp_admin_menu_registers_via_admin_menu() {
		Admin_Page::add_wp_admin_menu();

		$this->assertNotFalse(
			has_action(
				'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG,
				array( Admin_Page::class, 'admin_init' )
			),
			'add_wp_admin_menu() should register the page through Admin_Menu'
		);
	}

	/**
	 * WPCOM path: registers directly under the Jetpack menu, as wpcom-admin-menu.php does.
	 */
	public function test_add_wp_admin_submenu_registers_under_jetpack() {
		// add_submenu_page() checks the current user's capability.
		$user_id = wp_insert_user(
			array(
				'user_login' => 'podcast_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		// Provide the Jetpack parent menu wpcom-admin-menu.php would have created.
		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );

		Admin_Page::add_wp_admin_submenu();

		$slugs = wp_list_pluck( (array) ( $GLOBALS['submenu']['jetpack'] ?? array() ), 2 );
		$this->assertContains(
			Admin_Page::ADMIN_PAGE_SLUG,
			$slugs,
			'add_wp_admin_submenu() should register the Podcast page under the Jetpack menu'
		);
	}
}
