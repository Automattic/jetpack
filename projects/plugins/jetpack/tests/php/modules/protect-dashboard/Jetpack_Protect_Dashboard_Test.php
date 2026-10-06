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
	 * Start from an empty menu queue and no sections.
	 */
	public function set_up() {
		parent::set_up();
		Admin_Menu::reset();
		self::reset_sections();
	}

	/**
	 * Leave no queued items or sections behind.
	 */
	public function tear_down() {
		Admin_Menu::reset();
		self::reset_sections();
		parent::tear_down();
	}

	/**
	 * Empty the private section registry.
	 */
	private static function reset_sections() {
		$sections = new ReflectionProperty( Jetpack_Protect_Dashboard::class, 'sections' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$sections->setAccessible( true );
		}
		$sections->setValue( null, array() );
	}

	/**
	 * Build a section double.
	 *
	 * @param string $key            Section key.
	 * @param array  $state          Section state.
	 * @param bool   $expects_routes Whether the section must be asked for its routes once.
	 * @return Jetpack_Protect_Dashboard_Section
	 */
	private function make_section( $key, $state, $expects_routes = false ) {
		$section = $expects_routes
			? $this->createMock( Jetpack_Protect_Dashboard_Section::class )
			: $this->createStub( Jetpack_Protect_Dashboard_Section::class );
		$section->method( 'get_key' )->willReturn( $key );
		$section->method( 'get_state' )->willReturn( $state );
		if ( $expects_routes ) {
			$section->expects( $this->once() )->method( 'register_routes' );
		}
		return $section;
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

		ob_start();
		Jetpack_Protect_Dashboard::render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'notice-error', $output );
	}

	/**
	 * Test that a second section with a registered key is refused.
	 */
	public function test_register_section_keeps_the_first_section_for_a_key() {
		$this->setExpectedIncorrectUsage( 'Jetpack_Protect_Dashboard::register_section' );

		Jetpack_Protect_Dashboard::register_section( $this->make_section( 'scan', array( 'order' => 'first' ) ) );
		Jetpack_Protect_Dashboard::register_section( $this->make_section( 'scan', array( 'order' => 'second' ) ) );

		$this->assertSame( array( 'scan' => array( 'order' => 'first' ) ), Jetpack_Protect_Dashboard::get_initial_state() );
	}

	/**
	 * Test that every section contributes its state and its REST routes.
	 */
	public function test_sections_provide_state_by_key_and_register_routes() {
		$scan    = $this->make_section( 'scan', array( 'threats' => 2 ), true );
		$monitor = $this->make_section( 'monitor', array( 'active' => true ), true );

		Jetpack_Protect_Dashboard::register_section( $scan );
		Jetpack_Protect_Dashboard::register_section( $monitor );
		Jetpack_Protect_Dashboard::register_rest_routes();

		$this->assertSame(
			array(
				'scan'    => array( 'threats' => 2 ),
				'monitor' => array( 'active' => true ),
			),
			Jetpack_Protect_Dashboard::get_initial_state()
		);
	}
}
