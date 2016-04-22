<?php

$sync_dir = dirname( __FILE__ ) . '/../../../sync/';
$sync_server_dir = dirname( __FILE__ ) . '/server/';
	
require_once $sync_dir . 'class.jetpack-sync-server.php';
require_once $sync_dir . 'class.jetpack-sync-client.php';

require_once $sync_server_dir . 'interface.jetpack-sync-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicator.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-eventstore.php';
require_once $sync_server_dir . 'class.jetpack-sync-wp-replicastore.php';

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
		$this->client->set_send_buffer_size( 100 );

		$server       = new Jetpack_Sync_Server();
		$this->server = $server;

		// bind the client to the server
		remove_all_filters( 'jetpack_sync_client_send_data' );
		add_filter( 'jetpack_sync_client_send_data', array( $this, 'serverReceive' ) );

		// bind the two storage systems to the server events
		$this->server_replica_storage = new Jetpack_Sync_Server_Replicastore();
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

	protected function assertDataIsSynced() {
		$local  = new Jetpack_Sync_WP_Replicastore();
		$remote = $this->server_replica_storage;

		$this->assertEquals( $local->get_posts(), $remote->get_posts() );
		$this->assertEquals( $local->get_comments(), $remote->get_comments() );
	}

	function serverReceive( $data ) {
		$this->server->receive( $data );
		return $data;
	}

	// TODO:
	// send in near-time cron job if sending buffer fails
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

	function test_client_allows_optional_codec() {

		// build a codec
		$codec = $this->getMockBuilder( 'iJetpack_Sync_Codec' )->getMock();
		$codec->method( 'encode' )->willReturn( 'foo' );

		// set it on the client
		$this->client->set_codec( $codec );

		// if we don't do this the server will try to decode the dummy data
		remove_all_actions( 'jetpack_sync_client_send_data' );

		$this->encoded_data = null;
		add_filter( 'jetpack_sync_client_send_data', array( $this, 'set_encoded_data' ) );

		$this->client->do_sync();

		$this->assertEquals( "foo", $this->encoded_data );
	}

	function test_clear_actions_on_client() {
		$this->factory->post->create();
		$this->assertNotEmpty( $this->client->get_sync_queue()->get_all() );
		$this->client->do_sync();

		$this->client->set_defaults();
		$this->assertEmpty( $this->client->get_sync_queue()->get_all() );
	}

	function test_queues_cron_job_if_queue_exceeds_max_buffer() {
		$this->client->set_send_buffer_size( 5 );

		for ( $i = 0; $i < 20; $i+= 1) {
			$this->factory->post->create();
		}

		$this->client->do_sync();

		$events = $this->server_event_storage->get_all_events();
		$this->assertEquals( 5, count( $events ) );

		$timestamp = wp_next_scheduled( 'jetpack_sync_actions' );
		
		// we're making some assumptions here about how fast the test will run...
		$this->assertTrue( $timestamp >= time()+59 );
		$this->assertTrue( $timestamp <= time()+61 );
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

	function test_never_queues_if_development() {

		add_filter( 'jetpack_development_mode', '__return_false' );

		$queue = $this->client->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		$this->factory->post->create();

		$this->assertEquals( 0, $queue->size() );
	}

	function test_never_queues_if_staging() {

		add_filter( 'jetpack_is_staging_site', '__return_true' );

		$queue = $this->client->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		$this->factory->post->create();

		$this->assertEquals( 0, $queue->size() );
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
