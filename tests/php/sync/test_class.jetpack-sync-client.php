<?php

$sync_dir = dirname( __FILE__ ) . '/../../../sync/';
$sync_server_dir = dirname( __FILE__ ) . '/server/';
	
require_once $sync_dir . 'class.jetpack-sync-server.php';
require_once $sync_dir . 'class.jetpack-sync-client.php';
require_once $sync_dir . 'class.jetpack-sync-wp-replicastore.php';

require_once $sync_server_dir . 'class.jetpack-sync-test-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicator.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-eventstore.php';

/*
 * Base class for Sync tests - establishes connection between local
 * Jetpack_Sync_Client and dummy server implementation,
 * and registers a Replicastore and Eventstore implementation to 
 * process events.
 */

class WP_Test_Jetpack_New_Sync_Base extends WP_UnitTestCase {
	protected $client;
	protected $server;
	protected $server_replica_storage;
	protected $server_event_storage;

	public function setUp() {
		parent::setUp();

		$this->client = Jetpack_Sync_Client::getInstance();
		$this->client->set_dequeue_max_bytes( 5000000 ); // process 5MB of items at a time
		$this->client->set_sync_wait_time(0); // disable rate limiting

		$server       = new Jetpack_Sync_Server();
		$this->server = $server;

		// bind the client to the server
		remove_all_filters( 'jetpack_sync_client_send_data' );
		add_filter( 'jetpack_sync_client_send_data', array( $this, 'serverReceive' ) );

		// bind the two storage systems to the server events
		$this->server_replica_storage = new Jetpack_Sync_Test_Replicastore();
		$this->server_replicator      = new Jetpack_Sync_Server_Replicator( $this->server_replica_storage );
		$this->server_replicator->init();

		$this->server_event_storage = new Jetpack_Sync_Server_Eventstore();
		$this->server_event_storage->init();

	}

	public function tearDown() {
		parent::tearDown();
		$this->client->set_defaults();
	}

	public function test_pass() {
		// so that we don't have a failing test
		$this->assertTrue( true );
	}

	public function setSyncClientDefaults() {
		$this->client->set_defaults();
		$this->client->set_dequeue_max_bytes( 5000000 ); // process 5MB of items at a time
		$this->client->set_sync_wait_time(0); // disable rate limiting
	}

	protected function assertDataIsSynced() {
		$local  = new Jetpack_Sync_WP_Replicastore();
		$remote = $this->server_replica_storage;

		// Also pass the posts though the same filter other wise they woun't match any more.
		$local_posts = array_map( array( $this->client, 'filter_post_content_and_add_links' ), $local->get_posts() );
		$this->assertEquals( $local_posts, $remote->get_posts() );
		$this->assertEquals( $local->get_comments(), $remote->get_comments() );

	}

	function serverReceive( $data ) {
		return $this->server->receive( $data );
	}

	// TODO:
	// limit overall rate of sending
}

class WP_Test_Jetpack_New_Sync_Client extends WP_Test_Jetpack_New_Sync_Base {
	protected $action_ran;
	protected $encoded_data;

	function test_add_post_fires_sync_data_action_on_do_sync() {
		$this->action_ran = false;

		add_filter( 'jetpack_sync_client_send_data', array( $this, 'action_ran' ) );

		$this->client->do_sync();

		$this->assertEquals( true, $this->action_ran );
	}

	function test_clear_actions_on_client() {
		$this->factory->post->create();
		$this->assertNotEmpty( $this->client->get_sync_queue()->get_all() );
		$this->client->do_sync();

		$this->client->set_defaults();
		$this->assertEmpty( $this->client->get_sync_queue()->get_all() );
	}

	function test_queues_cron_job_if_queue_exceeds_max_buffer() {
		$this->client->set_dequeue_max_bytes( 500 ); // bytes

		for ( $i = 0; $i < 20; $i+= 1) {
			$this->factory->post->create();
		}

		$this->client->do_sync();

		$events = $this->server_event_storage->get_all_events();
		$this->assertTrue( count( $events ) < 20 );

		$timestamp = wp_next_scheduled( 'jetpack_sync_actions' );
		
		// we're making some assumptions here about how fast the test will run...
		$this->assertTrue( $timestamp >= time()+59 );
		$this->assertTrue( $timestamp <= time()+61 );
	}

	function test_can_write_settings() {
		$settings = $this->client->get_settings();

		foreach( array( 'dequeue_max_bytes', 'sync_wait_time', 'upload_max_bytes', 'upload_max_rows' ) as $key ) {
			$this->assertTrue( isset( $settings[ $key ] ) );	
		}

		$settings[ 'dequeue_max_bytes' ] = 50;
		$this->client->update_settings( $settings );

		$updated_settings = $this->client->get_settings();

		$this->assertSame( 50, $updated_settings[ 'dequeue_max_bytes' ] );
	}

	function test_queue_limits_upload_bytes() {
		// flush previous stuff in queue
		$this->client->do_sync();

		$this->client->set_upload_max_bytes( 5000 ); // 5k

		// make the sync client listen for a new action
		add_action( 'my_expanding_action', array( $this->client, 'action_handler' ) );

		// expand these events to a much larger size
		add_filter( "jetpack_sync_before_send_my_expanding_action", array( $this, 'expand_small_action_to_large_size' ) );

		// now let's trigger our action a few times
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );

		// trigger the sync
		$this->client->do_sync();

