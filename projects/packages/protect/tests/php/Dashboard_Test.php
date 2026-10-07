<?php
/**
 * Tests for the Protect dashboard.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Test extends BaseTestCase {

	/**
	 * Start from an empty menu queue and no init() options.
	 */
	public function set_up() {
		parent::set_up();
		Admin_Menu::reset();
		Dashboard::init();
	}

	/**
	 * Leave no queued items or hooks behind.
	 */
	public function tear_down() {
		Admin_Menu::reset();
		remove_all_actions( 'admin_menu' );
		foreach ( array( 'jetpack_page_', 'admin_page_' ) as $prefix ) {
			remove_all_actions( 'load-' . $prefix . Dashboard::MENU_SLUG );
			remove_all_actions( 'load-' . $prefix . Dashboard::MENU_SLUG . '-network' );
		}
		parent::tear_down();
	}

	/**
	 * Queue an item on the Protect slug, as the Jetpack Protect plugin does.
	 */
	private function register_plugin_item() {
		Admin_Menu::add_menu( 'Protect', 'Protect', 'manage_options', Dashboard::MENU_SLUG, '__return_null' );
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

		Dashboard::add_menu();

		$item = Admin_Menu::remove_menu( Dashboard::MENU_SLUG );
		$this->assertIsArray( $item );
		$this->assertSame( array( Dashboard::class, 'render' ), $item['function'] );
		$this->assertFalse( Admin_Menu::remove_menu( Dashboard::MENU_SLUG ) );
	}

	public function test_init_announces_the_dashboard() {
		$this->assertGreaterThan( 0, did_action( 'jetpack_protect_dashboard_initialized' ) );
	}

	public function test_add_menu_runs_before_admin_menu_registers_its_items() {
		$priority = has_action( 'admin_menu', array( Dashboard::class, 'add_menu' ) );
		$this->assertIsInt( $priority );
		$this->assertLessThan( 1000, $priority );
	}

	public function test_add_menu_passes_the_init_options_to_the_item() {
		Dashboard::init( array( 'module' => 'protect-dashboard' ) );

		Dashboard::add_menu();

		$item = Admin_Menu::remove_menu( Dashboard::MENU_SLUG );
		$this->assertSame( 'protect-dashboard', $item['args']['module'] );
	}

	/**
	 * Both names core can give the page.
	 *
	 * @return array[]
	 */
	public static function provide_load_hooks() {
		return array(
			array( 'load-jetpack_page_' . Dashboard::MENU_SLUG ),
			array( 'load-admin_page_' . Dashboard::MENU_SLUG ),
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

		Dashboard::add_menu();

		$this->assertFalse( has_action( $hook, '__return_null' ) );
		// Admin_Menu::add_menu() puts its own callback back for the new item.
		$this->assertNotFalse( has_action( $hook, array( Admin_Menu::class, 'hide_core_admin_notices' ) ) );
	}

	public function test_render_says_so_when_the_build_is_missing() {
		if ( function_exists( Dashboard::RENDER_FUNCTION ) ) {
			$this->markTestSkipped( 'Needs the wp-build output not to be loaded.' );
		}

		ob_start();
		Dashboard::render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'could not be loaded because its assets are missing', $output );
	}
}
