<?php

/**
 * Test pluggable functionality for bruteprotect
 */

require_once dirname( __FILE__ ) . '/../../../modules/protect.php';

class WP_Test_Jetpack_Sync_Module_Protect extends WP_Test_Jetpack_Sync_Base {

	function test_sends_failed_login_message() {

			Jetpack_Protect_Module::instance()->log_failed_attempt();

			$this->sender->do_sync();

			$action = $this->server_event_storage->get_most_recent_event( 'jetpack_valid_failed_login_attempt' );

			$this->assertEquals( '127.0.0.1', $action->args[0] );
		}
}