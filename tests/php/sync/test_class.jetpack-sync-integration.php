<?php

class WP_Test_Jetpack_Sync_Integration extends WP_Test_Jetpack_Sync_Base {

	function test_sending_empties_queue() {
		$this->factory->post->create();
		$this->assertNotEmpty( $this->sender->get_sync_queue()->get_all() );
		$this->sender->do_sync();
		$this->assertEmpty( $this->sender->get_sync_queue()->get_all() );
	}

	function test_sends_publish_post_action() {
		$post_id = $this->factory->post->create();
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event();
		$this->assertEquals( 'jetpack_post_published', $event->action );
		$this->assertEquals( $post_id, $event->args[0]['object']->ID );
	}

	function test_upgrading_sends_options_constants_and_callables() {
		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.2', '4.1' );

		global $wpdb;

		$current_user = wp_get_current_user();

		$expected_sync_config = array(
			'options' => true,
			'functions' => true,
			'constants' => true,
			'users' => array( $current_user->ID )
		);

		if ( is_multisite() ) {
			$expected_sync_config['network_options'] = true;
		}
		$sync_status = Jetpack_Sync_Modules::get_module( 'full-sync' )->get_status();

		$this->assertEquals( $sync_status['config'], $expected_sync_config );
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

	function test_starts_full_sync_on_user_authorized() {
		do_action( 'jetpack_user_authorized', 'abcd1234' );
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

	function test_sync_settings_updates_on_upgrade() {
		Jetpack_Sync_Settings::update_settings( array( 'render_filtered_content' => 1 ) );
		Jetpack_Sync_Settings::get_settings();

		$this->assertEquals( 1, Jetpack_Sync_Settings::get_setting( 'render_filtered_content' ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.5', '4.3' );

		$this->assertEquals( 0, Jetpack_Sync_Settings::get_setting( 'render_filtered_content' ) );
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
