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
require_once $sync_server_dir . 'class.jetpack-sync-test-helper.php';

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
	protected $server_replicator;
	protected $server_replica_storage;
	protected $server_event_storage;

	public function setUp() {
		$this->listener = Jetpack_Sync_Listener::get_instance();
		$this->sender   = Jetpack_Sync_Sender::get_instance();

		parent::setUp();

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
		// don't sync callables or constants every time - slows down tests
		set_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME, 60 );
		set_transient( Jetpack_Sync_Module_Constants::CONSTANTS_AWAIT_TRANSIENT_NAME, 60 );
	}

	protected function resetCallableAndConstantTimeouts() {
		delete_transient( Jetpack_Sync_Module_Callables::CALLABLES_AWAIT_TRANSIENT_NAME );
		delete_transient( Jetpack_Sync_Module_Constants::CONSTANTS_AWAIT_TRANSIENT_NAME );	
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

	function pre_http_request_success() {
		return array( 'body' => json_encode( array( 'success' => true ) ) );
	}
}

