<?php
/**
 * This file contains PHPUnit tests for the Blaze class.
 * To run the package unit tests, run jetpack test php packages/blaze
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * PHPUnit tests for the Dashboard class.
 *
 * @covers \Automattic\Jetpack\Blaze\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Test extends BaseTestCase {
	/**
	 * Test has root dom.
	 */
	public function test_render() {
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-blaze-dashboard".*>/i' );
		( new Dashboard() )->render();
	}

	/**
	 * Test has root dom with the provided overridden classname.
	 */
	public function test_render_with_overridden_class() {
		$this->expectOutputRegex( '/<div id="wpcom" class="custom-class-dashboard".*>/i' );
		( new Dashboard( 'admin.php', 'advertising', 'custom-class' ) )->render();
	}

	/**
	 * Ensure the script can be enqueued in admin.
	 */
	public function test_admin_init() {
		( new Dashboard() )->admin_init();
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts' ) );
	}

	/**
	 * Ensure the script and style are enqueued.
	 */
	public function test_load_admin_scripts() {
		$script_handle = Dashboard::SCRIPT_HANDLE;
		$style_handle  = $script_handle . '-style';

		// Scripts and style should not be enqueued on the main dashboard.
		( new Dashboard( 'admin.php', 'custom-menu' ) )->load_admin_scripts( 'index.php' );
		$this->assertFalse( wp_script_is( $script_handle, 'enqueued' ) );
		$this->assertFalse( wp_style_is( $style_handle, 'enqueued' ) );

		// They should, however, be enqueued on the Advertising page.
		( new Dashboard( 'admin.php', 'custom-menu' ) )->load_admin_scripts( 'toplevel_page_custom-menu' );
		$this->assertTrue( wp_script_is( $script_handle, 'enqueued' ) );
		$this->assertTrue( wp_style_is( $style_handle, 'enqueued' ) );
	}

	/**
	 * Ensure the script is enqueued for submenu pages under Jetpack parent.
	 */
	public function test_load_admin_scripts_jetpack_parent() {
		$script_handle = Dashboard::SCRIPT_HANDLE;
		$style_handle  = $script_handle . '-style';

		// Reset enqueued state.
		wp_dequeue_script( $script_handle );
		wp_deregister_script( $script_handle );
		wp_dequeue_style( $style_handle );
		wp_deregister_style( $style_handle );

		// The hook suffix for submenu pages under Jetpack uses "jetpack_page_".
		( new Dashboard( 'admin.php', 'advertising' ) )->load_admin_scripts( 'jetpack_page_advertising' );
		$this->assertTrue( wp_script_is( $script_handle, 'enqueued' ) );
		$this->assertTrue( wp_style_is( $style_handle, 'enqueued' ) );
	}

	/**
	 * Ensure the script is enqueued for top-level menu pages.
	 */
	public function test_load_admin_scripts_toplevel() {
		$script_handle = Dashboard::SCRIPT_HANDLE;
		$style_handle  = $script_handle . '-style';

		// Reset enqueued state.
		wp_dequeue_script( $script_handle );
		wp_deregister_script( $script_handle );
		wp_dequeue_style( $style_handle );
		wp_deregister_style( $style_handle );

		// The hook suffix for top-level menu pages uses "toplevel_page_".
		( new Dashboard( 'admin.php', 'advertising' ) )->load_admin_scripts( 'toplevel_page_advertising' );
		$this->assertTrue( wp_script_is( $script_handle, 'enqueued' ) );
		$this->assertTrue( wp_style_is( $style_handle, 'enqueued' ) );
	}
}
