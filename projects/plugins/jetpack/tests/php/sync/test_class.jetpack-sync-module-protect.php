<?php

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;

/**
 * Test pluggable functionality for bruteprotect
 */
class WP_Test_Jetpack_Sync_Module_Protect extends WP_Test_Jetpack_Sync_Base {

	public function test_sends_failed_login_message() {
		$user_id = self::factory()->user->create();

		$user = get_userdata( $user_id );

		Brute_Force_Protection::instance()->log_failed_attempt( $user->user_email );

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_valid_failed_login_attempt' );

		$this->assertEquals( $user->user_email, $action->args[0]['login'] );
	}

	public function test_do_not_send_failed_login_message() {
		$user_id = self::factory()->user->create();

		$user = get_userdata( $user_id );
		Constants::set_constant( 'XMLRPC_REQUEST', true ); // fake xmlrpc request
		Brute_Force_Protection::instance()->log_failed_attempt( $user->user_email );
		Constants::clear_single_constant( 'XMLRPC_REQUEST' );
		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_valid_failed_login_attempt' );

		$this->assertFalse( $action );
	}

	public function test_sends_failed_login_empty_message() {
		Brute_Force_Protection::instance()->log_failed_attempt();

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_valid_failed_login_attempt' );

		$this->assertNull( $action->args[0]['login'] );
	}
}
