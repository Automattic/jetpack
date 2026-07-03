<?php
/**
 * @package automattic/jetpack-menu-badges
 */

namespace Automattic\Jetpack\Menu_Badges;

use PHPUnit\Framework\TestCase;

class Menu_Renderer_Test extends TestCase {

	protected function tearDown(): void {
		Notification_Counts::reset();
		unset( $GLOBALS['menu'], $GLOBALS['submenu'] );
		parent::tearDown();
	}

	private function seed_menu() {
		// Mimic the Jetpack top-level menu + a Forms submenu item.
		$GLOBALS['menu']    = array(
			3 => array( 'Jetpack', 'jetpack_admin_page', 'jetpack' ),
		);
		$GLOBALS['submenu'] = array(
			'jetpack' => array(
				array( 'Forms', 'edit_pages', 'jetpack-forms-responses-wp-admin' ),
				array( 'Protect', 'manage_options', 'jetpack-protect' ),
			),
		);
	}

	public function test_renders_submenu_and_total_badges() {
		$this->seed_menu();
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 15,
			)
		);
		Notification_Counts::register(
			'protect',
			array(
				'menu_slug' => 'jetpack-protect',
				'count'     => 1,
			)
		);

		Menu_Renderer::render();

		$this->assertStringContainsString( 'count-15', $GLOBALS['submenu']['jetpack'][0][0] );
		$this->assertStringContainsString( 'data-jp-menu-count="15"', $GLOBALS['submenu']['jetpack'][0][0] );
		$this->assertStringContainsString( 'count-1', $GLOBALS['submenu']['jetpack'][1][0] );
		// Top-level total = 15 + 1 = 16.
		$this->assertStringContainsString( 'count-16', $GLOBALS['menu'][3][0] );
		$this->assertStringContainsString( 'data-jp-menu-badge-total="1"', $GLOBALS['menu'][3][0] );
	}

	public function test_no_badges_when_registry_empty() {
		$this->seed_menu();
		Menu_Renderer::render();
		$this->assertSame( 'Jetpack', $GLOBALS['menu'][3][0] );
		$this->assertSame( 'Forms', $GLOBALS['submenu']['jetpack'][0][0] );
	}

	public function test_render_is_idempotent() {
		$this->seed_menu();
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 15,
			)
		);
		Menu_Renderer::render();
		Menu_Renderer::render();
		// Only one badge on the Forms item.
		$this->assertSame( 1, substr_count( $GLOBALS['submenu']['jetpack'][0][0], 'menu-counter' ) );
		$this->assertSame( 1, substr_count( $GLOBALS['menu'][3][0], 'menu-counter' ) );
	}
}
