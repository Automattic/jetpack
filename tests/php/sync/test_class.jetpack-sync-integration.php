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

		if ( is_multisite( ) ) {
			$event = wp_next_scheduled( 'jetpack_full_sync_on_multisite_jetpack_upgrade_cron', array( true ) );
			$this->assertTrue( ! empty( $event ) );
		} else {
			$this->assertEquals( $sync_status['config'], $expected_sync_config );
		}

	}

	function test_upgrading_from_42_plus_does_not_includes_users_in_initial_sync() {

		$initial_sync_without_users_config = array( 'options' => true, 'functions' => true, 'constants' => true, 'network_options' => true );
		$initial_sync_with_users_config = array( 'options' => true, 'functions' => true, 'constants' => true, 'network_options' => true, 'users' => 'initial' );

		do_action( 'updating_jetpack_version', '4.3', '4.2' );
		$sync_status = Jetpack_Sync_Modules::get_module( 'full-sync' )->get_status();
		$sync_config = $sync_status[ 'config' ];
		if ( is_multisite( ) ) {
			$event = wp_next_scheduled( 'jetpack_full_sync_on_multisite_jetpack_upgrade_cron', array( false ) );
			$this->assertTrue( ! empty( $event ) );
		} else {
			$this->assertEquals( $initial_sync_without_users_config, $sync_config );
			$this->assertNotEquals( $initial_sync_with_users_config, $sync_config );
		}


		do_action( 'updating_jetpack_version', '4.2', '4.1' );
		$sync_status = Jetpack_Sync_Modules::get_module( 'full-sync' )->get_status();
		$sync_config = $sync_status[ 'config' ];
		if ( is_multisite( ) ) {
			$event = wp_next_scheduled( 'jetpack_full_sync_on_multisite_jetpack_upgrade_cron', array( true ) );
			$this->assertTrue( ! empty( $event ) );
		} else {
			$this->assertEquals( $initial_sync_with_users_config, $sync_config );
		}
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

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		// Reset the settings to use the default values.
		Jetpack_Sync_Settings::reset_data();

		$full_config = array(
			'constants' => 1,
			'functions' => 1,
            'options' => 1,
            'network_options' => 1
		);

		add_action( 'jetpack_full_sync_end', array( $this, 'sleep_one_sec') );

		$blog_id = $this->factory->blog->create();
		$this->server_replica_storage->reset();

		$full_sync = $this->full_sync = Jetpack_Sync_Modules::get_module( 'full-sync' );
		Jetpack_Sync_Actions::full_sync_on_multisite_jetpack_upgrade();
		remove_action( 'jetpack_full_sync_end', array( $this, 'sleep_one_sec') );

		$full_sync_status = $full_sync->get_status();
		$this->assertEquals( $full_config, $full_sync_status['config'], 'config is not equal on main blog' );
		$this->assertEquals( $full_config, $full_sync_status['total'], 'total is not equal on main blog' );

		switch_to_blog( $blog_id );

		$full_sync_status_blog_2 = $full_sync->get_status();

		$this->assertNotEquals( $full_sync_status['started'], $full_sync_status_blog_2['started'] );
		$this->assertNotEquals( $full_sync_status['queue_finished'], $full_sync_status_blog_2['queue_finished'] );
		$this->assertEquals( $full_config, $full_sync_status_blog_2['config'], 'config is not equal on secondary blog' );
		$this->assertEquals( $full_config, $full_sync_status_blog_2['total'], 'total is not equal on secondary blog');
	}

	function sleep_one_sec() {
		sleep( 1 );
	}

	/**
	 * Utility functions
	 */

	function __return_hourly_schedule() {
		return 'hourly';
	}

	function __return_nonexistent_schedule() {
		return 'nonexistent';
	}
}
