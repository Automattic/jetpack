<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-client.php';
/**
 * Sync architecture prototype
 * @author Dan Walmsley
 * To run tests: phpunit --testsuite sync --filter New_Sync
 */

/**
 * A high-level interface for objects that store synced WordPress data
 * Useful for ensuring that different storage mechanisms implement the 
 * required semantics for storing all the data that we sync
 */
interface iJetpack_Sync_Replicastore {
	public function post_count( $status = null );
	public function get_posts( $status = null );
	public function get_post( $id );
	public function upsert_post( $post );
	public function delete_post( $post_id );
	public function comment_count( $status = null );
	public function get_comments( $status = null );
	public function get_comment( $id );
	public function upsert_comment( $comment );
	public function trash_comment( $comment_id );
	public function delete_comment( $comment_id );
}

/**
 * Translates incoming actions from the Jetpack site into mutations on core types
 * In other words: this tries to keep a local datastore in sync with the remote one
 */
class Jetpack_Sync_Server_Replicator {
	private $store;

	function __construct( iJetpack_Sync_Replicastore $store ) {
		$this->store = $store;
	}

	function init() {
		add_action( "jetpack_sync_remote_action", array( $this, 'handle_remote_action' ), 10, 2 );
	}

	function handle_remote_action( $action_name, $args ) {
		switch( $action_name ) {
			case 'wp_insert_post':
				list( $post_id, $post ) = $args;
				$this->store->upsert_post( $post );
				break;
			case 'delete_post':
				list( $post_id ) = $args;
				$this->store->delete_post( $post_id );
				break;
			case 'wp_insert_comment':
			case ( preg_match('/^comment_(.*)_(.*)$/', $action_name) ? true : false ):
				list( $comment_id, $comment ) = $args;
				$this->store->upsert_comment( $comment );
				break;
			case 'deleted_comment':
				list( $comment_id ) = $args;
				$this->store->delete_comment( $comment_id );
				break;
			case 'trashed_comment':
				list( $comment_id ) = $args;
				$this->store->trash_comment( $comment_id );
				break;
			default:
				error_log( "The action '$action_name' is unknown" );
		}
	}
}

/**
 * A simple in-memory implementation of iJetpack_Sync_Replicastore 
 * used for development and testing
 */
class Jetpack_Sync_Server_Replicastore implements iJetpack_Sync_Replicastore {
	private $posts = array();
	private $comments = array();

	function post_count( $status = null ) {
		return count( $this->get_posts( $status ) );
	}

	function get_posts( $status = null ) {
		return array_filter( array_values( $this->posts ), function( $post ) use ($status) {
			$matched_status = ! in_array( $post->post_status, array( 'inherit' ) )
				&& ( $status ? $post->post_status === $status : true );
			
			return $matched_status;
		} );
	}

	function get_post( $id ) {
		return $this->posts[ $id ];
	}

	function upsert_post( $post ) {
		$this->posts[ $post->ID ] = $post;
	}

	function delete_post( $post_id ) {
		unset( $this->posts[ $post_id ] );
	}

	function comment_count( $status = null ) {
		return count( $this->get_comments( $status ) );
	}

	function get_comments( $status = null ) {
		// valid statuses: 'hold', 'approve', 'spam', or 'trash'.
		return array_filter( array_values( $this->comments ), function( $comment ) use ($status) {
			switch ( $status ) {
				case 'approve':
					return $comment->comment_approved === "1";
				case 'hold':
					return $comment->comment_approved === "0";
				case 'spam':
					return $comment->comment_approved === 'spam';
				case 'trash':
					return $comment->comment_approved === 'trash';
				case 'any':
					return true;
				case 'all':
					return true;
				default: 
					return true;
			}
		} );
	}

	function get_comment( $id ) {
		return $this->comments[ $id ];
	}

	function upsert_comment( $comment ) {
		$this->comments[ $comment->comment_ID ] = $comment;
	}

	function trash_comment( $comment_id ) {
		$this->comments[ $comment_id ]->comment_approved = 'trash';
	}

	function delete_comment( $comment_id ) {
		unset( $this->comments[ $comment_id ] );
	}
}

/**
 * An implementation of iJetpack_Sync_Replicastore which returns data stored in a WordPress.org DB.
 * This is useful to compare values in the local WP DB to values in the synced replica store
 */
class Jetpack_Sync_Test_Replicastore implements iJetpack_Sync_Replicastore {
	public function post_count( $status = null ) {
		return count( $this->get_posts( $status ) );
	}
	
	public function get_posts( $status = null ) {
		$args = array( 'orderby' => 'ID' );

		if ( $status ) {
			$args[ 'post_status' ] = $status;
		} else {
			$args[ 'post_status' ] = 'any';
		}

		return get_posts( $args );
	}

	public function get_post( $id ) {
		return get_post( $id );
	}

	public function upsert_post( $post ) {
		wp_update_post( $post );
	}

	public function delete_post( $post_id ) {
		wp_delete_post( $post_id, true );
	}

	public function comment_count( $status = null ) {
		return count( $this->get_comments() );
	}

	public function get_comments( $status = null ) {
		$args = array( 'orderby' => 'ID', 'status' => 'all' );

		if ( $status ) {
			$args[ 'status' ] = $status;
		} 

		return get_comments( $args );
	}

	public function get_comment( $id ) {
		return get_comment( $id );
	}

