<?php
/**
 * Gutenberg RTC Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/gutenberg-rtc/gutenberg-rtc.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Tests for Gutenberg RTC feature.
 *
 * @covers ::wpcom_enqueue_gutenberg_rtc_assets
 */
#[CoversFunction( 'wpcom_enqueue_gutenberg_rtc_assets' )]
class Gutenberg_RTC_Test extends \WorDBless\BaseTestCase {
	/**
	 * Tests whether the gutenberg-rtc assets enqueue function is hooked correctly.
	 *
	 * @return void
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_hooked() {
		$this->assertSame( 10, has_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_gutenberg_rtc_assets' ) );
	}

	/**
	 * Tests whether the gutenberg-rtc script is enqueued correctly with proper dependencies.
	 *
	 * @return void
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_enqueues_script() {
		wpcom_enqueue_gutenberg_rtc_assets();

		// Check script is enqueued.
		$this->assertTrue( wp_script_is( 'gutenberg-rtc-script', 'enqueued' ) );

		// Check it has wp-hooks dependency.
		global $wp_scripts;
		$script = $wp_scripts->registered['gutenberg-rtc-script'];
		$this->assertContains( 'wp-hooks', $script->deps );
	}
}
