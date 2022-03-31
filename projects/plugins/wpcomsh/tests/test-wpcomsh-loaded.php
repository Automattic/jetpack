<?php
/**
 * Wpcomsh Loaded Test file.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomshLoadedTest.
 */
class WpcomshLoadedTest extends WP_UnitTestCase {
	/**
	 * Test that it's loaded.
	 */
	public function test_loaded() {
		$this->assertTrue( defined( 'WPCOMSH_VERSION' ) );
	}
}