	public function upsert_comment( $comment ) {
		wp_update_comment( (array) $comment );
	}

	public function trash_comment( $comment_id ) {
		wp_delete_comment( $comment_id );
	}

	public function delete_comment( $comment_id ) {
		wp_delete_comment( $comment_id, true );
	}
}

/**
 * Just stores a buffer of received events
 */
class Jetpack_Sync_Server_Eventstore {
	private $events = array();

	function init() {
		add_action( "jetpack_sync_remote_action", array( $this, 'handle_remote_action' ), 10, 2 );
	}

	function handle_remote_action( $action_name, $args ) {
		$this->events[] = (object) array( 'action' => $action_name, 'args' => $args );
	}

	function get_most_recent_event() {
		return $this->events[count($this->events)-1];
	}
}

/**
 * Simple version of a Jetpack Sync Server - just receives arrays of events and
 * issues them locally with the 'jetpack_sync_remote_action' action.
 */
class Jetpack_Sync_Dummy_Server {
	private $codec;

	// this is necessary because you can't use "new" when you declare instance properties >:(
	function __construct() {
		$this->codec = new Jetpack_Sync_Deflate_Codec();
	}

	function set_codec( iJetpack_Sync_Codec $codec ) {
		$this->codec = $codec;
	}

	function receive( $data ) {
		$events = $this->codec->decode( $data );
		foreach ( $events as $event ) {
			list( $action_name, $args ) = $event;
			/**
			 * Fires when an action is received from a remote Jetpack site
			 *
			 * @since 4.1
			 *
			 * @param string $action_name The name of the action executed on the remote site
			 * @param array $args The arguments passed to the action
			 */
			do_action( "jetpack_sync_remote_action", $action_name, $args );	
		}
	}
}

/**
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

		$server = new Jetpack_Sync_Dummy_Server();
		$this->server = $server;

		// bind the client to the server
		add_action( 'jetpack_sync_client_send_data', function( $data ) use ( $server ) {
			$server->receive( $data );
		} );

		// bind the two storage systems to the server events
		$this->server_replica_storage = new Jetpack_Sync_Server_Replicastore();
		$this->server_replicator = new Jetpack_Sync_Server_Replicator( $this->server_replica_storage );
		$this->server_replicator->init();

		$this->server_event_storage = new Jetpack_Sync_Server_Eventstore();
		$this->server_event_storage->init();

	}	

	public function test_add_post_fires_sync_data_action_on_do_sync() {
		$action_ran = false;

		add_action( 'jetpack_sync_client_send_data', function( $data ) use ( &$action_ran ) {
			$action_ran = true;
		} );

		$this->client->do_sync();

		$this->assertEquals( true, $action_ran );
	}

	public function test_client_allows_optional_codec() {

		// build a codec
		$codec = $this->getMockBuilder('iJetpack_Sync_Codec')->getMock();
        $codec->method('encode')->willReturn('foo');

        // set it on the client
		$this->client->set_codec( $codec );

		// if we don't do this the server will try to decode the dummy data
		remove_all_actions( 'jetpack_sync_client_send_data' );

		$encoded_data = NULL;
		add_action( 'jetpack_sync_client_send_data', function( $data ) use ( &$encoded_data ) {
			$encoded_data = $data;
		} );

		$this->client->do_sync();

		$this->assertEquals( "foo", $encoded_data );
	}

	protected function assertDataIsSynced() {
		$local = new Jetpack_Sync_Test_Replicastore();
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
 * Testing CRUD on Posts
 */
class WP_Test_Jetpack_New_Sync_Post extends WP_Test_Jetpack_New_Sync_Base {

	protected $post;

	public function setUp() {
		parent::setUp();

		// create a post
		$post_id = $this->factory->post->create();
		$this->post = get_post( $post_id );

		$this->client->do_sync();
	}

	public function test_add_post_syncs_event() {
		// event stored by server should event fired by client
		$event = $this->server_event_storage->get_most_recent_event();

		$this->assertEquals( 'wp_insert_post', $event->action );
		$this->assertEquals( $this->post->ID, $event->args[0] );
		$this->assertEquals( $this->post, $event->args[1] );
	}

	public function test_add_post_syncs_post_data() {
		// post stored by server should equal post in client
		$this->assertEquals( 1, $this->server_replica_storage->post_count() );
		$this->assertEquals( $this->post, $this->server_replica_storage->get_post( $this->post->ID ) );
	}

	public function test_trash_post_trashes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->post_count( 'publish' ) );

		wp_delete_post( $this->post->ID );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->post_count( 'publish' ) );
		$this->assertEquals( 1, $this->server_replica_storage->post_count( 'trash' ) );
	}

	public function test_delete_post_deletes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->post_count( 'publish' ) );

		wp_delete_post( $this->post->ID, true );

		$this->client->do_sync();

		// there should be no posts at all
		$this->assertEquals( 0, $this->server_replica_storage->post_count() );
	}

	public function test_update_post_updates_data() {
		$this->post->post_content = "foo bar";

		wp_update_post( $this->post );

		$this->client->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( "foo bar", $remote_post->post_content );

		$this->assertDataIsSynced();
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

/**
 * Testing the server in isolation
 */
class WP_Test_Jetpack_Sync_Server extends WP_UnitTestCase {
	private $server;

	public function setUp() {
		$this->server = new Jetpack_Sync_Dummy_Server();
	}
}