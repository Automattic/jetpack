<?php
/**
 * Tests for the Monetize dashboard.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Monetize\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Test extends BaseTestCase {

	/**
	 * Start from an empty menu queue.
	 */
	public function set_up() {
		parent::set_up();
		Admin_Menu::reset();
	}

	/**
	 * Leave no queued items or hooks behind.
	 */
	public function tear_down() {
		Admin_Menu::reset();
		unset( $_GET['page'] );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'admin_enqueue_scripts' );
		unset( $GLOBALS['submenu']['jetpack'] );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_init_queues_an_item_that_renders_the_dashboard_with_the_init_options() {
		Dashboard::init( array( 'module' => 'monetize' ) );
		$priority = has_action( 'admin_menu', array( Dashboard::class, 'add_menu' ) );
		$this->assertIsInt( $priority );
		$this->assertLessThan( 1000, $priority, 'Admin_Menu registers its queued items at 1000.' );

		Dashboard::add_menu();

		$item = Admin_Menu::remove_menu( Dashboard::MENU_SLUG );
		$this->assertSame( array( Dashboard::class, 'render' ), $item['function'] );
		$this->assertSame( 'monetize', $item['args']['module'] );
	}

	public function test_add_wp_admin_submenu_adds_the_page_under_the_jetpack_menu() {
		global $submenu;
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		$user_id = wp_insert_user(
			array(
				'user_login' => 'monetize-admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		Dashboard::add_wp_admin_submenu();

		$item = array_values( array_filter( $submenu['jetpack'] ?? array(), fn( $entry ) => Dashboard::MENU_SLUG === $entry[2] ) );
		$this->assertCount( 1, $item );
		$this->assertSame( 'manage_options', $item[0][1] );
		$this->assertNotFalse( has_action( get_plugin_page_hookname( Dashboard::MENU_SLUG, 'jetpack' ), array( Dashboard::class, 'render' ) ) );
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
		$this->assertNotContains( 'jetpack-monetize', array_merge( array(), ...array_values( WP_Build_Polyfills::get_consumers() ) ) );
	}

	/**
	 * Requested `page` values and whether each is the dashboard's.
	 *
	 * @return array[]
	 */
	public static function provide_page_requests() {
		return array(
			'the Monetize page' => array( Dashboard::MENU_SLUG, true ),
			'another page'      => array( 'jetpack', false ),
			'no page'           => array( null, false ),
		);
	}

	/**
	 * @dataProvider provide_page_requests
	 *
	 * @param string|null $page     The requested `page`, or null for none.
	 * @param bool        $expected Whether the request is for the dashboard.
	 */
	#[DataProvider( 'provide_page_requests' )]
	public function test_is_dashboard_request_matches_only_the_monetize_page( $page, $expected ) {
		if ( null !== $page ) {
			$_GET['page'] = $page;
		}

		$this->assertSame( $expected, Dashboard::is_dashboard_request() );
	}

	public function test_restore_screen_id_undoes_the_alias() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'jetpack_page_jetpack-monetize' );

		Dashboard::alias_screen_id();
		$this->assertSame( Dashboard::WP_BUILD_PAGE_ID, get_current_screen()->id );

		Dashboard::restore_screen_id();
		$this->assertSame( 'jetpack_page_jetpack-monetize', get_current_screen()->id );
	}
}
