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
		unset( $GLOBALS['submenu']['jetpack'] );
		wp_set_current_user( 0 );
		parent::tearDown();
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
	 * The submenu is added when nothing else has registered it.
	 */
	public function test_registers_podcast_submenu() {
		Admin_Page::add_wp_admin_submenu();

		$this->assertSame( 1, $this->count_podcast_submenus() );
	}

	/**
	 * A second call (e.g. from wpcom-admin-menu.php) must not duplicate the entry.
	 */
	public function test_does_not_duplicate_existing_submenu() {
		Admin_Page::add_wp_admin_submenu();
		$this->assertSame( 1, $this->count_podcast_submenus() );

		Admin_Page::add_wp_admin_submenu();
		$this->assertSame( 1, $this->count_podcast_submenus() );
	}
}
