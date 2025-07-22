<?php

class Jetpack_Shortcodes_Utils_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_shortcodes_should_hook_pre_kses' );
	}

	/**
	 * Test that the function exists.
	 */
	public function test_jetpack_shortcodes_should_hook_pre_kses_exists() {
		$this->assertTrue( function_exists( 'jetpack_shortcodes_should_hook_pre_kses' ) );
	}

	/**
	 * Test that the function returns true for admin requests.
	 */
	public function test_jetpack_shortcodes_should_hook_pre_kses_admin() {
		add_filter( 'jetpack_shortcodes_should_hook_pre_kses', '__return_true' );

		$this->assertTrue( jetpack_shortcodes_should_hook_pre_kses() );
	}

	/**
	 * Test that the function returns false for frontend requests.
	 */
	public function test_jetpack_shortcodes_should_hook_pre_kses_frontend() {
		add_filter( 'jetpack_shortcodes_should_hook_pre_kses', '__return_false' );

		$this->assertFalse( jetpack_shortcodes_should_hook_pre_kses() );
	}
}
