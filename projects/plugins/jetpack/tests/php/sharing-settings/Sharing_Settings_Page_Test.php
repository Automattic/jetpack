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
	 * Reset the module list between cases.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( 'active_modules' );
		remove_all_actions( 'admin_menu' );

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
	 * @param string[] $modules Modules to mark active.
	 * @dataProvider provide_module_states
	 */
	#[DataProvider( 'provide_module_states' )]
	public function test_registers_the_menu_whatever_is_active( array $modules ): void {
		Jetpack_Options::update_option( 'active_modules', $modules );

		remove_all_actions( 'admin_menu' );
		Sharing_Settings_Page::init();

		$this->assertNotFalse(
			has_action( 'admin_menu', array( Sharing_Settings_Page::class, 'register_menu' ) )
		);
	}

	/**
	 * The slug is what existing links and bookmarks point at.
	 */
	public function test_keeps_the_sharing_slug(): void {
		$this->assertSame( 'sharing', Sharing_Settings_Page::SLUG );
	}
}
