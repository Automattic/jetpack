<?php

class WP_Test_Jetpack_Sync_Module_Stats extends WP_Test_Jetpack_Sync_Base {

	/**
	 * Called before each test.
	 */
	public function setUp() {
		parent::setUp();

		// Set up a user token for the master user so the site is connected.
		$user_id = 1;
		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option(
			'user_tokens',
			array(
				$user_id => 'apple.a.' . $user_id,
			)
		);
	}

	/**
	 * Called after each test.
	 */
	public function tearDown() {
		parent::tearDown();
		Jetpack_Options::delete_option( 'master_user' );
		Jetpack_Options::delete_option( 'user_tokens' );
	}

	/**
	 * Test sends stats data on heartbeat
	 *
	 * @expectedDeprecated Jetpack_Heartbeat::cron_exec
	 * @return void
	 */
	public function test_sends_stats_data_on_heartbeat() {
		$heartbeat = Jetpack_Heartbeat::init();
		add_filter( 'jetpack_heartbeat_stats_array', array( $heartbeat, 'add_stats_to_heartbeat' ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$heartbeat->cron_exec();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );

		$this->assertEquals( JETPACK__VERSION, $action->args[0]['version'] );
	}

	/**
	 * Test dont send expensive data on heartbeat
	 *
	 * @expectedDeprecated Jetpack_Heartbeat::cron_exec
	 * @return void
	 */
	public function test_dont_send_expensive_data_on_heartbeat() {
		$heartbeat = Jetpack_Heartbeat::init();
		add_filter( 'jetpack_heartbeat_stats_array', array( $heartbeat, 'add_stats_to_heartbeat' ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$heartbeat->cron_exec();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );

		$this->assertFalse( isset( $action->args[0]['users'] ) );
	}

	/**
	 * Test sends stats data on heartbeat on multisite
	 *
	 * @expectedDeprecated Jetpack_Heartbeat::cron_exec
	 * @return void
	 */
	public function test_sends_stats_data_on_heartbeat_on_multisite() {
		global $wpdb;

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$user_id         = $this->factory->user->create();
		$mu_blog_user_id = $this->factory->user->create();

		// Create a different blog.
		$suppress      = $wpdb->suppress_errors();
		$other_blog_id = wpmu_create_blog( 'foo.com', '', 'My Blog', $user_id );
		$wpdb->suppress_errors( $suppress );

		// Create a user from within that blog (won't be synced).
		switch_to_blog( $other_blog_id );

		add_user_to_blog( $other_blog_id, $mu_blog_user_id, 'administrator' );

		$heartbeat = Jetpack_Heartbeat::init();
		add_filter( 'jetpack_heartbeat_stats_array', array( $heartbeat, 'add_stats_to_heartbeat' ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$heartbeat->cron_exec();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->sender->do_sync();

		$action = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_heartbeat_stats' );

		restore_current_blog();

		$this->assertEquals( JETPACK__VERSION, $action->args[0]['version'] );
		$this->assertFalse( isset( $action->args[0]['users'] ) );

	}
}
