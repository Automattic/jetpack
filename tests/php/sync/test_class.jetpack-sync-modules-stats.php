<?php


class WP_Test_Jetpack_Sync_Module_Stats extends WP_Test_Jetpack_Sync_Base {

	function test_sends_stats_data_on_heartbeat() {
		$heartbeat = Jetpack_Heartbeat::init();
		$heartbeat->cron_exec();
		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_heartbeat' );
		$this->assertEquals( JETPACK__VERSION, $action->args[0]['version'] );
	}
}
