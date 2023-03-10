<?php

use Automattic\Jetpack\Sync\Health;
use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Health extends WP_Test_Jetpack_Sync_Base {
	public function test_update_status_should_default_to_unknown() {
		// When an invalid status is used, we should default to an unknown status.
		Health::update_status( 'some-status' );
		$this->assertEquals( Health::get_status(), Health::STATUS_UNKNOWN );
	}

	public function test_update_status_should_set_correct_status() {
		// The status should be saved if a valid status is used.
		Health::update_status( Health::STATUS_IN_SYNC );
		$this->assertEquals( Health::get_status(), Health::STATUS_IN_SYNC );
	}

	public function test_is_status_defined_should_be_true() {
		// If the status option exists, it should be defined.
		Health::update_status( 'some-status' );
		$this->assertTrue( Health::is_status_defined() );
	}

	public function test_is_status_defined_should_be_false() {
		// If the status option doesn't exist, it should not be defined.
		$this->assertFalse( Health::is_status_defined() );
	}

	/**
	 * When Jetpack is activated, health status should be set to unknown if it's never been set before.
	 */
	public function test_initialization_status_on_activation() {
		Jetpack::plugin_activation( false );
		$this->assertEquals( Health::get_status(), Health::STATUS_UNKNOWN );
	}

	/**
	 * When Jetpack is activated, health status should be set to disabled if sync is disabled.
	 */
	public function test_initialization_status_disabled_on_activation() {
		Health::update_status( Health::STATUS_IN_SYNC );
		$this->assertEquals( Health::get_status(), Health::STATUS_IN_SYNC );
		Settings::update_settings( array( 'disable' => true ) );
		Jetpack::plugin_activation( false );
		$this->assertEquals( Health::get_status(), Health::STATUS_DISABLED );
	}

	/**
	 * When Jetpack is activated, health status should be set to unknown, even if it's already set.
	 * We can't be fully sure what actions have happened during deactivation state.
	 */
	public function test_initialization_status_ignored_on_activation() {
		Health::update_status( Health::STATUS_IN_SYNC );
		Jetpack::plugin_activation( false );
		$this->assertEquals( Health::get_status(), Health::STATUS_UNKNOWN );
	}

	public function test_update_returns_false_if_status_not_changed() {
		$updated = Health::update_status( Health::STATUS_IN_SYNC );
		$this->assertTrue( $updated );
		$updated = Health::update_status( Health::STATUS_IN_SYNC );
		$this->assertFalse( $updated );
	}
}
