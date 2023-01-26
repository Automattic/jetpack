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
	 * Set up before each test.
	 *
	 * @before
	 */
	public function set_up() {
		Blaze::$script_path = 'js/editor.js';
	}

	/**
	 * Tear down after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_dequeue_script( Blaze::SCRIPT_HANDLE );
		wp_deregister_script( Blaze::SCRIPT_HANDLE );
	}

	/**
	 * Test that Blaze::init() does not run everything by default.
	 *
	 * @covers Automattic\Jetpack\Blaze::init
	 */
	public function test_should_not_check_eligibility_by_defuault() {
		/*
		 *The post_row_actions action should not be available on init.
		 * It only happens on a specific screen.
		 */
		$this->assertFalse( has_action( 'post_row_actions' ) );
		/**
		 * The jetpack_blaze_enabled filter should not be available on init.
		 * It should only be available after you've made a remote request to WordPress.com.
		 */
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
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that we avoid enqueuing assets when Blaze is not enabled.
	 *
	 * @covers Automattic\Jetpack\Blaze::enqueue_block_editor_assets
	 *
	 * @dataProvider get_enqueue_scenarios
	 *
	 * @param string $hook           The current admin page.
	 * @param bool   $blaze_enabled  Whether Blaze is force-enabled or not.
	 * @param bool   $should_enqueue Whether we should enqueue Blaze assets or not.
	 */
	public function test_enqueue_block_editor_assets( $hook, $blaze_enabled, $should_enqueue ) {
		// Confirm that our script is not added by default.
		$this->assertFalse( wp_script_is( Blaze::SCRIPT_HANDLE, 'registered' ) );

		if ( $blaze_enabled ) {
			add_filter( 'jetpack_blaze_enabled', '__return_true' );
		}

		Blaze::enqueue_block_editor_assets( $hook );

		// Assert that our style, filter, and action has been added.
		if ( $should_enqueue ) {
			$this->assertTrue( wp_script_is( Blaze::SCRIPT_HANDLE, 'enqueued' ) );
		} else {
			$this->assertFalse( wp_script_is( Blaze::SCRIPT_HANDLE, 'registered' ) );
		}

		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Different scenarios (pages, Blaze eligibility) to test if Blaze js is enqueued in the editor.
	 *
	 * @covers Automattic\Jetpack\Blaze::enqueue_block_editor_assets
	 *
	 * @return array
	 */
	public function get_enqueue_scenarios() {
		return array(
			'In site editor, Blaze enabled'       => array(
				'site-editor.php',
				true,
				false,
			),
			'In post editor, Blaze disabled'      => array(
				'post.php',
				false,
				false,
			),
			'In post editor, Blaze enabled'       => array(
				'post.php',
				true,
				true,
			),
			'In random admin page, Blaze enabled' => array(
				'tools.php',
				true,
				false,
			),
		);
	}
}
