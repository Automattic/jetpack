<?php

class Jetpack_Sync_Client {
	private $sync_queue = array();
	private $codec;

	// this is necessary because you can't use "new" when you declare instance properties >:(
	function __construct() {
		$this->codec = new Jetpack_Sync_Deflate_Codec();
	}

	function init() {
		$handler = array( $this, 'action_handler' );

		// posts
		add_action( 'wp_insert_post', $handler, 10, 3 );
		add_action( 'delete_post', $handler, 10 );

		// comments
		add_action( 'wp_insert_comment', $handler, 10, 2 );
		add_action( 'deleted_comment', $handler, 10 );
		add_action( 'trashed_comment', $handler, 10 );

		// even though it's messy, we implement these hooks because the edit_comment hook doesn't include the data
		foreach( array( '', 'trackback', 'pingback' ) as $comment_type ) {
			foreach( array( 'unapproved', 'approved' ) as $comment_status ) {
				add_action( "comment_{$comment_status}_{$comment_type}", $handler, 10, 2 );
			}
		}
	}

	function set_codec( $codec ) {
		$this->codec = $codec;
	}

	function action_handler() {
		$current_filter = current_filter();
		$args = func_get_args();

		$this->sync_queue[] = array(
			$current_filter,
			$args
		);
	}

	function do_sync() {
		$data = $this->codec->encode( $this->sync_queue );
		do_action( 'jetpack_sync_client_send_data', $data );
	}
}

interface iJetpack_Sync_Replicastore {
	public function post_count( $status = null );
	public function get_posts( $status = null );
	public function get_post( $id );
	public function comment_count();
	public function get_comments();
	public function get_comment( $id );
}

class Jetpack_Sync_Server_Replicastore implements iJetpack_Sync_Replicastore {
	private $posts = array();
	private $comments = array();

	function init() {
		add_action( "jetpack_sync_remote_action", array( $this, 'handle_remote_action' ), 10, 2 );
	}

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

	function handle_remote_action( $action_name, $args ) {
		switch( $action_name ) {
			case 'wp_insert_post':
				list( $post_id, $post ) = $args;
				$this->posts[ $post_id ] = $post;
				break;
			case 'delete_post':
				list( $post_id ) = $args;
				unset( $this->posts[ $post_id ] );
				break;
			case 'wp_insert_comment':
				list( $comment_id, $comment ) = $args;
				$this->comments[ $comment_id ] = $comment;
				break;
			case 'deleted_comment':
				list( $comment_id ) = $args;
				unset( $this->comments[ $comment_id ] );
				break;
			case 'trashed_comment':
				list( $comment_id ) = $args;
				$this->comments[ $comment_id ]->comment_approved = 'trash';
				break;
			case ( preg_match('/^comment_(.*)_(.*)$/', $action_name) ? true : false ):
				list( $comment_id, $comment ) = $args;
				$this->comments[ $comment_id ] = $comment;
				break;
			default:
				error_log( "The action '$action_name' is unknown" );
		}
	}
}

// this replica store exists solely so we can compare values in the local WP DB
// to values in the synced replica store
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
}

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

class Jetpack_Sync_Dummy_Server {
	private $codec;

	// this is necessary because you can't use "new" when you declare instance properties >:(
	function __construct() {
		$this->codec = new Jetpack_Sync_Deflate_Codec();
	}

	function set_codec( $codec ) {
		$this->codec = $codec;
	}

	function receive( $data ) {
		$events = $this->codec->decode( $data );
		foreach ( $events as $event ) {
			list( $action_name, $args ) = $event;
			do_action( "jetpack_sync_remote_action", $action_name, $args );	
		}
	}
}

/**
 * Very simple interface for encoding and decoding input 
 **/
interface iJetpack_Sync_Codec {
	public function encode( $object );
	public function decode( $input );
}

class Jetpack_Sync_Deflate_Codec implements iJetpack_Sync_Codec {
	public function encode( $object ) {

		//UNCOMMENT THIS TO PRINT COMPRESSION RATIO
		// $serialized_object = serialize( $object );

		// $size_before = strlen( $serialized_object );
		// // $size_before = strlen( json_encode( $object ) );
		
		// $response = gzdeflate( $serialized_object );
		
		// $size_after = strlen( $response );
		// $percent_compression = ( 1 - ( $size_after / $size_before ) ) * 100;
		// error_log("Percent compression: $percent_compression");

		return gzdeflate( serialize( $object ) );
	}

	public function decode( $input ) {
		return unserialize( gzinflate( $input ) );
	}
}

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
		$this->server_replica_storage->init();

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

class WP_Test_Jetpack_New_Sync_Insert_Post extends WP_Test_Jetpack_New_Sync_Base {

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

class WP_Test_Jetpack_Sync_Server extends WP_UnitTestCase {
	private $server;

	public function setUp() {
		$this->server = new Jetpack_Sync_Dummy_Server();
	}
}