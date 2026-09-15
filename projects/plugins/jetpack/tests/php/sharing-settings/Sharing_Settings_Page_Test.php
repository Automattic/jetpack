<?php
/**
 * Tests for the Settings > Sharing screen registration.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WP_UnitTestCase;

/**
 * The screen exists whichever modules are active. That is the guarantee this
 * class was written for, and the one the old per-module registration could not
 * make: with sharedaddy, likes and comment-likes all off, there was no screen.
 *
 * @covers \Automattic\Jetpack\Plugin\Sharing_Settings\Sharing_Settings_Page
 */
#[CoversClass( Sharing_Settings_Page::class )]
class Sharing_Settings_Page_Test extends WP_UnitTestCase {

	/**
	 * Reset the module list and the menu globals between cases.
	 */
	public function tear_down() {
		global $submenu, $_registered_pages;

		Jetpack_Options::delete_option( 'active_modules' );
		remove_all_actions( 'admin_menu' );

		$submenu           = array();
		$_registered_pages = array();

		parent::tear_down();
	}

	/**
	 * @return array<string, array{0: string[]}>
	 */
	public static function provide_module_states(): array {
		return array(
			'nothing active'    => array( array() ),
			'sharing only'      => array( array( 'sharedaddy' ) ),
			'likes only'        => array( array( 'likes' ) ),
			'comment likes'     => array( array( 'comment-likes' ) ),
			'sharing and likes' => array( array( 'sharedaddy', 'likes' ) ),
		);
	}

	/**
	 * Registers the submenu itself, rather than asserting that `init()` hooked
	 * the callback it unconditionally hooks: the tautology this replaces could
	 * not have failed for any module state.
	 *
	 * @param string[] $modules Modules to mark active.
	 * @dataProvider provide_module_states
	 */
	#[DataProvider( 'provide_module_states' )]
	public function test_registers_the_menu_whatever_is_active( array $modules ): void {
		global $submenu;

		Jetpack_Options::update_option( 'active_modules', $modules );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		Sharing_Settings_Page::register_menu();

		$slugs = wp_list_pluck( $submenu['options-general.php'] ?? array(), 2 );

		$this->assertContains( Sharing_Settings_Page::SLUG, $slugs );
	}

	/**
	 * Registering unconditionally must not mean registering for everyone.
	 */
	public function test_does_not_register_for_users_without_the_capability(): void {
		global $submenu;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		Sharing_Settings_Page::register_menu();

		$slugs = wp_list_pluck( $submenu['options-general.php'] ?? array(), 2 );

		$this->assertNotContains( Sharing_Settings_Page::SLUG, $slugs );
	}
}
