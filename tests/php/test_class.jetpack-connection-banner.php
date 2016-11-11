<?php

class WP_Test_Jetpack_Connection_Banner extends WP_UnitTestCase {
	function test_ab_test_expiration_before_12_15() {
		$this->assertTrue( Jetpack_Connection_Banner::check_ab_test_not_expired( strtotime( '10 November 2016' ) ) );
	}

	function test_ab_test_expiration_after_12_15() {
		$this->assertFalse( Jetpack_Connection_Banner::check_ab_test_not_expired( strtotime( '17 December 2016' ) ) );
	}

	function test_get_random_connection_banner_value_if_not_set() {
		Jetpack_Options::delete_option( 'connection_banner_ab' );
		$this->assertNotEquals( false, Jetpack_Connection_Banner::get_random_connection_banner_value() );
		$this->assertNotEquals( false, Jetpack_Options::get_option( 'connection_banner_ab' ) );
	}
}
