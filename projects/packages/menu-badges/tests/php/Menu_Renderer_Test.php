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
		// Submenu badges do NOT get the core `awaiting-mod` class — only `menu-counter`.
		$this->assertStringNotContainsString( 'awaiting-mod', $GLOBALS['submenu']['jetpack'][0][0] );
		$this->assertStringContainsString( 'count-1', $GLOBALS['submenu']['jetpack'][1][0] );
		// Top-level total = 15 + 1 = 16, and it carries the core classes for standard bubble styling.
		$this->assertStringContainsString( 'count-16', $GLOBALS['menu'][3][0] );
		$this->assertStringContainsString( 'awaiting-mod update-plugins menu-counter', $GLOBALS['menu'][3][0] );
		$this->assertStringContainsString( 'data-jp-menu-badge-total="1"', $GLOBALS['menu'][3][0] );
	}

	public function test_no_badges_when_registry_empty() {
		$this->seed_menu();
		Menu_Renderer::render();
		$this->assertSame( 'Jetpack', $GLOBALS['menu'][3][0] );
		$this->assertSame( 'Forms', $GLOBALS['submenu']['jetpack'][0][0] );
	}

	public function test_registered_zero_count_renders_hidden_anchor() {
		$this->seed_menu();
		// A registered-but-zero count still renders an element (hidden), so a later
		// client live-update from 0 to positive has something to reveal.
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 0,
			)
		);

		Menu_Renderer::render();

		$forms_title = $GLOBALS['submenu']['jetpack'][0][0];
		$this->assertStringContainsString( 'data-jp-menu-badge="jetpack-forms-responses-wp-admin"', $forms_title );
		$this->assertStringContainsString( 'count-0', $forms_title );
		$this->assertStringContainsString( 'style="display:none"', $forms_title );

		// The top-level total is present but hidden too (there is a registered entry).
		$total_title = $GLOBALS['menu'][3][0];
		$this->assertStringContainsString( 'data-jp-menu-badge-total="1"', $total_title );
		$this->assertStringContainsString( 'style="display:none"', $total_title );
	}

	public function test_parent_match_prefers_slug_over_capability() {
		// A capability-only row appears before the slug row. The renderer must badge
		// the row whose slug is 'jetpack', not the first capability match.
		$GLOBALS['menu']    = array(
			2 => array( 'Decoy', 'jetpack_admin_page', 'not-jetpack' ),
			5 => array( 'Jetpack', 'read', 'jetpack' ),
		);
		$GLOBALS['submenu'] = array();
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 3,
			)
		);

		Menu_Renderer::render();

		$this->assertSame( 'Decoy', $GLOBALS['menu'][2][0] );
		$this->assertStringContainsString( 'data-jp-menu-badge-total="1"', $GLOBALS['menu'][5][0] );
		$this->assertStringContainsString( 'count-3', $GLOBALS['menu'][5][0] );
	}

	public function test_parent_match_falls_back_to_capability() {
		// No slug row: fall back to the plugin's 'jetpack_admin_page' capability.
		$GLOBALS['menu']    = array(
			4 => array( 'Jetpack', 'jetpack_admin_page', 'jetpack-custom-slug' ),
		);
		$GLOBALS['submenu'] = array();
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 2,
			)
		);

		Menu_Renderer::render();

		$this->assertStringContainsString( 'data-jp-menu-badge-total="1"', $GLOBALS['menu'][4][0] );
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
		// Rendering a second time must be idempotent: strip() removes the prior badge before re-adding.
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Intentional repeat render.
		Menu_Renderer::render();
		// Only one badge on the Forms item.
		$this->assertSame( 1, substr_count( $GLOBALS['submenu']['jetpack'][0][0], 'menu-counter' ) );
		$this->assertSame( 1, substr_count( $GLOBALS['menu'][3][0], 'menu-counter' ) );
	}
}
