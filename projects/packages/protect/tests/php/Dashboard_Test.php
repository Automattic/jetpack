<?php
/**
 * Tests for the Protect dashboard.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
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
		remove_all_actions( 'admin_enqueue_scripts' );
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

	/**
	 * Build indexes that can't render the page.
	 *
	 * @return array[]
	 */
	public static function provide_unusable_builds() {
		return array(
			'no build'    => array( __DIR__ . '/fixtures/missing-build.php' ),
			'stale build' => array( __DIR__ . '/fixtures/stale-build.php' ),
		);
	}

	/**
	 * @dataProvider provide_unusable_builds
	 *
	 * @param string $build_index Path to the build index.
	 */
	#[DataProvider( 'provide_unusable_builds' )]
	public function test_load_wp_build_leaves_core_scripts_alone_without_a_usable_build( $build_index ) {
		$this->assertFalse( Dashboard::load_wp_build( $build_index ) );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Dashboard::class, 'enqueue_i18n_loader' ) ) );
		$this->assertNotContains( 'jetpack-protect', array_merge( array(), ...array_values( WP_Build_Polyfills::get_consumers() ) ) );
	}

	public function test_restore_screen_id_undoes_the_alias() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'jetpack_page_jetpack-protect' );

		Dashboard::alias_screen_id();
		$this->assertSame( Dashboard::WP_BUILD_PAGE_ID, get_current_screen()->id );

		Dashboard::restore_screen_id();
		$this->assertSame( 'jetpack_page_jetpack-protect', get_current_screen()->id );
	}
}
