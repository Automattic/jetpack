<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * This file contains PHPUnit tests for the Blaze class.
 * To run the package unit tests, run jetpack test packages/blaze
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack;

use WorDBless\BaseTestCase;

/**
 * PHPUnit tests for the Blaze class.
 */
class Test_Blaze extends BaseTestCase {
	/**
	 * Test that Blaze::init() does not run everything by default.
	 *
	 * @covers Automattic\Jetpack\Blaze::init
	 */
	public function test_should_initialize() {
		$this->assertFalse( has_action( 'post_row_actions', 'Blaze::jetpack_blaze_row_action' ), 'post_row_actions' );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', 'Blaze::enqueue_block_editor_assets' ), 'admin_enqueue_scripts' );
		$this->assertFalse( has_filter( 'jetpack_blaze_enabled' ) );
	}

	/**
	 * Test that the jetpack_blaze_enabled filter overwrites eligibility.
	 *
	 * @covers Automattic\Jetpack\Blaze::should_initialize
	 */
	public function test_filter_overwrites_eligibility() {
		$this->assertFalse( Blaze::should_initialize() );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		$this->assertTrue( Blaze::should_initialize() );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * As a control when testing add_filters_and_actions_for_screen() make sure it always starts clean.
	 */
	private function confirm_add_filters_and_actions_for_screen_starts_clean() {
		$this->assertFalse( has_action( 'post_row_actions' ) );
	}

	/**
	 * Tests if the post_row action is added when we force Blaze to be enabled.
	 *
	 * @covers Automattic\Jetpack\Blaze::add_post_links_actions
	 */
	public function test_post_row_added() {
		$this->confirm_add_filters_and_actions_for_screen_starts_clean();

		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		Blaze::add_post_links_actions();

		$this->assertNotFalse( has_action( 'post_row_actions' ) );
	}
}
