<?php

/**
 * Testing sync of values for SSO.
 */
class WP_Test_Jetpack_Sync_SSO extends WP_Test_Jetpack_Sync_Base {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->sender->do_sync();
		$this->resetCallableAndConstantTimeouts();
	}

	public function test_sync_sso_is_two_step_required_filter_true() {
		add_filter( 'jetpack_sso_require_two_step', '__return_true' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_is_two_step_required' );
		$this->assertTrue( $callable_value );
		remove_filter( 'jetpack_sso_require_two_step', '__return_true' );
	}

	public function test_sync_sso_should_hide_login_form_filter_true() {
		add_filter( 'jetpack_remove_login_form', '__return_true' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_should_hide_login_form' );
		$this->assertTrue( $callable_value );
		remove_filter( 'jetpack_remove_login_form', '__return_true' );
	}

	public function test_sync_sso_match_by_email_filter_true() {
		add_filter( 'jetpack_sso_match_by_email', '__return_true' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_match_by_email' );
		$this->assertTrue( $callable_value );
		remove_filter( 'jetpack_sso_match_by_email', '__return_true' );
	}

	public function test_sync_sso_new_user_override_filter_true() {
		add_filter( 'jetpack_sso_new_user_override', '__return_true' );
		update_option( 'default_role', 'subscriber' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_new_user_override' );
		$this->assertEquals( 'subscriber', $callable_value );
		remove_filter( 'jetpack_sso_new_user_override', '__return_true' );
	}

	public function test_sync_sso_sso_bypass_default_login_form_filter_true() {
		add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_bypass_default_login_form' );
		$this->assertTrue( $callable_value );
		remove_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );
	}

	public function test_sync_sso_is_two_step_required_filter_false() {
		add_filter( 'jetpack_sso_require_two_step', '__return_false' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_is_two_step_required' );
		$this->assertFalse( $callable_value );
		remove_filter( 'jetpack_sso_require_two_step', '__return_false' );
	}

	public function test_sync_sso_should_hide_login_form_filter_false() {
		add_filter( 'jetpack_remove_login_form', '__return_false' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_should_hide_login_form' );
		$this->assertFalse( $callable_value );
		remove_filter( 'jetpack_remove_login_form', '__return_false' );
	}

	public function test_sync_sso_match_by_email_filter_false() {
		add_filter( 'jetpack_sso_match_by_email', '__return_false' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_match_by_email' );
		$this->assertFalse( $callable_value );
		remove_filter( 'jetpack_sso_match_by_email', '__return_false' );
	}

	public function test_sync_sso_new_user_override_filter_false() {
		add_filter( 'jetpack_sso_new_user_override', '__return_false' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_new_user_override' );
		$this->assertFalse( $callable_value );
		remove_filter( 'jetpack_sso_new_user_override', '__return_false' );
	}

	public function test_sync_sso_sso_bypass_default_login_form_filter_false() {
		add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_false' );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_bypass_default_login_form' );
		$this->assertFalse( $callable_value );
		remove_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_false' );
	}

	public function test_sync_sso_is_two_step_required_option_true() {
		update_option( 'jetpack_sso_require_two_step', true );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_is_two_step_required' );
		$this->assertTrue( $callable_value );
		delete_option( 'jetpack_sso_require_two_step' );
	}

	public function test_sync_sso_should_hide_login_form_option_true() {
		update_option( 'jetpack_sso_remove_login_form', true );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_should_hide_login_form' );
		$this->assertTrue( $callable_value );
		delete_option( 'jetpack_sso_remove_login_form' );
	}

	public function test_sync_sso_is_two_step_required_option_false() {
		update_option( 'jetpack_sso_require_two_step', false );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_is_two_step_required' );
		$this->assertFalse( $callable_value );
		delete_option( 'jetpack_sso_require_two_step' );
	}

	public function test_sync_sso_should_hide_login_form_option_false() {
		update_option( 'jetpack_sso_remove_login_form', false );
		$this->sender->do_sync();
		$callable_value = $this->server_replica_storage->get_callable( 'sso_should_hide_login_form' );
		$this->assertFalse( $callable_value );
		delete_option( 'jetpack_sso_remove_login_form' );
	}
}
