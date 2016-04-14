<?php

$sync_dir = dirname( __FILE__ ) . '/../../../sync/';
$sync_server_dir = dirname( __FILE__ ) . '/server/';
	
require_once $sync_dir . 'class.jetpack-sync-server.php';
require_once $sync_dir . 'class.jetpack-sync-client.php';

require_once $sync_server_dir . 'interface.jetpack-sync-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicastore.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-replicator.php';
require_once $sync_server_dir . 'class.jetpack-sync-server-eventstore.php';
require_once $sync_server_dir . 'class.jetpack-sync-test-replicastore.php';

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

		$this->client = new Jetpack_Sync_Client();
		$this->client->init();

		$server       = new Jetpack_Sync_Server();
		$this->server = $server;

		// bind the client to the server
		add_filter( 'jetpack_sync_client_send_data', function ( $data ) use ( $server ) {
			$server->receive( $data );

			return $data;
		} );

		// bind the two storage systems to the server events
		$this->server_replica_storage = new Jetpack_Sync_Server_Replicastore();
		$this->server_replicator      = new Jetpack_Sync_Server_Replicator( $this->server_replica_storage );
		$this->server_replicator->init();

		$this->server_event_storage = new Jetpack_Sync_Server_Eventstore();
		$this->server_event_storage->init();

	}

	public function test_add_post_fires_sync_data_action_on_do_sync() {
		$action_ran = false;

		add_filter( 'jetpack_sync_client_send_data', function ( $data ) use ( &$action_ran ) {
			$action_ran = true;

			return $data;
		} );

		$this->client->do_sync();

		$this->assertEquals( true, $action_ran );
	}

	public function test_client_allows_optional_codec() {

		// build a codec
		$codec = $this->getMockBuilder( 'iJetpack_Sync_Codec' )->getMock();
		$codec->method( 'encode' )->willReturn( 'foo' );

		// set it on the client
		$this->client->set_codec( $codec );

		// if we don't do this the server will try to decode the dummy data
		remove_all_actions( 'jetpack_sync_client_send_data' );

		$encoded_data = null;
		add_filter( 'jetpack_sync_client_send_data', function ( $data ) use ( &$encoded_data ) {
			$encoded_data = $data;

			return $data;
		} );

		$this->client->do_sync();

		$this->assertEquals( "foo", $encoded_data );
	}

	protected function assertDataIsSynced() {
		$local  = new Jetpack_Sync_Test_Replicastore();
		$remote = $this->server_replica_storage;

		// error_log("local");
		// error_log(print_r($local->get_posts(), 1));
		// error_log("remote");
		// error_log(print_r($remote->get_posts(), 1));

		$this->assertEquals( $local->get_posts(), $remote->get_posts() );
		$this->assertEquals( $local->get_comments(), $remote->get_comments() );
	}
}

/**
 * Testing CRUD on Comments
 */
class WP_Test_Jetpack_New_Sync_Comments extends WP_Test_Jetpack_New_Sync_Base {

	protected $comment;

	public function setUp() {
		parent::setUp();

		$comment_ids = $this->factory->comment->create_post_comments(
			$this->factory->post->create()
		);

		$this->comment = get_comment( $comment_ids[0] );

		$this->client->do_sync();
	}

	public function test_add_comment_syncs_event() {

		$event = $this->server_event_storage->get_most_recent_event();

		$this->assertNotEquals( false, $event );
		$this->assertEquals( 'wp_insert_comment', $event->action );
		$this->assertEquals( $this->comment->comment_ID, $event->args[0] );
		$this->assertEquals( $this->comment, $event->args[1] );
	}

	public function test_add_comment_syncs_comment_data() {
		// post stored by server should equal post in client
		$this->assertEquals( 1, $this->server_replica_storage->comment_count() );
		$this->assertEquals( $this->comment, $this->server_replica_storage->get_comment( $this->comment->comment_ID ) );
	}

	public function test_update_comment() {
		$this->comment->comment_content = "foo bar baz";

		wp_update_comment( (array) $this->comment );

		$this->client->do_sync();

		$remote_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );

		$this->assertEquals( "foo bar baz", $remote_comment->comment_content );
	}

	public function test_trash_comment_trashes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );

		wp_delete_comment( $this->comment );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_delete_comment_deletes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );

		wp_delete_comment( $this->comment, true );

		$this->client->do_sync();

		// there should be no comments at all
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
	}
}
