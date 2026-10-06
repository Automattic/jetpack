<?php
/**
 * Tests for the Protect dashboard module.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

// The class file, not the module file: that one hooks `admin_menu` for the rest of the suite.
require_once JETPACK__PLUGIN_DIR . 'modules/protect-dashboard/class-jetpack-protect-dashboard.php';

/**
 * @covers \Jetpack_Protect_Dashboard
 */
#[CoversClass( Jetpack_Protect_Dashboard::class )]
class Jetpack_Protect_Dashboard_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Start from an empty menu queue.
	 */
	public function set_up() {
		parent::set_up();
		Admin_Menu::reset();
	}

	/**
	 * Leave no queued items behind.
	 */
	public function tear_down() {
		Admin_Menu::reset();
		parent::tear_down();
	}

	/**
	 * Queue an item on the Protect slug, as the Jetpack Protect plugin does.
	 */
	private function register_plugin_item() {
		Admin_Menu::add_menu( 'Protect', 'Protect', 'manage_options', Jetpack_Protect_Dashboard::MENU_SLUG, '__return_null' );
	}

	/**
	 * How many items are already queued on the Protect slug.
	 *
	 * @return array[]
	 */
	public static function provide_registered_item_counts() {
		return array(
			'nothing registered'        => array( 0 ),
			'the slug registered twice' => array( 2 ),
		);
	}

	/**
	 * @dataProvider provide_registered_item_counts
	 *
	 * @param int $registered Items already queued on the Protect slug.
	 */
	#[DataProvider( 'provide_registered_item_counts' )]
	public function test_add_menu_leaves_one_item_that_renders_the_dashboard( $registered ) {
		for ( $i = 0; $i < $registered; $i++ ) {
			$this->register_plugin_item();
		}

		Jetpack_Protect_Dashboard::add_menu();

		$item = Admin_Menu::remove_menu( Jetpack_Protect_Dashboard::MENU_SLUG );
		$this->assertIsArray( $item );
		$this->assertSame( array( Jetpack_Protect_Dashboard::class, 'render' ), $item['function'] );
		$this->assertFalse( Admin_Menu::remove_menu( Jetpack_Protect_Dashboard::MENU_SLUG ) );
	}

	/**
	 * Both names core can give the page.
	 *
	 * @return array[]
	 */
	public static function provide_load_hooks() {
		return array(
			array( 'load-jetpack_page_' . Jetpack_Protect_Dashboard::MENU_SLUG ),
			array( 'load-admin_page_' . Jetpack_Protect_Dashboard::MENU_SLUG ),
		);
	}

	/**
	 * @dataProvider provide_load_hooks
	 *
	 * @param string $hook The page's load hook.
	 */
	#[DataProvider( 'provide_load_hooks' )]
	public function test_add_menu_drops_the_callbacks_already_on_the_load_hook( $hook ) {
		$this->register_plugin_item();
		add_action( $hook, '__return_null' );

		Jetpack_Protect_Dashboard::add_menu();

		$this->assertFalse( has_action( $hook, '__return_null' ) );
		// Admin_Menu::add_menu() puts its own callback back for the new item.
		$this->assertNotFalse( has_action( $hook, array( Admin_Menu::class, 'hide_core_admin_notices' ) ) );
	}

	public function test_render_says_so_when_the_build_is_missing() {
		if ( function_exists( 'jetpack_plugin_jetpack_protect_hub_wp_admin_render_page' ) ) {
			$this->markTestSkipped( 'Needs the wp-build output not to be loaded.' );
		}

		$this->assertStringContainsString( 'notice-error', get_echo( array( Jetpack_Protect_Dashboard::class, 'render' ) ) );
	}
}
