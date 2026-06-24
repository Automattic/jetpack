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
		$this->reset_initialized();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'podcast_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		unset( $GLOBALS['submenu']['jetpack'] );
	}

	protected function tearDown(): void {
		remove_all_actions( 'admin_menu' );
		unset( $GLOBALS['submenu']['jetpack'] );
		wp_set_current_user( 0 );
		$this->reset_initialized();
		parent::tearDown();
	}

	/**
	 * Reset the init guard so each test re-wires `init()`.
	 */
	private function reset_initialized(): void {
		$prop = new \ReflectionProperty( Admin_Page::class, 'initialized' );
		$prop->setValue( null, false );
	}

	/**
	 * Count Podcast entries under the Jetpack menu.
	 */
	private function count_podcast_submenus(): int {
		if ( empty( $GLOBALS['submenu']['jetpack'] ) ) {
			return 0;
		}

		$slugs = array_column( $GLOBALS['submenu']['jetpack'], 2 );
		return count( array_keys( $slugs, Admin_Page::ADMIN_PAGE_SLUG, true ) );
	}

	/**
	 * `init()` always hooks submenu registration onto `admin_menu`.
	 */
	public function test_init_registers_submenu_action() {
		Admin_Page::init();

		$this->assertSame(
			999999,
			has_action( 'admin_menu', array( Admin_Page::class, 'add_wp_admin_submenu' ) )
		);
	}

	/**
	 * The submenu is added when nothing else has registered it.
	 */
	public function test_add_submenu_registers_when_absent() {
		Admin_Page::add_wp_admin_submenu();

		$this->assertSame( 1, $this->count_podcast_submenus() );
	}

	/**
	 * A second call (e.g. from wpcom-admin-menu.php) must not duplicate the entry.
	 */
	public function test_add_submenu_skips_when_already_registered() {
		Admin_Page::add_wp_admin_submenu();
		Admin_Page::add_wp_admin_submenu();

		$this->assertSame( 1, $this->count_podcast_submenus() );
	}
}
