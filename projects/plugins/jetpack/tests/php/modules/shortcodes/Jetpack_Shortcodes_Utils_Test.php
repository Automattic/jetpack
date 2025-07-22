<?php

class Jetpack_Shortcodes_Utils_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_jetpack_shortcodes_should_hook_pre_kses_exists() {
		$this->assertTrue( function_exists( 'jetpack_shortcodes_should_hook_pre_kses' ) );
	}
}
