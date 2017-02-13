<?php

class WP_Test_Jetpack_Options extends WP_UnitTestCase {
	function test_delete_non_compact_option_returns_true_when_successfully_deleted() {
		Jetpack_Options::update_option( 'migrate_for_idc', true );

		// Make sure the option is set
		$this->assertTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		$deleted = Jetpack_Options::delete_option( 'migrate_for_idc' );

		// Was the option successfully deleted?
		$this->assertFalse( Jetpack_Options::get_option( 'migrate_for_idc' ) );

		// Did Jetpack_Options::delete_option() properly return true?
		$this->assertTrue( $deleted );
	}
}
