<?php

/**
 * Test pluggable functionality for bruteprotect
 */

class WP_Test_Jetpack_Sync_Module_Auth extends WP_Test_Jetpack_Sync_Base {

	protected $user;

	function setUp() {
		parent::setUp();
		$this->user = get_user_by( 'ID', 1 );
	}

	function test_sends_insecure_password_event() {
		do_action( 'authenticate', $this->user, $this->user->nickname, 'admin' );

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'authenticate' );

		$this->assertIsObject( $action );
		$this->assertEquals( $this->user->ID, $action->args[0]['external_user_id'] );
		$this->assertArrayHasKey( 'warning', $action->args[0] );
	}

	function test_does_not_send_insecure_password_event_on_secure_password() {
		do_action( 'authenticate', $this->user, $this->user->nickname, wp_generate_password( 25 ) );

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'authenticate' );

		$this->assertFalse( $action );
	}
}