		// evenstore should only have the first two items
		$events = $this->server_event_storage->get_all_events( 'my_expanding_action' );
		$this->assertEquals( 2, count( $events ) );

		// now let's sync again - our remaining action should be pushed
		$this->client->do_sync();

		$events = $this->server_event_storage->get_all_events( 'my_expanding_action' );
		$this->assertEquals( 3, count( $events ) );
	}

	function test_queue_limits_upload_rows() {
		// flush previous stuff in queue
		$this->client->do_sync();

		$this->client->set_upload_max_rows( 2 ); // 5k

		// make the sync client listen for a new action
		add_action( 'my_action', array( $this->client, 'action_handler' ) );

		// now let's trigger our action a few times
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );

		// trigger the sync
		$this->client->do_sync();

		// evenstore should only have the first two items
		$events = $this->server_event_storage->get_all_events( 'my_action' );
		$this->assertEquals( 2, count( $events ) );

		// now let's sync again - our remaining action should be pushed
		$this->client->do_sync();

		$events = $this->server_event_storage->get_all_events( 'my_action' );
		$this->assertEquals( 3, count( $events ) );
	}

	function test_queue_limits_very_large_object_doesnt_stall_upload() {
		// basically, if an object's serialized size is bigger than the max upload
		// size, we should still upload it, just by itself rather than with others.

		// flush previous stuff in queue
		$this->client->do_sync();

		$this->client->set_upload_max_bytes( 1000 ); // 1k, tiny

		// make the sync client listen for a new action
		add_action( 'my_expanding_action', array( $this->client, 'action_handler' ) );

		// expand these events to a much larger size
		add_filter( "jetpack_sync_before_send_my_expanding_action", array( $this, 'expand_small_action_to_large_size' ) );

		// now let's trigger our action a few times
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );
		do_action( 'my_expanding_action', 'x' );

		// trigger the sync
		$this->client->do_sync();

		// evenstore should have the first item
		$this->assertEquals( 1, count( $this->server_event_storage->get_all_events( 'my_expanding_action' ) ) );

		// ... then the second
		$this->client->do_sync();
		$this->assertEquals( 2, count( $this->server_event_storage->get_all_events( 'my_expanding_action' ) ) );
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

		$queue = $this->client->get_sync_queue();

		$this->factory->post->create();

		$pre_sync_queue_size = $queue->size();
		$this->assertTrue( $pre_sync_queue_size > 0 ); // just to be sure stuff got queued

		define( 'WP_IMPORTING', true );

		$this->client->do_sync();

		// assert that queue hasn't budged
		$this->assertEquals( $pre_sync_queue_size, $queue->size() );

		$timestamp = wp_next_scheduled( 'jetpack_sync_actions' );
		
		// we're making some assumptions here about how fast the test will run...
		$this->assertTrue( $timestamp >= time()+59 );
		$this->assertTrue( $timestamp <= time()+61 );
	}

	function test_rate_limit_how_often_sync_runs_with_option() {
		$this->client->do_sync();

		// so we take multiple syncs to upload
		$this->client->set_upload_max_rows( 2 ); 

		// make the sync client listen for a new action
		add_action( 'my_action', array( $this->client, 'action_handler' ) );

		// now let's trigger our action a few times
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );
		do_action( 'my_action' );

		// now let's try to sync and observe the rate limit
		$this->client->do_sync();

		$this->client->set_sync_wait_time( 2 );
		$this->assertSame( 2, $this->client->get_sync_wait_time() );

		$this->assertEquals( 2, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		sleep( 3 );

		$this->client->do_sync();
		$this->assertEquals( 4, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		$this->client->do_sync();
		$this->assertEquals( 4, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );

		sleep( 3 );

		$this->client->do_sync();
		$this->assertEquals( 5, count( $this->server_event_storage->get_all_events( 'my_action' ) ) );
	}

	function test_never_queues_if_development() {
		$this->markTestIncomplete( "We now check this during 'init', so testing is pretty hard" );
		
		add_filter( 'jetpack_development_mode', '__return_true' );

		$queue = $this->client->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		$this->factory->post->create();

		$this->assertEquals( 0, $queue->size() );
	}

	function test_never_queues_if_staging() {
		$this->markTestIncomplete( "We now check this during 'init', so testing is pretty hard" );

		add_filter( 'jetpack_is_staging_site', '__return_true' );

		$queue = $this->client->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		$this->factory->post->create();

		$this->assertEquals( 0, $queue->size() );
	}

	function test_adds_user_id_to_action() {
		$user_id = $this->factory->user->create();

		wp_set_current_user( $user_id );
		$this->factory->post->create();
		$this->client->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );

		$this->assertEquals( $user_id, $event->user_id );
	}

	function test_sends_publicize_action() {
		$post_id = $this->factory->post->create();
		do_action( 'jetpack_publicize_post', $post_id );
		$this->client->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_publicize_post' );
		$this->assertEquals( $post_id, $event->args[0] );
	}

	function test_adds_timestamp_to_action() {
		$beginning_of_test = microtime(true);

		$this->factory->post->create();
		$this->client->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );

		$this->assertTrue( $event->timestamp > $beginning_of_test );
		$this->assertTrue( $event->timestamp < microtime(true) );
	}

	function action_ran( $data ) {
		$this->action_ran = true;
		return $data;
	}

	function set_encoded_data( $data ) {
		$this->encoded_data = $data;
		return $data;
	}
}
