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
