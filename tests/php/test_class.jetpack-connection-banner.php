<?php

class WP_Test_Jetpack_Connection_Banner extends WP_UnitTestCase {
	function test_ab_test_expiration_before_12_15() {
		$this->assertTrue( Jetpack_Connection_Banner::check_ab_test_not_expired( strtotime( '10 November 2016' ) ) );
	}

	function test_ab_test_expiration_after_12_15() {
		$this->assertFalse( Jetpack_Connection_Banner::check_ab_test_not_expired( strtotime( '17 December 2016' ) ) );
	}
}
