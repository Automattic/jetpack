<?php

class WP_Test_Jetpack_Sync_Sender extends WP_Test_Jetpack_Sync_Base {
	protected $action_ran;
	protected $action_codec;
	protected $action_timestamp;
	protected $encoded_data;

	function test_add_post_fires_sync_data_action_with_codec_and_timestamp_on_do_sync() {
		// some trivial action so that there's an item in the queue
		$this->factory->post->create();

		$start_test_timestamp   = microtime( true );
		$this->action_ran       = false;
		$this->action_codec     = null;
		$this->action_timestamp = null;

		add_filter( 'jetpack_sync_send_data', array( $this, 'action_ran' ), 10, 3 );

		$this->sender->do_sync();

		$this->assertEquals( true, $this->action_ran );
		$this->assertEquals( 'deflate-json-array', $this->action_codec );
		$this->assertNotNull( $this->action_timestamp );
		$this->assertTrue( $this->action_timestamp > $start_test_timestamp );
		$this->assertTrue( $this->action_timestamp < microtime( true ) );
	}

	function test_queue_limits_upload_bytes() {
		// flush previous stuff in queue
		$this->sender->do_sync();

		$this->sender->set_upload_max_bytes( 5000 ); // 5k

		// make the sync listener listen for a new action
		add_action( 'my_expanding_action', array( $this->listener, 'action_handler' ) );

		// expand these events to a much larger size
		add_filter( "jetpack_sync_before_send_my_expanding_action", array(
			$this,
			'expand_small_action_to_large_size'
		) );

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
		add_filter( "jetpack_sync_before_send_my_expanding_action", array(
			$this,
			'expand_small_action_to_large_size'
		) );

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
		$characters       = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$charactersLength = strlen( $characters );
		$randomString     = '';
		for ( $i = 0; $i < 2000; $i ++ ) {
			$randomString .= $characters[ rand( 0, $charactersLength - 1 ) ];
		}

		return $randomString;
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
		do_action( 'my_action' );

		// now let's try to sync and observe the rate limit
		$this->sender->do_sync();

		$this->sender->set_sync_wait_time( 2 );
		$this->sender->set_sync_wait_threshold( 0 ); // wait no matter what
		$this->assertSame( 2, $this->sender->get_sync_wait_time() );

		$this->assertEquals( 2, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		sleep( 3 );

		$next_sync_time = $this->sender->get_next_sync_time( 'sync' );
		$this->assertTrue( $this->sender->do_sync() );
		$this->assertEquals( 4, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		// because we synced, next sync time should be further in the future
		$this->assertTrue( $next_sync_time < $this->sender->get_next_sync_time( 'sync' ) );

		// doesn't sync second time
		$result = $this->sender->do_sync();
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertEquals( 'sync_throttled', $result->get_error_code() );
		$this->assertEquals( 4, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		sleep( 3 );

		$this->assertTrue( $this->sender->do_sync() );
		$this->assertEquals( 6, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		remove_action( 'my_action', array( $this->listener, 'action_handler' ) );
	}

	function test_enqueue_db_checksum() {
		$this->sender->send_checksum();
		$this->sender->do_sync();

		$checksum_event = $this->server_event_storage->get_most_recent_event( 'sync_checksum' );

		$this->assertNotNull( $checksum_event );
	}

	function test_adds_timestamp_to_action() {
		$beginning_of_test = microtime( true );

		$this->factory->post->create();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_post_published' );

		$this->assertTrue( $event->timestamp > $beginning_of_test );
		$this->assertTrue( $event->timestamp < microtime( true ) );
	}

	function test_adds_user_id_to_action() {
		$user_id = $this->factory->user->create();

		wp_set_current_user( $user_id );
		$this->factory->post->create();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_post_published' );

		$this->assertEquals( $user_id, $event->user_id );
	}

	function test_sends_sent_time_to_server() {
		$beginning_of_test = microtime( true );

		$this->factory->post->create();

		$before_sync = microtime( true );

		$this->sender->do_sync();

		$after_sync = microtime( true );

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_post_published' );

		$this->assertTrue( $event->sent_timestamp > $beginning_of_test );
		$this->assertTrue( $event->sent_timestamp > $before_sync );
		$this->assertTrue( $event->sent_timestamp < $after_sync );
		$this->assertTrue( $event->sent_timestamp < microtime( true ) );
	}

	function test_sends_queue_id_to_server() {
		add_action( 'my_incremental_action', array( $this->listener, 'action_handler' ) );
		add_action( 'my_full_sync_action', array( $this->listener, 'full_sync_action_handler' ) );

		do_action( 'my_incremental_action' );
		do_action( 'my_full_sync_action' );

		$this->sender->do_sync();
		$this->sender->do_full_sync();

		$incremental_event = $this->server_event_storage->get_most_recent_event( 'my_incremental_action' );
		$full_sync_event = $this->server_event_storage->get_most_recent_event( 'my_full_sync_action' );

		$this->assertEquals( $incremental_event->queue, $this->listener->get_sync_queue()->id );
		$this->assertEquals( $full_sync_event->queue, $this->listener->get_full_sync_queue()->id );

		remove_action( 'my_incremental_action', array( $this->listener, 'action_handler' ) );
		remove_action( 'my_full_sync_action', array( $this->listener, 'full_sync_action_handler' ) );
	}

	function test_reset_module_also_resets_full_sync_lock() {
		$full_sync = Jetpack_Sync_Modules::get_module( 'full-sync' );
		$full_sync->start();
		$status = $full_sync->get_status();
		$this->assertTrue( $full_sync->is_started() );

		$full_sync->reset_data();

		$this->assertFalse( $full_sync->is_started() );
	}

	function test_waits_one_minute_on_server_error_with_last_item() {
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceiveWithTrailingError' ), 10, 3 );

		$this->factory->post->create();
		$this->sender->do_sync();

		$this->assertTrue( $this->sender->get_next_sync_time( 'sync' ) > time() + 55 );
	}

	function test_waits_ten_seconds_on_queue_lock_with_last_item() {
		$this->sender->get_sync_queue()->lock(0);

		$this->factory->post->create();
		$this->sender->do_sync();

		$next_sync_time = $this->sender->get_next_sync_time( 'sync' );
		$this->assertTrue( $next_sync_time > time() + 5 );
		$this->assertTrue( $next_sync_time < time() + 15 );
	}

	function serverReceiveWithTrailingError( $data, $codec, $sent_timestamp ) {
		$processed_item_ids = $this->server->receive( $data, null, $sent_timestamp );

		// add an error at the end
		$processed_item_ids[] = new WP_Error( 'an_error', 'An Error Occurred' );

		return $processed_item_ids;
	}

	function test_waits_one_minute_on_server_error_with_entire_request() {
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceiveWithError' ), 10, 3 );

		$this->factory->post->create();
		$this->sender->do_sync();

		$this->assertTrue( $this->sender->get_next_sync_time( 'sync' ) > time() + 55 );
	}

	function serverReceiveWithError( $data, $codec, $sent_timestamp ) {
		return new WP_Error( 'an_error', 'An Error Occurred' );
	}

	function test_delays_next_send_if_exceeded_sync_wait_threshold() {
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceiveWithThreeSecondDelay' ), 10, 3 );
		$this->sender->set_sync_wait_time( 10 );     // 10 second delay
		$this->sender->set_sync_wait_threshold( 2 ); // wait no matter what

		$this->factory->post->create();

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$this->sender->do_sync();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->assertTrue( $this->sender->get_next_sync_time( 'sync' ) > time() + 9 );
	}

	function test_default_value_for_max_execution_time() {
		// test with strings, non-strings, 0 and null

		ini_set( 'max_execution_time', '30' );
		$this->assertEquals( 10, Jetpack_Sync_Defaults::get_max_sync_execution_time() );

		ini_set( 'max_execution_time', 65 );
		$this->assertEquals( 21, Jetpack_Sync_Defaults::get_max_sync_execution_time() );

		ini_set( 'max_execution_time', '0' );
		$this->assertEquals( 20, Jetpack_Sync_Defaults::get_max_sync_execution_time() );

		ini_set( 'max_execution_time', null );
		$this->assertEquals( 20, Jetpack_Sync_Defaults::get_max_sync_execution_time() );
	}

	function test_limits_execution_time_of_do_sync() {
		// disable sync callables
		set_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME, 60 );
		$this->sender->do_sync();

		$this->assertEquals( 0, $this->sender->get_sync_queue()->size() );

		$this->sender->set_max_dequeue_time( 4 );

		add_filter( 'jetpack_sync_before_send_super_slow_action', array( $this, 'before_send_super_slow_action' ), 10, 2 );

		// register the action to be synced
		add_action( 'super_slow_action', array( $this->listener, 'action_handler' ) );

		// it should only dequeue 2 of these, because each takes 3 seconds to process, and 3*2 = 6, which is > 4
		do_action( 'super_slow_action' );
		do_action( 'super_slow_action' );
		do_action( 'super_slow_action' );

		$this->assertEquals( 3, $this->sender->get_sync_queue()->size() );

		$this->sender->do_sync();

		// should have aborted after 2 actions
		$this->assertEquals( 1, $this->sender->get_sync_queue()->size() );

		remove_filter( 'jetpack_sync_before_send_super_slow_action', array( $this, 'before_send_super_slow_action' ) );
	}

	function test_doesnt_log_actions_during_sync_send() {
		// plugins like snitch and secupress create posts during http requests,
		// which can result in recursive sync, or at least syncing a TON of data
		// so we try to unhook right before send, and rehook right after

		$args = array(
			'public' => true,
			'label'  => 'HttpListener'
		);
		register_post_type( 'http_listener', $args );

		// register a trivial action we use to force sync
		add_action( 'my_action', array( $this->listener, 'action_handler' ) );

		// log http_listener during send data, since in test we're not sending real HTTP requests
		add_filter( 'jetpack_sync_send_data', array( $this, 'create_http_listener_post_and_return_processed_ids' ), 10, 1 );

		// hopefully no http_listener events created here
		do_action( 'my_action' );
		$this->sender->do_sync();

		$this->server_event_storage->reset();

		// do a trivial data change, then check we didn't enqueue a http_listener post
		do_action( 'my_action' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );

		$this->assertFalse( $event );
	}

	function create_http_listener_post_and_return_processed_ids( $data ) {
		$post_id = $this->factory->post->create( array( 'post_type' => 'http_listener' ) );
		return array_keys( $data );
	}

	function before_send_super_slow_action( $args, $user_id ) {
		sleep( 3 );
		return $args;
	}

	function serverReceiveWithThreeSecondDelay( $data, $codec, $sent_timestamp ) {
		sleep( 3 );
		return array_keys( $data );
	}

	function action_ran( $data, $codec, $sent_timestamp ) {
		$this->action_ran       = true;
		$this->action_codec     = $codec;
		$this->action_timestamp = $sent_timestamp;

		return $data;
	}

	function set_encoded_data( $data ) {
		$this->encoded_data = $data;

		return $data;
	}
}
