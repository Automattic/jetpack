<?php

use Automattic\Jetpack\Sync\Health;
use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Health extends WP_Test_Jetpack_Sync_Base {
	function test_update_status_should_default_to_unknown() {
		// When an invalid status is used, we should default to an unknown status.
		Health::update_status( 'some-status' );
		$this->assertEquals( Health::get_status(), Health::STATUS_UNKNOWN );
	}

	function test_update_status_should_set_correct_status() {
		// The status should be saved if a valid status is used.
		Health::update_status( Health::STATUS_INITIALIZING );
		$this->assertEquals( Health::get_status(), Health::STATUS_INITIALIZING );
	}

	function test_is_status_defined_should_be_true() {
		// If the status option exists, it should be defined.
		Health::update_status( 'some-status' );
		$this->assertTrue( Health::is_status_defined() );
	}

	function test_is_status_defined_should_be_false() {
		// If the status option doesn't exist, it should not be defined.
		$this->assertFalse( Health::is_status_defined() );
	}

	function test_initialization_status_on_activation() {
		// When Jetpack is activated, health status should be set to initializing if
		// it's never been set before.
		Jetpack::plugin_activation( false );
		$this->assertEquals( Health::get_status(), Health::STATUS_INITIALIZING );
	}

	function test_initialization_status_disabled_on_activation() {
		// When Jetpack is activated, health status should be set to disabled if
		// sync is disabled.
		Health::update_status( Health::STATUS_IN_SYNC );
		$this->assertEquals( Health::get_status(), Health::STATUS_IN_SYNC );
		Settings::update_settings( array( 'disable' => true ) );
		Jetpack::plugin_activation( false );
		$this->assertEquals( Health::get_status(), Health::STATUS_DISABLED );
	}

	function test_initialization_status_ignored_on_activation() {
		// When Jetpack is activated, health status should be perserved if
		// it's already been set.
		Health::update_status( Health::STATUS_IN_SYNC );
		Jetpack::plugin_activation( false );
		$this->assertEquals( Health::get_status(), Health::STATUS_IN_SYNC );
	}


}
