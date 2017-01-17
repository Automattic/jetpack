<?php

class WP_Test_Jetpack_Connection_Banner extends WP_UnitTestCase {
	function test_connection_banner_cleans_up_on_upgrade() {
		Jetpack_Connection_Banner::init();
		$this->assertTrue( update_option( 'jetpack_connection_banner_ab', 2 ) );

		$this->assertEquals( 2, get_option( 'jetpack_connection_banner_ab' ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.5', '4.4.1' );

		$this->assertFalse( get_option( 'jetpack_connection_banner_ab' ) );
	}
}
