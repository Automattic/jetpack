<?php

class Jetpack_Shortcodes_Utils_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that the function exists.
	 */
	public function test_jetpack_shortcodes_should_hook_pre_kses_exists() {
		$this->assertTrue( function_exists( 'jetpack_shortcodes_should_hook_pre_kses' ) );
	}

	/**
	 * Test that resetting the cache works.
	 */
	public function test_jetpack_shortcodes_should_hook_pre_kses_reset_cache() {
		add_filter( 'jetpack_is_frontend', '__return_true' );

		// Reset the cache to allow is_frontend to be called again.
		$this->assertFalse( jetpack_shortcodes_should_hook_pre_kses( true ) );

		// Call the function again to check the cache.
		$this->assertFalse( jetpack_shortcodes_should_hook_pre_kses() );

		remove_filter( 'jetpack_is_frontend', '__return_true' );
	}

	/**
	 * Test that result can be overridden by a filter.
	 */
	public function test_jetpack_shortcodes_should_hook_pre_kses_override_filter_applies_correctly() {
		add_filter( 'jetpack_shortcodes_should_hook_pre_kses', '__return_true' );
		$this->assertTrue( jetpack_shortcodes_should_hook_pre_kses() );
		remove_filter( 'jetpack_shortcodes_should_hook_pre_kses', '__return_true' );
	}
}
