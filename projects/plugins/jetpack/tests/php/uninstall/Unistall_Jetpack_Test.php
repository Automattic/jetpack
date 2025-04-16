<?php
/**
 * Tests the uninstall functionality.
 *
 * @package automattic/jetpack
 */

/**
 * Plugin uninstall test case.
 *
 * @group uninstall
 * @covers ::jetpack_uninstall
 */
class Unistall_Jetpack_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Confirms presence of the uninstall file.
	 */
	public function test_uninstall() {
		define( 'WP_UNINSTALL_PLUGIN', 'jetpack/jetpack' );
		$this->assertTrue( file_exists( plugin_dir_path( __FILE__ ) . '../../../uninstall.php' ) );
		require plugin_dir_path( __FILE__ ) . '../../../uninstall.php';
		$this->assertTrue( defined( 'JETPACK__PLUGIN_DIR' ) );
	}
} // end class
