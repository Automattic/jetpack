<?php
/**
 * Tests for the My Jetpack admin menu.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use WorDBless\BaseTestCase;

/**
 * Tests the My Jetpack admin menu registration.
 */
class Initializer_Menu_Test extends BaseTestCase {
	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		$this->reset_admin_menu_state();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_menu_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $this->admin_id );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		global $submenu;

		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) );
		Status_Cache::clear();
		unset( $submenu['jetpack'] );
		$this->reset_admin_menu_state();
	}

	/**
	 * Test that My Jetpack's submenu points to Offline Mode while offline.
	 */
	public function test_my_jetpack_menu_points_to_offline_mode_when_offline() {
		global $submenu;

		add_filter( 'jetpack_offline_mode', '__return_true' );
		Status_Cache::clear();

		Initializer::add_my_jetpack_menu_item();
		Admin_Menu::admin_menu_hook_callback();

		$this->assertNotEmpty( $submenu['jetpack'] );

		$item = reset( $submenu['jetpack'] );
		$this->assertSame( 'Offline Mode', $item[0] );
		$this->assertSame( 'manage_options', $item[1] );
		$this->assertStringContainsString( 'page=jetpack#/offline-mode', $item[2] );
	}

	/**
	 * Test that My Jetpack's submenu remains registered during Offline Mode initialization.
	 */
	public function test_my_jetpack_menu_is_registered_from_init_when_offline() {
		global $submenu;

		add_filter( 'jetpack_offline_mode', '__return_true' );
		Status_Cache::clear();

		$my_jetpack_init_count = did_action( 'my_jetpack_init' );

		Initializer::init();
		do_action( 'admin_menu' );

		$this->assertNotEmpty( $submenu['jetpack'] );

		$item = reset( $submenu['jetpack'] );
		$this->assertSame( 'Offline Mode', $item[0] );
		$this->assertStringContainsString( 'page=jetpack#/offline-mode', $item[2] );
		$this->assertSame( $my_jetpack_init_count, did_action( 'my_jetpack_init' ) );
	}

	/**
	 * Reset Admin Menu shared state.
	 */
	private function reset_admin_menu_state() {
		$reflection = new \ReflectionClass( Admin_Menu::class );

		if ( $reflection->hasProperty( 'menu_items' ) ) {
			$menu_items = $reflection->getProperty( 'menu_items' );
			if ( PHP_VERSION_ID < 80100 ) {
				$menu_items->setAccessible( true );
			}
			$menu_items->setValue( null, array() );
		}

		if ( $reflection->hasProperty( 'initialized' ) ) {
			$initialized = $reflection->getProperty( 'initialized' );
			if ( PHP_VERSION_ID < 80100 ) {
				$initialized->setAccessible( true );
			}
			$initialized->setValue( null, false );
		}
	}
}
