<?php

$sync_dir = dirname( __FILE__ ) . '/../../../sync/';
require_once $sync_dir . 'class.jetpack-sync-full.php';

function jetpack_foo_full_sync_callable() {
	return 'the value';
}

class WP_Test_Jetpack_New_Sync_Full extends WP_Test_Jetpack_New_Sync_Base {
	private $transients;
	private $full_sync;
	private $start_sent;
	private $end_sent;

	function setUp() {
		parent::setUp();
		$this->full_sync = Jetpack_Sync_Full::getInstance(); 
	}

	function test_enqueues_sync_start_action() {
		$this->full_sync->start();
		$this->client->do_sync();

		$start_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_start' );
		$this->assertTrue( $start_event !== false );
	}

	function test_sync_start_resets_storage() {
		$this->factory->post->create();
		$this->client->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->post_count() );

		do_action( 'jetpack_full_sync_start' );
		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->post_count() );

		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->post_count() );
	}

	function test_full_sync_sends_wp_version() {
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		global $wp_version;
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_wp_version() );
	}

	function test_full_sync_sends_all_posts() {

		for( $i = 0; $i < 88; $i += 1 ) {
			$this->factory->post->create();
		}

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$posts = $this->server_replica_storage->get_posts();

		$this->assertEquals( 88, count( $posts ) );
	}

	function test_full_sync_sends_all_comments() {

		$post = $this->factory->post->create();

		for( $i = 0; $i < 10; $i += 1 ) {
			$this->factory->comment->create_post_comments( $post );
		}

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$comments = $this->server_replica_storage->get_comments();

		$this->assertEquals( 10, count( $comments ) );
	}

	function test_full_sync_sends_all_constants() {
		define( 'TEST_SYNC_ALL_CONSTANTS', 'foo' );
		
		$this->client->set_constants_whitelist( array( 'TEST_SYNC_ALL_CONSTANTS' ) );
		$this->client->do_sync();

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_constant( 'TEST_SYNC_ALL_CONSTANTS' ) );

		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_constant( 'TEST_SYNC_ALL_CONSTANTS' ) );
	}

	function test_full_sync_sends_all_functions() {
		$this->client->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_full_sync_callable' ) );
		$this->client->do_sync();

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'jetpack_foo' ) );

		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 'the value', $this->server_replica_storage->get_callable( 'jetpack_foo' ) );
	}

	function test_full_sync_sends_all_options() {
		$this->client->set_options_whitelist( array( 'my_option', '/^my_prefix/' ) );
		update_option( 'my_option', 'foo' );
		update_option( 'my_prefix_value', 'bar' );
		update_option( 'my_non_synced_option', 'baz');

		$this->client->do_sync();

		// confirm sync worked as expected
		$this->assertEquals( 'foo', $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_non_synced_option' ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_prefix_value' ) );

		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_non_synced_option' ) );
	}

	function test_full_sync_sends_all_post_meta() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'test_meta_key', 'foo' );

		$this->client->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );

		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );
	}

	function test_full_sync_sends_all_comment_meta() {
		$post_id = $this->factory->post->create();
		$comment_ids = $this->factory->comment->create_post_comments( $post_id );
		$comment_id = $comment_ids[0];
		add_comment_meta( $comment_id, 'test_meta_key', 'foo' );

		$this->client->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'comment', $comment_id, 'test_meta_key', true ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'comment', $comment_id, 'test_meta_key', true ) );

		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'comment', $comment_id, 'test_meta_key', true ) );
	}

	function test_full_sync_sends_theme_info() {
		// make sure we don't already use this theme
		$this->assertNotEquals( 'twentyfourteen', get_option( 'stylesheet' ) );

		switch_theme( 'twentyfourteen' );
		$this->client->do_sync();

		$this->assertEquals( 'twentyfourteen', $this->server_replica_storage->get_option( 'stylesheet' ) );

		// now reset the storage and confirm the value is reset
		$this->server_replica_storage->reset();
		$this->assertNotEquals( 'twentyfourteen', $this->server_replica_storage->get_option( 'stylesheet' ) );

		// full sync should restore the value
		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 'twentyfourteen', $this->server_replica_storage->get_option( 'stylesheet' ) );
		$this->assertEquals( get_option( 'theme_mods_twentyfourteen' ),  $this->server_replica_storage->get_option( 'theme_mods_twentyfourteen' ) );
	}

	function test_full_sync_sends_plugin_updates() {

		wp_update_plugins();

		$this->client->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'plugins' );
		$this->assertTrue( $updates->last_checked > strtotime("-2 seconds") );
		
		delete_site_transient( 'update_plugins' );
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'plugins' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->client->do_sync();

		$updates = $this->server_replica_storage->get_updates( 'plugins' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime("-2 seconds") );
	}

	function test_full_sync_sends_theme_updates() {

		wp_update_themes();

		$this->client->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertTrue( $updates->last_checked > strtotime("-2 seconds") );

		// we need to do this because there's a check for elapsed time since last update
		// in the wp_update_themes() function		
		delete_site_transient( 'update_themes' );
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'themes' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->client->do_sync();

		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime("-2 seconds") );
	}

	function test_full_sync_sends_core_updates() {

		_maybe_update_core();

		$this->client->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertTrue( $updates->last_checked > strtotime("-2 seconds") );

		// we need to do this because there's a check for elapsed time since last update
		// in the wp_update_core() function		
		delete_site_transient( 'update_core' );
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'core' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->client->do_sync();

		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime("-2 seconds") );
	}

	function test_full_sync_fires_events_on_send_start_and_end() {
		$this->start_sent = false;
		add_action( 'jetpack_full_sync_start_sent', array( $this, 'set_start_sent_true' ) );

		$this->end_sent = false;
		add_action( 'jetpack_full_sync_end_sent', array( $this, 'set_end_sent_false' ) );

		$this->full_sync->start();

		$this->assertFalse( $this->start_sent );
		$this->assertFalse( $this->end_sent );

		$this->client->do_sync();

		$this->assertTrue( $this->start_sent );
		$this->assertTrue( $this->end_sent );
	}

	function set_start_sent_true() {
		$this->start_sent  = true;
	}
	function set_end_sent_false() {
		$this->end_sent  = true;
	}

	function test_full_sync_sets_status() {

		$this->client->set_send_buffer_size( 1000 );

		$this->transients = array();

		// this is a bit of a hack... relies too much on internals
		add_action( 'setted_transient', array( $this, 'set_transients' ), 10, 3 );

		$this->assertFalse( isset( $this->transients['jetpack_full_sync_progress'] ) );

		$this->full_sync->start();
		$this->assertEquals( array( 'phase' => 'queuing finished' ), $this->transients['jetpack_full_sync_progress'] );

		foreach( Jetpack_Sync_Full::$modules as $data_name ) {
			$this->assertEquals( 100, $this->transients['jetpack_full_sync_progress_'.$data_name]['progress'] );
		}

		$this->client->do_sync();
		$this->assertEquals( array( 'phase' => 'sending finished' ), $this->transients['jetpack_full_sync_progress'] );

		$finished_status = array(
			'phase' => 'sending finished',
			'wp_version' => array( 'progress' => 100 ),
			'constants' => array( 'progress' => 100 ),
			'functions' => array( 'progress' => 100 ),
			'options' => array( 'progress' => 100 ),
			'posts' => array( 'progress' => 100 ),
			'comments' => array( 'progress' => 100 ),
			'themes' => array( 'progress' => 100 ),
		   	'updates' => array( 'progress' => 100 ),
		);

		$this->assertEquals( $finished_status, $this->full_sync->get_complete_status() );
	}

	function set_transients( $transient, $value, $expiration ) {
		if ( preg_match( '/^jetpack_full_sync_progress/', $transient ) ) {
			$this->transients[ $transient ] = $value;
		}
	}
}