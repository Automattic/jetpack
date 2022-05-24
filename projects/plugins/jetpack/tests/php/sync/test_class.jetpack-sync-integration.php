<?php

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Integration extends WP_Test_Jetpack_Sync_Base {

	public function test_sending_empties_queue() {
		$this->factory->post->create();
		$this->assertNotEmpty( $this->sender->get_sync_queue()->get_all() );
		$this->sender->do_sync();
		$this->assertEmpty( $this->sender->get_sync_queue()->get_all() );
	}

	public function test_sends_publish_post_action() {
		$post_id = $this->factory->post->create();
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event();
		$this->assertEquals( 'jetpack_published_post', $event->action );
		$this->assertEquals( $post_id, $event->args[0] );
	}

	public function test_schedules_incremental_sync_cron() {
		// we need to run this again because cron is cleared between tests
		Actions::init_sync_cron_jobs();
		$timestamp = wp_next_scheduled( 'jetpack_sync_cron' );
		// we need to check a while in the past because the task got scheduled at
		// the beginning of the entire test run, not at the beginning of this test :)
		$this->assertTrue( $timestamp > time() - HOUR_IN_SECONDS );
	}

	public function test_default_schedule_incremental_sync_cron() {
		Actions::init_sync_cron_jobs();
		$this->assertEquals( Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_cron' ) );
	}

	public function test_filtered_schedule_incremental_sync_cron_works() {
		add_filter( 'jetpack_sync_incremental_sync_interval', array( $this, 'return_hourly_schedule' ) );
		Actions::init_sync_cron_jobs();
		$this->assertEquals( 'hourly', wp_get_schedule( 'jetpack_sync_cron' ) );
	}

	public function test_filtered_schedule_incremental_sync_cron_bad_schedule_sanitized() {
		add_filter( 'jetpack_sync_incremental_sync_interval', array( $this, 'return_nonexistent_schedule' ) );
		Actions::init_sync_cron_jobs();
		$this->assertEquals( Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_cron' ) );
	}

	public function test_schedules_full_sync_cron() {
		Actions::init_sync_cron_jobs();
		$timestamp = wp_next_scheduled( 'jetpack_sync_full_cron' );
		$this->assertTrue( $timestamp > time() - HOUR_IN_SECONDS );
	}

	public function test_default_schedule_full_sync_cron() {
		Actions::init_sync_cron_jobs();
		$this->assertEquals( Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_full_cron' ) );
	}

	public function test_filtered_schedule_full_sync_cron_works() {
		add_filter( 'jetpack_sync_full_sync_interval', array( $this, 'return_hourly_schedule' ) );
		Actions::init_sync_cron_jobs();
		$this->assertEquals( 'hourly', wp_get_schedule( 'jetpack_sync_full_cron' ) );
	}

	public function test_filtered_schedule_full_sync_cron_bad_schedule_sanitized() {
		add_filter( 'jetpack_sync_full_sync_interval', array( $this, 'return_nonexistent_schedule' ) );
		Actions::init_sync_cron_jobs();
		$this->assertEquals( Actions::DEFAULT_SYNC_CRON_INTERVAL_NAME, wp_get_schedule( 'jetpack_sync_full_cron' ) );
	}

	/**
	 * Test 'jetpack_site_registered' triggers initial sync.
	 */
	public function test_starts_initial_sync_on_site_registered() {
		do_action( 'jetpack_site_registered', 'abcd1234' );
		$this->assertTrue( Modules::get_module( 'full-sync' )->is_started() );
	}

	/**
	 * Test 'jetpack_user_authorized' triggers initial sync.
	 */
	public function test_starts_initial_sync_on_user_authorized() {
		do_action( 'jetpack_user_authorized', 'abcd1234' );
		$this->assertTrue( Modules::get_module( 'full-sync' )->is_started() );
	}

	public function test_sends_updating_jetpack_version_event() {
		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.3', '4.2.1' );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'updating_jetpack_version' );
		$this->assertSame( '4.3', $event->args[0] );
		$this->assertEquals( '4.2.1', $event->args[1] );
	}

	public function test_cleanup_old_cron_job_on_update() {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'jetpack_sync_send_db_checksum' );

		$this->assertIsInt( wp_next_scheduled( 'jetpack_sync_send_db_checksum' ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.3', '4.2.1' );

		$this->assertFalse( wp_next_scheduled( 'jetpack_sync_send_db_checksum' ) );
	}

	public function test_loads_sender_if_listener_queues_actions() {
		remove_all_filters( 'jetpack_sync_sender_should_load' );
		Actions::$sender = null;

		$this->listener->enqueue_action( 'test_action', array( 'test_arg' ), $this->listener->get_sync_queue() );

		$this->assertTrue( has_filter( 'jetpack_sync_sender_should_load' ) );
		$this->assertTrue( Actions::$sender !== null );
	}

	public function test_do_not_load_sender_if_is_cron_and_cron_sync_disabled() {
		Constants::set_constant( 'DOING_CRON', true );
		$settings                  = Settings::get_settings();
		$settings['sync_via_cron'] = 0;
		Settings::update_settings( $settings );
		Actions::$sender = null;

		Actions::add_sender_shutdown();

		$this->assertNull( Actions::$sender );

		Constants::clear_constants();
		Settings::reset_data();
	}

	public function test_cleanup_cron_jobs_with_non_staggered_start() {
		Actions::init_sync_cron_jobs();

		$this->assertIsInt( wp_next_scheduled( 'jetpack_sync_cron' ) );
		$this->assertIsInt( wp_next_scheduled( 'jetpack_sync_full_cron' ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.5', '4.2.1' );

		$this->assertFalse( wp_next_scheduled( 'jetpack_sync_cron' ) );
		$this->assertFalse( wp_next_scheduled( 'jetpack_sync_full_cron' ) );
	}

	public function test_cron_start_time_offset_has_randomness() {
		Actions::clear_sync_cron_jobs();

		if ( is_multisite() ) {
			$values = array();
			for ( $i = 0; $i < 10; $i++ ) {
				$values[] = Actions::get_start_time_offset();
			}

			$this->assertGreaterThan( 1, array_unique( $values ) );

		} else {
			$this->assertSame( 0, Actions::get_start_time_offset() );
		}
	}

	public function test_sync_settings_updates_on_upgrade() {
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );
		Settings::get_settings();

		$this->assertSame( 1, Settings::get_setting( 'render_filtered_content' ) );

		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.5', '4.3' );

		$this->assertSame( 0, Settings::get_setting( 'render_filtered_content' ) );
	}

	public function test_disable_sending_incremental_sync() {
		$this->sender->reset_data();
		$this->sender->do_sync();

		Settings::update_settings( array( 'sync_sender_enabled' => 0 ) );

		$this->server_event_storage->reset();

		$this->factory->post->create_many( 2 );
		$this->sender->do_sync();

		$this->assertEmpty( $this->server_event_storage->get_all_events() );
	}

	public function test_enable_sending_incremental_sync() {
		$this->sender->reset_data();
		$this->sender->do_sync();

		Settings::update_settings( array( 'sync_sender_enabled' => 1 ) );

		$this->server_event_storage->reset();

		$this->factory->post->create_many( 2 );
		$this->sender->do_sync();

		$this->assertNotEmpty( $this->server_event_storage->get_all_events() );
	}

	/**
	 * Utility functions
	 */

	/**
	 * Return "hourly".
	 *
	 * @return string
	 */
	public function return_hourly_schedule() {
		return 'hourly';
	}

	/**
	 * Return "nonexistent".
	 *
	 * @return string
	 */
	public function return_nonexistent_schedule() {
		return 'nonexistent';
	}
}
