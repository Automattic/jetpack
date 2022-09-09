<?php

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sync\Dedicated_Sender;
use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Lock;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\Callables;
use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Sender extends WP_Test_Jetpack_Sync_Base {
	protected $action_ran;
	protected $action_codec;
	protected $action_timestamp;
	protected $encoded_data;
	protected $filter_ran;

	/**
	 * Whether a dedicated Sync request was spawned.
	 *
	 * @var bool
	 */
	protected $dedicated_sync_request_spawned;

	/**
	 * Setting up the testing environment.
	 */
	public function set_up() {
		parent::set_up();

		// Setting the Dedicated Sync check transient here to avoid making a test
		// request every time dedicated Sync setting is updated.
		set_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT, Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING );

		$this->dedicated_sync_request_spawned = false;
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();

		// Restore default setting.
		Settings::update_settings( array( 'dedicated_sync_enabled' => 0 ) );

		delete_transient( Dedicated_Sender::DEDICATED_SYNC_CHECK_TRANSIENT );

		// Reset queue.
		$this->sender->get_sync_queue()->reset();

		$_SERVER['REQUEST_URI'] = '';
	}

	public function test_add_post_fires_sync_data_action_with_codec_and_timestamp_on_do_sync() {
		// some trivial action so that there's an item in the queue
		self::factory()->post->create();

		$start_test_timestamp   = microtime( true );
		$this->action_ran       = false;
		$this->action_codec     = null;
		$this->action_timestamp = null;

		add_filter( 'jetpack_sync_send_data', array( $this, 'action_ran' ), 10, 3 );

		$this->sender->do_sync();

		$this->assertTrue( $this->action_ran );
		$this->assertEquals( 'deflate-json-array', $this->action_codec );
		$this->assertNotNull( $this->action_timestamp );
		$this->assertTrue( $this->action_timestamp > $start_test_timestamp );
		$this->assertTrue( $this->action_timestamp < microtime( true ) );
	}

	public function test_queue_limits_upload_bytes() {
		// flush previous stuff in queue
		$this->sender->do_sync();

		$this->sender->set_upload_max_bytes( 5000 ); // 5k

		// make the sync listener listen for a new action
		add_action( 'my_expanding_action', array( $this->listener, 'action_handler' ) );

		// expand these events to a much larger size
		add_filter(
			'jetpack_sync_before_send_my_expanding_action',
			array(
				$this,
				'expand_small_action_to_large_size',
			)
		);

		// now let's trigger our action a few times
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );

		// trigger the sync
		$this->sender->do_sync();

		// evenstore should only have the first two items
		$events = $this->server_event_storage->get_all_events( 'my_expanding_action' );
		$this->assertCount( 2, $events );

		// now let's sync again - our remaining action should be pushed
		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'my_expanding_action' );
		$this->assertCount( 3, $events );
	}

	public function test_queue_limits_upload_rows() {
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
		$this->assertCount( 2, $events );

		// now let's sync again - our remaining action should be pushed
		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'my_action' );
		$this->assertCount( 3, $events );

		remove_action( 'my_action', array( $this->listener, 'action_handler' ) );
	}

	public function test_queue_limits_very_large_object_doesnt_stall_upload() {
		// basically, if an object's serialized size is bigger than the max upload
		// size, we should still upload it, just by itself rather than with others.

		// flush previous stuff in queue
		$this->sender->do_sync();

		$this->sender->set_upload_max_bytes( 1000 ); // 1k, tiny

		// make the sync sender listen for a new action
		add_action( 'my_expanding_action', array( $this->listener, 'action_handler' ) );

		// expand these events to a much larger size
		add_filter(
			'jetpack_sync_before_send_my_expanding_action',
			array(
				$this,
				'expand_small_action_to_large_size',
			)
		);

		// now let's trigger our action a few times
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );

		// trigger the sync
		$this->sender->do_sync();

		// evenstore should have the first item
		$this->assertCount( 1, $this->server_event_storage->get_all_events( 'my_expanding_action' ) );

		// ... then the second
		$this->sender->do_sync();
		$this->assertCount( 2, $this->server_event_storage->get_all_events( 'my_expanding_action' ) );

		remove_action( 'my_expanding_action', array( $this->listener, 'action_handler' ) );
	}

	// expand the input to 2000 random chars
	public function expand_small_action_to_large_size() {
		// we generate a random string so it's hard to compress (i.e. doesn't shrink when gzencoded)
		$characters        = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$characters_length = strlen( $characters );
		$random_string     = '';
		for ( $i = 0; $i < 2000; $i ++ ) {
			$random_string .= $characters[ rand( 0, $characters_length - 1 ) ];
		}

		return $random_string;
	}

	public function test_rate_limit_how_often_sync_runs_with_option() {
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

		$this->assertCount( 2, $this->server_event_storage->get_all_events( 'my_action' ) );

		sleep( 3 );

		$next_sync_time = $this->sender->get_next_sync_time( 'sync' );
		$this->assertTrue( $this->sender->do_sync() );
		$this->assertCount( 4, $this->server_event_storage->get_all_events( 'my_action' ) );

		// because we synced, next sync time should be further in the future
		$this->assertTrue( $next_sync_time < $this->sender->get_next_sync_time( 'sync' ) );

		// doesn't sync second time
		$result = $this->sender->do_sync();
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertEquals( 'sync_throttled', $result->get_error_code() );
		$this->assertCount( 4, $this->server_event_storage->get_all_events( 'my_action' ) );

		sleep( 3 );

		$this->assertTrue( $this->sender->do_sync() );
		$this->assertCount( 6, $this->server_event_storage->get_all_events( 'my_action' ) );

		remove_action( 'my_action', array( $this->listener, 'action_handler' ) );
	}

	public function test_enqueue_db_checksum() {
		$this->sender->send_checksum();
		$this->sender->do_sync();

		$checksum_event = $this->server_event_storage->get_most_recent_event( 'sync_checksum' );

		$this->assertNotNull( $checksum_event );
	}

	public function test_adds_timestamp_to_action() {
		$beginning_of_test = microtime( true );

		self::factory()->post->create();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );

		$this->assertTrue( $event->timestamp > $beginning_of_test );
		$this->assertTrue( $event->timestamp < microtime( true ) );
	}

	public function test_adds_user_id_to_action() {
		$user_id = self::factory()->user->create();

		wp_set_current_user( $user_id );
		self::factory()->post->create();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );

		$this->assertEquals( $user_id, $event->user_id );
	}

	public function test_sends_sent_time_to_server() {
		$beginning_of_test = microtime( true );

		self::factory()->post->create();

		$before_sync = microtime( true );

		$this->sender->do_sync();

		$after_sync = microtime( true );

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );

		$this->assertTrue( $event->sent_timestamp > $beginning_of_test );
		$this->assertTrue( $event->sent_timestamp > $before_sync );
		$this->assertTrue( $event->sent_timestamp < $after_sync );
		$this->assertTrue( $event->sent_timestamp < microtime( true ) );
	}

	public function test_sends_queue_id_to_server() {
		add_action( 'my_incremental_action', array( $this->listener, 'action_handler' ) );

		do_action( 'my_incremental_action' );

		$this->sender->do_sync();

		$incremental_event = $this->server_event_storage->get_most_recent_event( 'my_incremental_action' );

		$this->assertEquals( $incremental_event->queue, $this->listener->get_sync_queue()->id );

		remove_action( 'my_incremental_action', array( $this->listener, 'action_handler' ) );
	}

	public function test_reset_module_also_resets_full_sync_lock() {
		$full_sync = Modules::get_module( 'full-sync' );
		$full_sync->start();
		$this->assertTrue( $full_sync->is_started() );

		$full_sync->reset_data();

		$this->assertFalse( $full_sync->is_started() );
	}

	public function test_waits_one_minute_on_server_error_with_last_item() {
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceiveWithTrailingError' ), 10, 3 );

		self::factory()->post->create();
		$this->sender->do_sync();

		$this->assertTrue( $this->sender->get_next_sync_time( 'sync' ) > time() + 55 );
	}

	public function test_waits_ten_seconds_on_queue_lock_with_last_item() {
		$this->sender->get_sync_queue()->lock( 0 );

		self::factory()->post->create();
		$this->sender->do_sync();

		$next_sync_time = $this->sender->get_next_sync_time( 'sync' );
		$this->assertTrue( $next_sync_time > time() + 5 );
		$this->assertTrue( $next_sync_time < time() + 15 );
	}

	public function serverReceiveWithTrailingError( $data, $codec, $sent_timestamp ) {
		$processed_item_ids = $this->server->receive( $data, null, $sent_timestamp );

		// add an error at the end
		$processed_item_ids[] = new WP_Error( 'an_error', 'An Error Occurred' );

		return $processed_item_ids;
	}

	public function test_waits_one_minute_on_server_error_with_entire_request() {
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceiveWithError' ) );

		self::factory()->post->create();
		$this->sender->do_sync();

		$this->assertTrue( $this->sender->get_next_sync_time( 'sync' ) > time() + 55 );
	}

	public function serverReceiveWithError() {
		return new WP_Error( 'an_error', 'An Error Occurred' );
	}

	public function test_delays_next_send_if_exceeded_sync_wait_threshold() {
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceiveWithThreeSecondDelay' ) );
		$this->sender->set_sync_wait_time( 10 );     // 10 second delay
		$this->sender->set_sync_wait_threshold( 2 ); // wait no matter what

		self::factory()->post->create();

		add_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );
		$this->sender->do_sync();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_success' ) );

		$this->assertTrue( $this->sender->get_next_sync_time( 'sync' ) > time() + 8 );
	}

	public function test_default_value_for_max_execution_time() {
		// test with strings, non-strings, 0 and null

		ini_set( 'max_execution_time', '30' );
		$this->assertEquals( 10, Defaults::get_max_sync_execution_time() );

		ini_set( 'max_execution_time', 65 );
		$this->assertEquals( 21, Defaults::get_max_sync_execution_time() );

		ini_set( 'max_execution_time', '0' );
		$this->assertEquals( 20, Defaults::get_max_sync_execution_time() );

		ini_set( 'max_execution_time', null );
		$this->assertEquals( 20, Defaults::get_max_sync_execution_time() );
	}

	public function test_limits_execution_time_of_do_sync() {
		// disable sync callables
		set_transient( Callables::CALLABLES_AWAIT_TRANSIENT_NAME, 60 );
		$this->sender->do_sync();

		$this->assertSame( 0, $this->sender->get_sync_queue()->size() );

		$this->sender->set_max_dequeue_time( 4 );

		add_filter( 'jetpack_sync_before_send_super_slow_action', array( $this, 'before_send_super_slow_action' ) );

		// register the action to be synced
		add_action( 'super_slow_action', array( $this->listener, 'action_handler' ) );

		// it should only dequeue 2 of these, because each takes 3 seconds to process, and 3*2 = 6, which is > 4
		do_action( 'super_slow_action' );
		do_action( 'super_slow_action' );
		do_action( 'super_slow_action' );

		$this->assertEquals( 3, $this->sender->get_sync_queue()->size() );

		$this->sender->do_sync();

		// should have aborted after 2 actions
		$this->assertSame( 1, $this->sender->get_sync_queue()->size() );

		remove_filter( 'jetpack_sync_before_send_super_slow_action', array( $this, 'before_send_super_slow_action' ) );
	}

	public function test_doesnt_log_actions_during_sync_send() {
		// plugins like snitch and secupress create posts during http requests,
		// which can result in recursive sync, or at least syncing a TON of data
		// so we try to unhook right before send, and rehook right after

		$args = array(
			'public' => true,
			'label'  => 'HttpListener',
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

		// Clean up.
		unregister_post_type( 'http_listener' );

		$this->assertFalse( $event );
	}

	public function test_do_not_send_empty_queue_clear_skipped_items() {
		$this->filter_ran = false;
		$sync_queue       = $this->listener->get_sync_queue();
		$sync_queue->reset();
		add_action( 'foo_action', array( $this->listener, 'action_handler' ) );
		add_filter( 'jetpack_sync_send_data', array( $this, 'run_filter' ) );
		// log http_listener during send data, since in test we're not sending real HTTP requests
		add_filter( 'jetpack_sync_before_send_foo_action', '__return_false' );

		do_action( 'foo_action' );
		$this->sender->do_sync();
		remove_filter( 'jetpack_sync_send_data', array( $this, 'run_filter' ) );

		$this->assertFalse( false, 'ran filter jetpack_sync_send_data' );

		$event = $this->server_event_storage->get_most_recent_event( 'foo_action' );
		$this->assertFalse( $event, 'Event data present' );
		$this->assertFalse( $sync_queue->has_any_items(), "We didn't empty the queue" );
	}

	public function test_sender_get_sync_object_for_post() {
		$post_id = self::factory()->post->create();

		$response = $this->sender->sync_object( array( 'posts', 'post', $post_id ) );

		$codec          = $this->sender->get_codec();
		$decoded_object = $codec->decode( $response );

		$this->assertEquals( $post_id, $decoded_object->ID );
	}

	public function test_sender_sync_object_returns_false_if_missing() {
		$response = $this->sender->sync_object( array( 'posts', 'post', 1000 ) );

		$codec          = $this->sender->get_codec();
		$decoded_object = $codec->decode( $response );

		$this->assertFalse( $decoded_object );
	}

	public function test_sender_get_sync_object_for_user() {
		$user_id = self::factory()->user->create();

		$response = $this->sender->sync_object( array( 'users', 'user', $user_id ) );

		$codec          = $this->sender->get_codec();
		$decoded_object = $codec->decode( $response );

		$this->assertFalse( isset( $decoded_object->user_pass ) );

		$this->assertEquals( $user_id, $decoded_object->ID );
	}

	/**
	 * Verify that do_full_sync does not return true for default settings.
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_full_sync_return_default_settings() {

		// delete existing options.
		delete_option( 'jetpack_sync_full_status' );

		$result = $this->sender->do_full_sync();

		// False or WP_Error is expected.
		$this->assertNotTrue( $result );

	}

	/**
	 * Verify that do_full_sync returns TRUE when Full Sync is in progress.
	 *
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_full_sync_return_in_progress() {

		// Initialize a Full Sync (all modules).
		$full_sync = Modules::get_module( 'full-sync' );
		$full_sync->start();

		// Modify send_duration so we don't send all data at once.
		Settings::update_settings( array( 'full_sync_send_duration' => 0 ) );

		$result = $this->sender->do_full_sync();
		// True is expected.
		$this->assertTrue( $result );
	}

	/**
	 * Verify that do_full_sync returns FALSE when Full Sync is complete.
	 *
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_full_sync_return_complete() {

		// udpate settings to In Progress.
		$settings = array(
			'started'  => '1594051403',
			'finished' => '1594051404',
			'progress' => array(),
			'config'   => array(),
		);
		\Jetpack_Options::update_raw_option( 'jetpack_sync_full_status', $settings );

		$result = $this->sender->do_full_sync();

		// FALSE is expected.
		$this->assertFalse( $result );
	}

	/**
	 * Verify that do_full_sync returns TRUE when Full Sync has a send lock.
	 *
	 * For more context see p1HpG7-9pe-p2.
	 */
	public function test_do_full_sync_return_send_lock() {

		// udpate settings to In Progress.
		$settings = array(
			'started'  => true,
			'finished' => false,
			'progress' => array(),
			'config'   => array(),
		);
		\Jetpack_Options::update_raw_option( 'jetpack_sync_full_status', $settings );

		// establish lock.
		$this->assertNotFalse( ( new Lock() )->attempt( 'full_sync' ) );

		$result = $this->sender->do_full_sync();

		// TRUE is expected.
		$this->assertTrue( $result );

		( new Lock() )->remove( 'full_sync', true );
	}

	/**
	 * Validate that WP_Error is returned in do_sync if JETPACK_SYNC_READ_ONLY is defined and true.
	 */
	public function test_do_sync_errors_if_read_only() {
		Constants::set_constant( 'JETPACK_SYNC_READ_ONLY', true );

		self::factory()->post->create();
		$response = $this->sender->do_sync();
		Constants::clear_single_constant( 'JETPACK_SYNC_READ_ONLY' );

		$this->assertTrue( is_wp_error( $response ) );
	}

	/**
	 * Validate that WP_Error is returned in do_full_sync if JETPACK_SYNC_READ_ONLY is defined and true.
	 */
	public function test_do_full_sync_errors_if_read_only() {
		Constants::set_constant( 'JETPACK_SYNC_READ_ONLY', true );

		self::factory()->post->create();
		$response = $this->sender->do_full_sync();
		Constants::clear_single_constant( 'JETPACK_SYNC_READ_ONLY' );

		$this->assertTrue( is_wp_error( $response ) );
	}

	/**
	 * Test do_sync will spawn a dedicated Sync request when the corresponding setting is enabled.
	 */
	public function test_do_sync_spawns_dedicated_sync_request() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		self::factory()->post->create();

		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ), 10, 3 );
		$this->sender->do_sync();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ) );

		$this->assertTrue( $this->dedicated_sync_request_spawned );
	}

	/**
	 * Test do_sync will NOT spawn a dedicated Sync request when the corresponding setting is enabled if the Sync queue is empty.
	 */
	public function test_do_sync_will_not_spawn_dedicated_sync_request_with_empty_queue() {
		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		// Empty the queue after updating dedicated_sync_enabled, otherwise
		// a corresponding Sync action will be added as we are syncing this setting as well.
		$this->sender->get_sync_queue()->reset();

		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ), 10, 3 );
		$result = $this->sender->do_sync();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ) );

		$this->assertFalse( $this->dedicated_sync_request_spawned );
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertEquals( 'empty_queue_sync', $result->get_error_code() );
	}

	/**
	 * Test do_sync will NOT spawn a dedicated Sync request when the corresponding setting is enabled if the Sync queue is locked.
	 */
	public function test_do_sync_will_not_spawn_dedicated_sync_request_with_locked_queue() {
		$this->sender->get_sync_queue()->lock( 0 );

		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );

		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ), 10, 3 );
		$result = $this->sender->do_sync();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ) );

		$this->assertFalse( $this->dedicated_sync_request_spawned );
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertEquals( 'locked_queue_sync', $result->get_error_code() );
	}

	/**
	 * Test do_dedicated_sync_and_exit will NOT re-spawn a dedicated Sync request if queue is empty.
	 */
	public function test_do_dedicated_sync_and_exit_will_not_re_spawn_dedicated_sync_request_with_empty_queue() {
		$this->expectException( ExitException::class );

		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		self::factory()->post->create();
		// Current "request" is dedicated Sync request.
		$_SERVER['REQUEST_URI'] = rest_url( 'jetpack/v4/sync/spawn-sync' );

		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ), 10, 3 );
		$result = $this->sender->do_dedicated_sync_and_exit();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ) );

		$this->assertFalse( $this->dedicated_sync_request_spawned );
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertEquals( 'empty_queue_sync', $result->get_error_code() );
	}

	/**
	 * Test do_dedicated_sync_and_exit will NOT re-spawn a dedicated Sync request if queue is locked.
	 */
	public function test_do_dedicated_sync_and_exit_will_not_re_spawn_dedicated_sync_request_with_locked_queue() {
		$this->expectException( ExitException::class );

		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		$this->sender->get_sync_queue()->lock( 0 );
		self::factory()->post->create();
		// Current "request" is dedicated Sync request.
		$_SERVER['REQUEST_URI'] = rest_url( 'jetpack/v4/sync/spawn-sync' );

		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ), 10, 3 );
		$result = $this->sender->do_dedicated_sync_and_exit();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ) );

		$this->assertFalse( $this->dedicated_sync_request_spawned );
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertEquals( 'locked_queue_sync', $result->get_error_code() );
	}

	/**
	 * Test do_dedicated_sync_and_exit will re-spawn a dedicated Sync request.
	 */
	public function test_do_dedicated_sync_and_exit_will_re_spawn_dedicated_sync_request() {
		$this->expectException( ExitException::class );

		Settings::update_settings( array( 'dedicated_sync_enabled' => 1 ) );
		// Process one action at each run.
		$this->sender->set_upload_max_rows( 1 );
		// Trigger two new actions.
		self::factory()->post->create();
		self::factory()->post->create();
		// Current "request" is dedicated Sync request.
		$_SERVER['REQUEST_URI'] = rest_url( 'jetpack/v4/sync/spawn-sync' );

		add_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ), 10, 3 );
		$result = $this->sender->do_dedicated_sync_and_exit();
		remove_filter( 'pre_http_request', array( $this, 'pre_http_sync_request_spawned' ) );

		$this->assertTrue( $this->dedicated_sync_request_spawned );
		$this->assertTrue( $result );
	}

	public function run_filter( $data ) {
		$this->filter_ran = true;
		return $data;
	}

	public function create_http_listener_post_and_return_processed_ids( $data ) {
		$post_id = self::factory()->post->create( array( 'post_type' => 'http_listener' ) ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array_keys( $data );
	}

	public function before_send_super_slow_action( $args ) {
		sleep( 3 );
		return $args;
	}

	public function serverReceiveWithThreeSecondDelay( $data ) {
		sleep( 3 );
		return array_keys( $data );
	}

	public function action_ran( $data, $codec, $sent_timestamp ) {
		$this->action_ran       = true;
		$this->action_codec     = $codec;
		$this->action_timestamp = $sent_timestamp;

		return $data;
	}

	public function set_encoded_data( $data ) {
		$this->encoded_data = $data;

		return $data;
	}

	/**
	 * Intercept HTTP request to run Sync and mock the response.
	 * Should be hooked on the `pre_http_request` filter.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args The request arguments.
	 * @param string $url The request URL.
	 *
	 * @return array
	 */
	public function pre_http_sync_request_spawned( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->dedicated_sync_request_spawned = strpos( $url, 'spawn-sync' ) > 0;

		return array(
			'response'    => array(
				'code' => 200,
			),
			'status_code' => 200,
			'body'        => Dedicated_Sender::DEDICATED_SYNC_VALIDATION_STRING,
		);
	}
}
