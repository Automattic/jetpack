<?php

class WP_Test_Jetpack_Sync_Integration extends WP_Test_Jetpack_Sync_Base {

	function test_sending_empties_queue() {
		$this->factory->post->create();
		$this->assertNotEmpty( $this->sender->get_sync_queue()->get_all() );
		$this->sender->do_sync();
		$this->assertEmpty( $this->sender->get_sync_queue()->get_all() );
	}

	function test_sends_publicize_action() {
		$post_id = $this->factory->post->create();
		do_action( 'jetpack_publicize_post', $post_id );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_publicize_post' );
		$this->assertEquals( $post_id, $event->args[0] );
	}

	function test_upgrading_sends_options_constants_and_callables() {
		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.2', '4.1' );

		global $wpdb;

		$expected_sync_config = array( 
			'options' => true, 
			'network_options' => true,
			'functions' => true, 
			'constants' => true, 
			'users' => 'initial'
		);

		$sync_status = Jetpack_Sync_Modules::get_module( 'full-sync' )->get_status();

		if ( is_plugin_active_for_network( 'jetpack/jetpack.php' ) && ! is_main_site() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		} else {
			$this->assertEquals( $sync_status['config'], $expected_sync_config );
		}

	}

	function test_upgrading_from_42_plus_does_not_includes_users_in_initial_sync() {
		if ( is_plugin_active_for_network( 'jetpack/jetpack.php' ) && ! is_main_site() ) {
			$this->markTestSkipped( 'Not applicable for jetpack when it is not network activated.' );
		}
		$initial_sync_without_users_config = array( 'options' => true, 'functions' => true, 'constants' => true, 'network_options' => true );
		$initial_sync_with_users_config = array( 'options' => true, 'functions' => true, 'constants' => true, 'network_options' => true, 'users' => 'initial' );

		do_action( 'updating_jetpack_version', '4.3', '4.2' );
		$sync_status = Jetpack_Sync_Modules::get_module( 'full-sync' )->get_status();
		$sync_config = $sync_status[ 'config' ];

		$this->assertEquals( $initial_sync_without_users_config, $sync_config );
		$this->assertNotEquals( $initial_sync_with_users_config, $sync_config );

		do_action( 'updating_jetpack_version', '4.2', '4.1' );
		$sync_status = Jetpack_Sync_Modules::get_module( 'full-sync' )->get_status();
		$sync_config = $sync_status[ 'config' ];

		$this->assertEquals( $initial_sync_with_users_config, $sync_config );

	}

	function test_schedules_incremental_sync_cron() {
		// we need to run this again because cron is cleared between tests
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$timestamp = wp_next_scheduled( 'jetpack_sync_cron' );
		// we need to check a while in the past because the task got scheduled at
		// the beginning of the entire test run, not at the beginning of this test :)
		$this->assertTrue( $timestamp > time()-HOUR_IN_SECONDS );
	}

