<?php

$sync_dir = dirname( __FILE__ ) . '/../../../sync/';
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

		$this->listener = Jetpack_Sync_Listener::getInstance();
		$this->sender = Jetpack_Sync_Sender::getInstance();

		$this->setSyncClientDefaults();

		$server = new Jetpack_Sync_Server();
		$this->server = $server;

		// bind the sender to the server
		remove_all_filters( 'jetpack_sync_send_data' );
		add_filter( 'jetpack_sync_send_data', array( $this, 'serverReceive' ), 10 , 3 );

		// bind the two storage systems to the server events
		$this->server_replica_storage = new Jetpack_Sync_Test_Replicastore();
		$this->server_replicator      = new Jetpack_Sync_Server_Replicator( $this->server_replica_storage );
		$this->server_replicator->init();

		$this->server_event_storage = new Jetpack_Sync_Server_Eventstore();
		$this->server_event_storage->init();
	}

	public function setSyncClientDefaults() {
		$this->sender->set_defaults();
		foreach( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->set_defaults();
		}
		$this->sender->set_dequeue_max_bytes( 5000000 ); // process 5MB of items at a time
		$this->sender->set_sync_wait_time(0); // disable rate limiting
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

		$local_posts = array_map( array( $posts_sync_module, 'filter_post_content_and_add_links' ), $local->get_posts() );
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

	function serverReceive( $data, $codec, $sent_timestamp ) {
		return $this->server->receive( $data, null, $sent_timestamp );
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
}
