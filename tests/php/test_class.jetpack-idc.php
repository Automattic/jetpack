<?php

class WP_Test_Jetpack_IDC extends WP_UnitTestCase {
	function test_clear_all_idc_options_clears_expected() {
		$options = array(
			'sync_error_idc',
			'safe_mode_confirmed',
			'migrate_for_idc',
		);

		foreach ( $options as $option ) {
			Jetpack_Options::update_option( $option, true );
			$this->assertTrue( Jetpack_Options::get_option( $option ) );
		}

		Jetpack_IDC::clear_all_idc_options();

		foreach ( $options as $option ) {
			$this->assertFalse( Jetpack_Options::get_option( $option ) );
		}
	}
}
