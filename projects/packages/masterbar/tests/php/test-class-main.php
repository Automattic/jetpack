<?php
/**
 * Tests for Main class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status\Cache;
use Brain\Monkey\Functions;
use WorDBless\BaseTestCase;

/**
 * Class Test_Main.
 *
 * @covers Automattic\Jetpack\Masterbar\Main
 */
class Test_Main extends BaseTestCase {
	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Functions\when( 'wpcom_is_nav_redesign_enabled' )->justReturn( false );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		Cache::clear();
	}

	public function test_init() {
		Main::init();
		$this->assertSame( 1, did_action( 'jetpack_masterbar_init' ) );
	}

	public function test_init_will_return_early_if_called_twice() {
		Main::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- This is done on purpose to ensure the second call will return early.
		Main::init();
		$this->assertSame( 1, did_action( 'jetpack_masterbar_init' ) );
	}

	public function test_init_woa() {
		Cache::set( 'is_woa_site', true );
		Main::init();
		$this->assertSame( 1, did_action( 'jetpack_masterbar_init' ) );
	}

	public function test_init_with_jetpack_load_admin_menu_class_filter() {
		add_filter( 'jetpack_load_admin_menu_class', '__return_true' );
		Main::init();
		$this->assertSame( 1, did_action( 'jetpack_masterbar_init' ) );
	}
}
