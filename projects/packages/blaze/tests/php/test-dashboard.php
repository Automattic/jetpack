<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * This file contains PHPUnit tests for the Blaze class.
 * To run the package unit tests, run jetpack test packages/blaze
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use WorDBless\BaseTestCase;

/**
 * PHPUnit tests for the Dashboard class.
 */
class Test_Dashboard extends BaseTestCase {
	/**
	 * Test has root dom.
	 *
	 * @covers Automattic\Jetpack\Blaze\Dashboard::render
	 */
	public function test_render() {
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-blaze-dashboard".*>/i' );
		( new Dashboard() )->render();
	}

	/**
	 * Ensure the script can be enqueued in admin.
	 *
	 * @covers Automattic\Jetpack\Blaze\Dashboard::admin_init
	 */
	public function test_admin_init() {
		( new Dashboard() )->admin_init();
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts' ) );
	}

	/**
	 * Ensure the script and style are enqueued.
	 *
	 * @covers Automattic\Jetpack\Blaze\Dashboard::load_admin_scripts
	 */
	public function test_load_admin_scripts() {
		( new Dashboard() )->load_admin_scripts();
		$this->assertTrue( wp_script_is( Dashboard::SCRIPT_HANDLE, 'enqueued' ) );

		$style_handle = Dashboard::SCRIPT_HANDLE . '-style';
		$this->assertTrue( wp_style_is( $style_handle, 'enqueued' ) );
	}
}
