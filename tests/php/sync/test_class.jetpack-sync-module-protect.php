<?php

/**
 * Test pluggable functionality for bruteprotect
 */

require_once dirname( __FILE__ ) . '/../../../modules/protect.php';

class WP_Test_Jetpack_Sync_Module_Protect extends WP_Test_Jetpack_Sync_Base {

	function test_sends_failed_login_message() {
		$user_id = $this->factory->user->create();

		$user = get_userdata( $user_id );

		Jetpack_Protect_Module::instance()->log_failed_attempt( $user->user_email );

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_valid_failed_login_attempt' );

		$this->assertEquals( $user->user_email, $action->args[0]['login'] );
	}

	function test_do_not_send_failed_login_message() {
		$user_id = $this->factory->user->create();

		$user = get_userdata( $user_id );
		Jetpack_Constants::set_constant( 'XMLRPC_REQUEST', true ); // fake xmlrpc request
		Jetpack_Protect_Module::instance()->log_failed_attempt( $user->user_email );
		Jetpack_Constants::clear_single_constant( 'XMLRPC_REQUEST' );
		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_valid_failed_login_attempt' );

		$this->assertFalse( $action );
	}

	function test_sends_failed_login_empty_message() {
		Jetpack_Protect_Module::instance()->log_failed_attempt();

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_valid_failed_login_attempt' );

		$this->assertEquals( '', $action->args[0]['login'] );
	}
}
