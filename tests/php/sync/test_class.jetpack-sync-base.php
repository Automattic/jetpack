<?php

$sync_dir        = dirname( __FILE__ ) . '/../../../sync/';
$sync_server_dir = dirname( __FILE__ ) . '/server/';

require_once $sync_dir . 'class.jetpack-sync-server.php';
require_once $sync_dir . 'class.jetpack-sync-users.php';
require_once $sync_dir . 'class.jetpack-sync-listener.php';
require_once $sync_dir . 'class.jetpack-sync-sender.php';
require_once $sync_dir . 'class.jetpack-sync-wp-replicastore.php';

require_once $sync_server_dir . 'class.jetpack-sync-test-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicator.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-eventstore.php';

/*
 * Base class for Sync tests - establishes connection between local
 * Jetpack_Sync_Sender and dummy server implementation,
 * and registers a Replicastore and Eventstore implementation to
 * process events.
 */

class WP_Test_Jetpack_Sync_Base extends WP_UnitTestCase {
	protected $listener;
	protected $sender;

	protected $server;
	protected $server_replica_storage;
	protected $server_event_storage;

	public function setUp() {
		parent::setUp();

		$this->listener = Jetpack_Sync_Listener::get_instance();
		$this->sender   = Jetpack_Sync_Sender::get_instance();

		$this->setSyncClientDefaults();

		$this->server = new Jetpack_Sync_Server();

		// bind the sender to the server
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceive' ), 10, 4 );

		// bind the two storage systems to the server events
		$this->server_replica_storage = new Jetpack_Sync_Test_Replicastore();
		$this->server_replicator      = new Jetpack_Sync_Server_Replicator( $this->server_replica_storage );
		$this->server_replicator->init();

		$this->server_event_storage = new Jetpack_Sync_Server_Eventstore();
		$this->server_event_storage->init();
	}

	public function setSyncClientDefaults() {
		$this->sender->set_defaults();
		Jetpack_Sync_Modules::set_defaults();
		$this->sender->set_dequeue_max_bytes( 5000000 ); // process 5MB of items at a time
		$this->sender->set_sync_wait_time( 0 ); // disable rate limiting
	}

	public function test_pass() {
		// so that we don't have a failing test
		$this->assertTrue( true );
	}

	protected function assertDataIsSynced() {
		$local  = new Jetpack_Sync_WP_Replicastore();
		$remote = $this->server_replica_storage;

		// Also pass the posts though the same filter other wise they woun't match any more.
		$posts_sync_module = new Jetpack_Sync_Module_Posts();

		$local_posts = array_map( array(
			$posts_sync_module,
			'filter_post_content_and_add_links'
		), $local->get_posts() );
		$this->assertEquals( $local_posts, $remote->get_posts() );
		$this->assertEquals( $local->get_comments(), $remote->get_comments() );

	}

	// asserts that two objects are the same if they're both "objectified",
	// i.e. json_encoded and then json_decoded
	// this is useful because we json encode everything sent to the server
	protected function assertEqualsObject( $object_1, $object_2, $message = null ) {
		$this->assertEquals( $this->objectify( $object_1 ), $this->objectify( $object_2 ), $message );
	}

	protected function objectify( $instance ) {
		$codec = $this->sender->get_codec();

		return $codec->decode( $codec->encode( $instance ) );
	}

	function serverReceive( $data, $codec, $sent_timestamp, $queue_id ) {
		return $this->server->receive( $data, null, $sent_timestamp, $queue_id );
	}
}

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
		do_action( 'updating_jetpack_version', '4.1', '4.2' );

		$modules = array( 'options' => true, 'network_options' => true, 'functions' => true, 'constants' => true, 'users' => 'initial' );
		$this->assertTrue( wp_next_scheduled( 'jetpack_sync_full', array( $modules ) ) > time()-5 );
	}

	function test_schedules_regular_sync() {
		// we need to run this again because cron is cleared between tests
		Jetpack_Sync_Actions::init(); 
		$timestamp = wp_next_scheduled( 'jetpack_sync_cron' );
		// we need to check a while in the past because the task got scheduled at 
		// the beginning of the entire test run, not at the beginning of this test :)
		$this->assertTrue( $timestamp > time()-HOUR_IN_SECONDS );
	}

	function test_enqueues_full_sync_after_import() {
		do_action( 'import_end' );
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
}
