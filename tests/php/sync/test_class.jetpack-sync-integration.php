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

		$modules = array( 'options' => true, 'network_options' => true, 'functions' => true, 'constants' => true, 'users' => 'initial' );
		$this->assertTrue( wp_next_scheduled( 'jetpack_sync_full', array( $modules ) ) > time()-5 );
	}

	function test_upgrading_from_42_plus_does_not_includes_users_in_initial_sync() {

		$initial_sync_without_users_config = array( 'options' => true, 'network_options' => true, 'functions' => true, 'constants' => true );
		$initial_sync_with_users_config = array( 'options' => true, 'network_options' => true, 'functions' => true, 'constants' => true, 'users' => 'initial' );

		do_action( 'updating_jetpack_version', '4.3', '4.2' );
		$this->assertTrue( Jetpack_Sync_Actions::is_scheduled_full_sync( $initial_sync_without_users_config ) );
		$this->assertFalse( Jetpack_Sync_Actions::is_scheduled_full_sync( $initial_sync_with_users_config ) );

		do_action( 'updating_jetpack_version', '4.2', '4.1' );
		$this->assertTrue( Jetpack_Sync_Actions::is_scheduled_full_sync( $initial_sync_with_users_config ) );
	}

	function test_schedules_regular_sync() {
		// we need to run this again because cron is cleared between tests
		Jetpack_Sync_Actions::init();
		$timestamp = wp_next_scheduled( 'jetpack_sync_cron' );
		// we need to check a while in the past because the task got scheduled at
		// the beginning of the entire test run, not at the beginning of this test :)
		$this->assertTrue( $timestamp > time()-HOUR_IN_SECONDS );
	}

	function test_schedules_full_sync_on_client_authorized() {
		do_action( 'jetpack_client_authorized', 'abcd1234' ); // Jetpack_Options::get_option( 'id' )
		$this->assertTrue( wp_next_scheduled( 'jetpack_sync_full' ) !== false );
	}

	function test_is_scheduled_full_sync_works_with_different_args() {
		$this->assertFalse( Jetpack_Sync_Actions::is_scheduled_full_sync() );

		Jetpack_Sync_Actions::schedule_full_sync( array( 'posts' => true ) );

		$this->assertTrue( (bool) Jetpack_Sync_Actions::is_scheduled_full_sync() );
		$this->assertTrue( (bool) Jetpack_Sync_Actions::is_scheduled_full_sync( array( 'posts' => true ) ) );
		$this->assertFalse( (bool) Jetpack_Sync_Actions::is_scheduled_full_sync( array( 'comments' => true ) ) );
	}

	function test_can_unschedule_all_full_syncs() {
		$this->assertFalse( Jetpack_Sync_Actions::is_scheduled_full_sync() );

		Jetpack_Sync_Actions::schedule_full_sync( array( 'posts' => true ) );
		Jetpack_Sync_Actions::schedule_full_sync( array( 'users' => true ) );

		$this->assertTrue( Jetpack_Sync_Actions::is_scheduled_full_sync() );

		Jetpack_Sync_Actions::unschedule_all_full_syncs();

		$this->assertFalse( Jetpack_Sync_Actions::is_scheduled_full_sync() );
	}

	function test_scheduling_a_full_sync_unschedules_all_future_full_syncs() {
		Jetpack_Sync_Actions::schedule_full_sync( array( 'posts' => true ), 100 ); // 100 seconds in the future
		Jetpack_Sync_Actions::schedule_full_sync( array( 'users' => true ), 200 ); // 200 seconds in the future

		// users sync should have overridden posts sync
		$this->assertFalse( wp_next_scheduled( 'jetpack_sync_full', array( array( 'posts' => true ) ) ) );
		$this->assertTrue( wp_next_scheduled( 'jetpack_sync_full', array( array( 'users' => true ) ) ) >= time() + 199 );
	}

	function test_sends_updating_jetpack_version_event() {
		/** This action is documented in class.jetpack.php */
		do_action( 'updating_jetpack_version', '4.3', '4.2.1' );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'updating_jetpack_version' );
		$this->assertEquals( '4.3', $event->args[0] );
		$this->assertEquals( '4.2.1', $event->args[1] );
	}
}