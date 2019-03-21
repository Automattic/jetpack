<?php

/**
 * Test pluggable functionality for bruteprotect
 */

class WP_Test_Jetpack_Sync_Module_Auth extends WP_Test_Jetpack_Sync_Base {

	function test_sends_failed_login_event() {
		$user = get_user_by( 'ID', 1 );

		do_action( 'authenticate', $user, $user->nickname, 'admin' );

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'authenticate' );

		$this->assertIsObject( $action );
		$this->assertEquals( 1, $action->args[0]['external_user_id'] );
	}
}
