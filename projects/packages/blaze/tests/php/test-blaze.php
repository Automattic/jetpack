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
	 * Test that the jetpack_blaze_enabled filter overwrites eligibility.
	 *
	 * @covers Automattic\Jetpack\Blaze::should_initialize
	 */
	public function test_filter_overwrites_eligibility() {
		$this->assertFalse( Blaze::should_initialize() );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		$this->assertTrue( Blaze::should_initialize() );
	}
}
