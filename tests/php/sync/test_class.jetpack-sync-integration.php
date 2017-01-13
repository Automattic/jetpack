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
		
		$this->assertEquals( $sync_status['config'], $expected_sync_config );
	}

	function test_upgrading_from_42_plus_does_not_start_an_initial_sync() {

		$initial_sync_with_users_config = array( 'options' => true, 'functions' => true, 'constants' => true, 'network_options' => true, 'users' => 'initial' );

		do_action( 'updating_jetpack_version', '4.3', '4.2' );
		$sync_status = Jetpack_Sync_Modules::get_module( 'full-sync' )->get_status();
		$sync_config = $sync_status[ 'config' ];

		$this->assertNull( $sync_config );
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

		$this->assertTrue( !! has_filter( 'jetpack_sync_sender_should_load', '__return_true' ) );
		$this->assertTrue( Jetpack_Sync_Actions::$sender !== null );
	}

	function test_cleanup_cron_jobs_with_non_staggered_start() {
		Jetpack_Sync_Actions::init_sync_cron_jobs();

		$this->assertInternalType( 'integer', wp_next_scheduled( 'jetpack_sync_cron' ) );
		$this->assertInternalType( 'integer', wp_next_scheduled( 'jetpack_sync_full_cron' ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.5', '4.2.1' );

		$this->assertFalse( wp_next_scheduled( 'jetpack_sync_cron' ) );
		$this->assertFalse( wp_next_scheduled( 'jetpack_sync_full_cron' ) );
	}

	function test_cron_start_time_offset_has_randomness() {
		Jetpack_Sync_Actions::clear_sync_cron_jobs();

		if ( is_multisite() ) {
			$values = array();
			for ( $i = 0; $i < 10; $i++ ) {
				$values[] = Jetpack_Sync_Actions::get_start_time_offset();
			}

			$this->assertGreaterThan( 1, array_unique( $values ) );

		} else {
			$this->assertEquals( 0, Jetpack_Sync_Actions::get_start_time_offset() );
		}
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
