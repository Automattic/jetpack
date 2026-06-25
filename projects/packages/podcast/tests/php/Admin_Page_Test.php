<?php
/**
 * Tests for the Podcast admin page menu registration.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Podcast\Admin_Page;
use Automattic\Jetpack\Podcast\Settings;
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
		Constants::clear_constants();
		remove_all_actions( 'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG );
		unset( $GLOBALS['menu'], $GLOBALS['submenu'] );
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Self-hosted: the page registers through the shared Admin_Menu, which sorts
	 * items by position. We assert the page-load callback Admin_Menu wires for us.
	 */
	public function test_registers_via_admin_menu_on_self_hosted() {
		Admin_Page::add_wp_admin_submenu();

		$this->assertNotFalse(
			has_action(
				'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG,
				array( Admin_Page::class, 'admin_init' )
			),
			'Self-hosted should register the page through Admin_Menu'
		);
	}

	/**
	 * WPCOM (Simple/Atomic): registers directly under the Jetpack menu, where
	 * wpcom-admin-menu.php has already created the parent.
	 */
	public function test_registers_directly_under_jetpack_on_wpcom() {
		Constants::set_constant( 'IS_WPCOM', true );

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
			'WPCOM should register the Podcast page directly under the Jetpack menu'
		);
	}

	/**
	 * The host allowlist and max length ride to the dashboard verbatim so PHP
	 * stays the single source of truth for client-side URL validation.
	 */
	public function test_inject_script_data_exposes_show_url_hosts() {
		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertSame( Settings::SHOW_URL_HOSTS, $data['podcast']['show_url_hosts'] );
		$this->assertSame( Settings::SHOW_URL_MAX_LENGTH, $data['podcast']['show_url_max_length'] );
	}

	/**
	 * The mount-time REST responses are preloaded into script data so the first
	 * render serves them from cache instead of the network.
	 */
	public function test_inject_script_data_includes_preload_map() {
		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertArrayHasKey( 'preload', $data['podcast'] );
		$this->assertIsArray( $data['podcast']['preload'] );
	}
}