	function test_default_schedule_incremental_sync_cron() {
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$this->assertEquals( Jetpack_Sync_Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_cron' ) );
	}

	function test_filtered_schedule_incremental_sync_cron_works() {
		add_filter( 'jetpack_sync_incremental_sync_interval', array( $this, '__return_hourly_schedule' ) );
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$this->assertEquals( 'hourly', wp_get_schedule( 'jetpack_sync_cron' ) );
	}

	function test_filtered_schedule_incremental_sync_cron_bad_schedule_sanitized() {
		add_filter( 'jetpack_sync_incremental_sync_interval', array( $this, '__return_nonexistent_schedule' ) );
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$this->assertEquals( Jetpack_Sync_Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_cron' ) );
	}

	function test_schedules_full_sync_cron() {
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$timestamp = wp_next_scheduled( 'jetpack_sync_full_cron' );
		$this->assertTrue( $timestamp > time()-HOUR_IN_SECONDS );
	}

	function test_default_schedule_full_sync_cron() {
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$this->assertEquals( Jetpack_Sync_Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_full_cron' ) );
	}

	function test_filtered_schedule_full_sync_cron_works() {
		add_filter( 'jetpack_sync_full_sync_interval', array( $this, '__return_hourly_schedule' ) );
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$this->assertEquals( 'hourly', wp_get_schedule( 'jetpack_sync_full_cron' ) );
	}

	function test_filtered_schedule_full_sync_cron_bad_schedule_sanitized() {
		add_filter( 'jetpack_sync_full_sync_interval', array( $this, '__return_nonexistent_schedule' ) );
		Jetpack_Sync_Actions::init_sync_cron_jobs();
		$this->assertEquals( Jetpack_Sync_Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_full_cron' ) );
	}

	function test_starts_full_sync_on_client_authorized() {
		do_action( 'jetpack_client_authorized', 'abcd1234' );
		$this->assertTrue( Jetpack_Sync_Modules::get_module( 'full-sync' )->is_started() );
	}

	function test_sends_updating_jetpack_version_event() {
		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.3', '4.2.1' );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'updating_jetpack_version' );
		$this->assertEquals( '4.3', $event->args[0] );
		$this->assertEquals( '4.2.1', $event->args[1] );
	}

	function test_cleanup_old_cron_job_on_update() {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'jetpack_sync_send_db_checksum' );

		$this->assertInternalType( 'integer', wp_next_scheduled( 'jetpack_sync_send_db_checksum' ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.3', '4.2.1' );

		$this->assertFalse( wp_next_scheduled( 'jetpack_sync_send_db_checksum' ) );
	}

	function test_loads_sender_if_listener_queues_actions() {
		remove_all_filters( 'jetpack_sync_sender_should_load' );
		Jetpack_Sync_Actions::$sender = null;

		$this->listener->enqueue_action( 'test_action', array( 'test_arg' ), $this->listener->get_sync_queue() );

		$this->assertTrue( ! ! has_filter( 'jetpack_sync_sender_should_load', '__return_true' ) );
		$this->assertTrue( Jetpack_Sync_Actions::$sender !== null );
	}


	function test_adds_full_sync_on_jetpack_plugin_update() {
		if( ! is_multisite() ) {
			$this->markTestSkipped( 'Not applicable for jetpack not running as part of MU.' );
		}

		Jetpack_Options::update_option( 'network_version', 0 );
		// Reset the settings to use the default values.
		Jetpack_Sync_Settings::reset_data();

		$full_config = array(
			'constants' => 1,
			'functions' => 1,
            'options' => 1,
            'network_options' => 1
		);

		$count = 0;
		while( $count < 5 ) {
			$this->factory->blog->create();
			$count++;
		}

		// one more just for good measuer
		$blog_id = $this->factory->blog->create();
		$this->server_replica_storage->reset();
		add_filter( 'jetpack_network_ramp_up_blogs_per_second', array( $this, 'jetpack_network_ramp_up_blogs_per_second' ) );
		// We are staring off with a blank slate
		$this->assertEquals( 0, Jetpack_Options::get_option( 'network_version', 0 ) );

		self::version_update();
		sleep( 1 );
		// instead of waiting for
		Jetpack_Sync_Actions::maybe_start_initial_sync();
		// Test that the main site sync as expected
		$this->assertEquals( JETPACK__VERSION, Jetpack_Options::get_option( 'network_version' ) );

		switch_to_blog( $blog_id );

		self::version_update();
		Jetpack_Sync_Actions::maybe_start_initial_sync();
		// Test that we didn't bump the network version for this site just yet

		$this->assertNotEquals( JETPACK__VERSION, Jetpack_Options::get_option( 'network_version' ) );

		sleep( 1 );

		Jetpack_Sync_Actions::maybe_start_initial_sync();
		$this->assertNotEquals( JETPACK__VERSION, Jetpack_Options::get_option( 'network_version' ) );

		sleep( 3 );
		
		Jetpack_Sync_Actions::maybe_start_initial_sync();
		$this->assertEquals( JETPACK__VERSION, Jetpack_Options::get_option( 'network_version' ) );

		restore_current_blog();
	}

	function test_can_do_inital_sync_method() {
		// Set up
		$current_time = time();
		Jetpack_Options::update_option( 'version', JETPACK__VERSION . ':' . $current_time );

		$this->assertTrue( Jetpack_Sync_Actions::can_do_initial_sync( 1, ( $current_time + 1 ) ) );
		$this->assertTrue( Jetpack_Sync_Actions::can_do_initial_sync( 10, ( $current_time + 1 ) ) );
		$this->assertFalse( Jetpack_Sync_Actions::can_do_initial_sync( 11, ( $current_time + 1 ) ) );

		$this->assertTrue( Jetpack_Sync_Actions::can_do_initial_sync( 11, ( $current_time + 2 ) ) );
		$this->assertTrue( Jetpack_Sync_Actions::can_do_initial_sync( 20, ( $current_time + 2 ) ) );
		$this->assertFalse( Jetpack_Sync_Actions::can_do_initial_sync( 21, ( $current_time + 2 ) ) );

		$this->assertTrue( Jetpack_Sync_Actions::can_do_initial_sync( 1, ( $current_time + 101 ) ) );
		$this->assertTrue( Jetpack_Sync_Actions::can_do_initial_sync( 1001, ( $current_time + 101 ) ) );
		$this->assertTrue( Jetpack_Sync_Actions::can_do_initial_sync( 1010, ( $current_time + 101 ) ) );
		$this->assertFalse( Jetpack_Sync_Actions::can_do_initial_sync( 1011, ( $current_time + 101 ) ) );
	}

	/**
	 * Utility functions
	 */

	function jetpack_network_ramp_up_blogs_per_second( $blogs_per_second ) {
		return 2;
	}

	static function version_update() {
		do_action( 'updating_jetpack_version', JETPACK__VERSION, 'old version' );
		Jetpack_Options::update_option( 'version', JETPACK__VERSION . ':' . time() );
	}

	function __return_hourly_schedule() {
		return 'hourly';
	}

	function __return_nonexistent_schedule() {
		return 'nonexistent';
	}
}
