<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * This file contains PHPUnit tests for the Post_List class.
 * To run the package unit tests:
 * - go the post-list folder "cd projects/packages/post-list"
 * - run the command "composer test-php"
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack;

use WorDBless\BaseTestCase;

/**
 * PHPUnit tests for the Post_List class.
 *
 * @package automattic/jetpack-post-list
 */
class Test_Blaze extends BaseTestCase {

	/**
	 * Post_List::get_instance() should return and instance of the Post_List class.
	 */
	public function test_get_instance() {
		$this->assertInstanceOf( Blaze::class, Blaze::get_instance() );
	}

	/**
	 * Test the register() method.
	 */
	public function test_register() {
		$blaze = Blaze::get_instance();

		// did_action() Retrieves the number of times an action has been fired during the current request.
		// Assert our action hasn't been fired yet.
		$this->assertSame( 0, did_action( 'jetpack_on_blaze_init' ) );

		// Set up our action callbacks using the register() method.
		$blaze->register();

		// Confirm it was only fired once even though we call it twice.
		$blaze->register();

		$this->assertSame( 1, did_action( 'jetpack_on_blaze_init' ) );
	}

	/**
	 * As a control when testing add_filters_and_actions_for_screen() make sure it always starts clean.
	 */
	private function confirm_add_filters_and_actions_for_screen_starts_clean() {
		$this->assertFalse( has_action( 'post_row_actions' ) );
	}

	/**
	 * Test the jetpack_blaze_enabled filter overrides to true.
	 */
	public function test_jetpack_blaze_enabled_filter_override_should_initialize() {
		$blaze = Blaze::get_instance();

		// This filter should override everything, even if it's not connected.
		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		$blaze->register();

		// The post_row_actions should be added.
		$this->assertTrue( $blaze::should_initialize() );
	}

	/**
	 * Test the jetpack_blaze_enabled overrides the should_initialize() method to false.
	 */
	public function test_jetpack_blaze_enabled_filter_override_should_not_initialize() {
		$blaze = Blaze::get_instance();

		// This filter should override everything, even if it's not connected.
		add_filter( 'jetpack_blaze_enabled', '__return_false' );

		$blaze->register();

		// The post_row_actions should be added.
		$this->assertFalse( $blaze::should_initialize() );
	}

	/**
	 * Tests if the post_row action is added when the jetpack_blaze_enabled is overriding.
	 */
	public function test_post_row_added_with_filter() {
		$blaze = Blaze::get_instance();
		$this->confirm_add_filters_and_actions_for_screen_starts_clean();

		// This filter should override everything, even if it's not connected.
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
		$blaze->register();

		$this->assertFalse( has_action( 'post_row_actions' ) );
	}
}
