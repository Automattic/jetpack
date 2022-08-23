<?php
/**
 * Test the compat file.
 *
 * @package Automattic/jetpack
 */

/**
 * Testing class.
 */
class WP_Test_Jetpack_Compat_Functions extends WP_UnitTestCase {

	/**
	 * @dataProvider provider_wp_startswith
	 */
	public function test_wp_startswith( $haystack, $needle, $expected ) {
		$this->assertEquals( $expected, wp_startswith( $haystack, $needle ) );
	}

	public function provider_wp_startswith() {
		return array(
			array( 'Random String', 'Random', true ), // Regular usage.
			array( '12345', 12345, true ), // Passing an int as the needle is deprecated, but previously supported.
			array( 'Random String', 'random', false ), // case-sensitive.
			array( 'Random String', 'string', false ), // Nope.
		);
	}
}
