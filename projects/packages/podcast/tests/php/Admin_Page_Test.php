<?php
/**
 * Tests for the Podcast admin page menu registration.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Constants;
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
	}

	protected function tearDown(): void {
		Constants::clear_constants();
		remove_all_actions( 'admin_menu' );
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
	 * Self-hosted has no wpcom-admin-menu.php, so the package registers the submenu.
	 */
	public function test_init_registers_submenu_on_self_hosted() {
		Admin_Page::init();

		$this->assertSame(
			999999,
			has_action( 'admin_menu', array( Admin_Page::class, 'add_wp_admin_submenu' ) )
		);
	}

	/**
	 * Simple owns the submenu via wpcom-admin-menu.php, so the package must not duplicate it.
	 */
	public function test_init_does_not_register_submenu_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		Admin_Page::init();

		$this->assertFalse(
			has_action( 'admin_menu', array( Admin_Page::class, 'add_wp_admin_submenu' ) )
		);
	}
}
