<?php

require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php' );

class WP_Test_Jetpack_JITM extends WP_UnitTestCase {
	function test_jitm_disabled_by_filter() {
		add_filter( 'jetpack_just_in_time_msgs', '__return_false', 50 );
		$this->assertFalse( Jetpack_JITM::init() );
	}

	function test_jitm_enabled_by_default() {
		$this->assertTrue( ! ! Jetpack_JITM::init() );
	}
}
