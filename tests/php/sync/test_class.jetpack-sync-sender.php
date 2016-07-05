<?php

class WP_Test_Jetpack_Sync_Sender extends WP_Test_Jetpack_Sync_Base {
	protected $action_ran;
	protected $encoded_data;

	function test_add_post_fires_sync_data_action_with_codec_on_do_sync() {
		$this->action_ran = false;
		$this->action_codec = null;

		add_filter( 'jetpack_sync_send_data', array( $this, 'action_ran' ), 10, 2 );

		$this->sender->do_sync();

		$this->assertEquals( true, $this->action_ran );
		$this->assertEquals( 'deflate-json', $this->action_codec );
	}

	function test_queues_cron_job_if_queue_exceeds_max_buffer() {
		$this->sender->set_dequeue_max_bytes( 500 ); // bytes

		for ( $i = 0; $i < 20; $i+= 1) {
			$this->factory->post->create();
		}

		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events();
		$this->assertTrue( count( $events ) < 20 );

		$timestamp = wp_next_scheduled( 'jetpack_sync_actions' );

		// we're making some assumptions here about how fast the test will run...
		$this->assertTrue( $timestamp >= time()+59 );
		$this->assertTrue( $timestamp <= time()+61 );
	}

	function test_queue_limits_upload_bytes() {
		// flush previous stuff in queue
		$this->sender->do_sync();

		$this->sender->set_upload_max_bytes( 5000 ); // 5k

		// make the sync listener listen for a new action
		add_action( 'my_expanding_action', array( $this->listener, 'action_handler' ) );

		// expand these events to a much larger size
		add_filter( "jetpack_sync_before_send_my_expanding_action", array( $this, 'expand_small_action_to_large_size' ) );

		// now let's trigger our action a few times
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );

		// trigger the sync
		$this->sender->do_sync();

		// evenstore should only have the first two items
		$events = $this->server_event_storage->get_all_events( 'my_expanding_action' );
		$this->assertEquals( 2, count( $events ) );

		// now let's sync again - our remaining action should be pushed
		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'my_expanding_action' );
		$this->assertEquals( 3, count( $events ) );
	}

	function test_queue_limits_upload_rows() {
		// flush previous stuff in queue
		$this->sender->do_sync();

		$this->sender->set_upload_max_rows( 2 ); // 5k

		// make the sync sender listen for a new action
		add_action( 'my_action', array( $this->listener, 'action_handler' ) );

		// now let's trigger our action a few times
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );

		// trigger the sync
		$this->sender->do_sync();

		// evenstore should only have the first two items
		$events = $this->server_event_storage->get_all_events( 'my_action' );
		$this->assertEquals( 2, count( $events ) );

		// now let's sync again - our remaining action should be pushed
		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'my_action' );
		$this->assertEquals( 3, count( $events ) );

		remove_action( 'my_action', array( $this->listener, 'action_handler' ) );
	}

	function test_queue_limits_very_large_object_doesnt_stall_upload() {
		// basically, if an object's serialized size is bigger than the max upload
		// size, we should still upload it, just by itself rather than with others.

		// flush previous stuff in queue
		$this->sender->do_sync();

		$this->sender->set_upload_max_bytes( 1000 ); // 1k, tiny

		// make the sync sender listen for a new action
		add_action( 'my_expanding_action', array( $this->listener, 'action_handler' ) );

		// expand these events to a much larger size
		add_filter( "jetpack_sync_before_send_my_expanding_action", array( $this, 'expand_small_action_to_large_size' ) );

		// now let's trigger our action a few times
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );

		// trigger the sync
		$this->sender->do_sync();

		// evenstore should have the first item
		$this->assertEquals( 1, count( $this->server_event_storage->get_all_events( 'my_expanding_action' ) ) );

		// ... then the second
		$this->sender->do_sync();
		$this->assertEquals( 2, count( $this->server_event_storage->get_all_events( 'my_expanding_action' ) ) );

		remove_action( 'my_expanding_action', array( $this->listener, 'action_handler' ) );
	}

	// expand the input to 2000 random chars
	function expand_small_action_to_large_size( $args ) {
		// we generate a random string so it's hard to compress (i.e. doesn't shrink when gzencoded)
		$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$charactersLength = strlen($characters);
		$randomString = '';
		for ($i = 0; $i < 2000; $i++) {
			$randomString .= $characters[rand(0, $charactersLength - 1)];
		}
		return $randomString;
	}

	/**
	 * We have to run this in a separate process so we can set the constant without
	 * it interfering with other tests. That's also why we have to reconnect the DB
	 */
	function test_queues_cron_job_if_is_importing() {
		$this->markTestIncomplete("This works but I haven't found a way to undefine the WP_IMPORTING constant when I'm done :(");

		$queue = $this->sender->get_sync_queue();

		$this->factory->post->create();

		$pre_sync_queue_size = $queue->size();
		$this->assertTrue( $pre_sync_queue_size > 0 ); // just to be sure stuff got queued

		define( 'WP_IMPORTING', true );

		$this->sender->do_sync();

		// assert that queue hasn't budged
		$this->assertEquals( $pre_sync_queue_size, $queue->size() );

		$timestamp = wp_next_scheduled( 'jetpack_sync_actions' );

		// we're making some assumptions here about how fast the test will run...
		$this->assertTrue( $timestamp >= time()+59 );
		$this->assertTrue( $timestamp <= time()+61 );
	}

	function test_rate_limit_how_often_sync_runs_with_option() {
		$this->sender->do_sync();

		// so we take multiple syncs to upload
		$this->sender->set_upload_max_rows( 2 );

		// make the sync listener listen for a new action
		add_action( 'my_action', array( $this->listener, 'action_handler' ) );

		// now let's trigger our action a few times
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );

		// now let's try to sync and observe the rate limit
		$this->sender->do_sync();

		$this->sender->set_sync_wait_time( 2 );
		$this->assertSame( 2, $this->sender->get_sync_wait_time() );

		$this->assertEquals( 2, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		sleep( 3 );

		$this->sender->do_sync();
		$this->assertEquals( 4, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		$this->sender->do_sync();
		$this->assertEquals( 4, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		sleep( 3 );

		$this->sender->do_sync();
		$this->assertEquals( 5, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		remove_action( 'my_action', array( $this->listener, 'action_handler' ) );
	}

	function test_enqueue_db_checksum() {
		$this->sender->send_checksum();
		$this->sender->do_sync();

		$checksum_event = $this->server_event_storage->get_most_recent_event( 'sync_checksum' );

		$this->assertNotNull( $checksum_event );
	}

	function test_adds_timestamp_to_action() {
		$beginning_of_test = microtime(true);

		$this->factory->post->create();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );

		$this->assertTrue( $event->timestamp > $beginning_of_test );
		$this->assertTrue( $event->timestamp < microtime(true) );
	}

	function test_adds_user_id_to_action() {
		$user_id = $this->factory->user->create();

		wp_set_current_user( $user_id );
		$this->factory->post->create();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );

		$this->assertEquals( $user_id, $event->user_id );
	}

	function action_ran( $data, $codec ) {
		$this->action_ran = true;
		$this->action_codec = $codec;
		return $data;
	}

	function set_encoded_data( $data ) {
		$this->encoded_data = $data;
		return $data;
	}
}
