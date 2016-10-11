<?php


class WP_Test_Jetpack_Sync_Module_Stats extends WP_Test_Jetpack_Sync_Base {

	function test_sends_stats_data_on_heartbeat() {
		$this->factory->user->create();
		$this->factory->user->create();

		$heartbeat = Jetpack_Heartbeat::init();
		$heartbeat->cron_exec();
		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );
		$this->assertEquals( JETPACK__VERSION, $action->args[0]['version'] );
		$this->assertEquals( 3, $action->args[0]['users'] );
	}

	public function  test_sends_stats_data_on_heartbeat_on_multisite() {
		global $wpdb;

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$user_id = $this->factory->user->create();
		$mu_blog_user_id = $this->factory->user->create();

		// create a different blog
		$suppress      = $wpdb->suppress_errors();
		$other_blog_id = wpmu_create_blog( 'foo.com', '', "My Blog", $user_id );
		$wpdb->suppress_errors( $suppress );

		// create a user from within that blog (won't be synced)
		switch_to_blog( $other_blog_id );

		add_user_to_blog( $other_blog_id, $mu_blog_user_id, 'administrator' );

		$heartbeat = Jetpack_Heartbeat::init();
		$heartbeat->cron_exec();
		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );
		
		restore_current_blog();

		$this->assertEquals( JETPACK__VERSION, $action->args[0]['version'] );
		$this->assertEquals( 2, $action->args[0]['users'] );
		$this->assertEquals( 2, $action->args[0]['site-count'] );

	}
}
