<?php

/**
 * Plugin uninstall test case.
 *
 * @group uninstall
 */
class WP_Test_Unistall_Jetpack extends WP_UnitTestCase {

	public function test_uninstall() {
		define( 'WP_UNINSTALL_PLUGIN', 'jetpack/jetpack' );
		$this->assertTrue( file_exists( plugin_dir_path( __FILE__ )  . '../../../' . 'uninstall.php' ) );
		require plugin_dir_path( __FILE__ )  . '../../../' . 'uninstall.php';
		$this->assertTrue( defined( 'JETPACK__PLUGIN_DIR' ) );

	}

} // end class
