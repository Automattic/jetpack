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
	private $full_sync_end_checksum;

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
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_callable( 'wp_version' ) );
	}

	function test_full_sync_sends_all_posts_except_revisions() {

		register_post_type( 'random_post_type', array() );

		for( $i = 0; $i < 10; $i += 1 ) {
			$this->factory->post->create();
		}

		$this->factory->post->create( array( 'post_type' => 'revision' ) );
		$post_id = $this->factory->post->create( array( 'post_type' => 'random_post_type' ) );

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$posts = $this->server_replica_storage->get_posts();

		$this->assertEquals( 11, count( $posts ) );
	}

	function test_sync_post_filtered_content_was_filtered_when_syncing_all() {
		$post_id    = $this->factory->post->create();
		$post = get_post( $post_id );
		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );
		$post->post_content = "[foo]";
		wp_update_post( $post );
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$post_on_server = $this->server_replica_storage->get_post( $post->ID );
		$this->assertEquals( $post_on_server->post_content, '[foo]' );
		$this->assertEquals( trim( $post_on_server->post_content_filtered ),  'bar' );
	}

	function foo_shortcode() {
		return 'bar';
	}

	function test_full_sync_sends_all_comments() {
		$post = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post, 11 );
	
		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$comments = $this->server_replica_storage->get_comments();
		$this->assertEquals( 11, count( $comments ) );
	}

	function test_full_sync_expands_comment_meta() {
		$post_id = $this->factory->post->create();
		list( $comment_ID ) = $this->factory->comment->create_post_comments( $post_id );

		add_comment_meta( $comment_ID, 'hc_post_as', 'wordpress', true );
		add_comment_meta( $comment_ID, 'hc_wpcom_id_sig', 'abcd1234', true );
		add_comment_meta( $comment_ID, 'hc_foreign_user_id', 55, true );

		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$comments = $this->server_replica_storage->get_comments();
		$comment = $comments[0];
		$this->assertObjectHasAttribute( 'meta', $comment );
		$this->assertEquals( 'wordpress', $comment->meta['hc_post_as'] );
		$this->assertEquals( 'abcd1234', $comment->meta['hc_wpcom_id_sig'] );
		$this->assertEquals( 55, $comment->meta['hc_foreign_user_id'] );
	}

	function test_full_sync_sends_all_terms() {

		for( $i = 0; $i < 11; $i += 1 ) {
			wp_insert_term( 'term'.$i, 'post_tag' );
		}

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$terms = $this->server_replica_storage->get_terms( 'post_tag' );
		$this->assertEquals( 11, count( $terms ) );
	}

	function test_full_sync_sends_all_users() {
		for( $i = 0; $i < 10; $i += 1 ) {
			$user_id = $this->factory->user->create();
		}

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->client->reset_data();

		$this->full_sync->start();
		$this->client->do_sync();

		$users = get_users();
		// 10 + 1 = 1 users gets always created.


		$this->assertEquals( 11, $this->server_replica_storage->user_count() );
		$user = $this->server_replica_storage->get_user( $user_id );
		// Lets make sure that we don't send users passwords around.
		$this->assertFalse( isset( $user->data->user_pass ) );
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
		$this->client->set_options_whitelist( array( 'my_option', 'my_prefix_value' ) );
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
	// to test run phpunit -c tests/php.multisite.xml --filter test_full_sync_sends_all_network_options
	function test_full_sync_sends_all_network_options() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$this->client->set_network_options_whitelist( array( 'my_option', 'my_prefix_value' ) );
		update_site_option( 'my_option', 'foo' );
		update_site_option( 'my_prefix_value', 'bar' );
		update_site_option( 'my_non_synced_option', 'baz');

		$this->client->do_sync();

		// confirm sync worked as expected
		$this->assertEquals( 'foo', $this->server_replica_storage->get_site_option( 'my_option' ) ,'' );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_site_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_non_synced_option' ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_option' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_prefix_value' ) );

		$this->full_sync->start();
		$this->client->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_site_option( 'my_option' ) , 'Network options not synced during full sync');
		$this->assertEquals( 'bar', $this->server_replica_storage->get_site_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_non_synced_option' ) );
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

	function test_full_sync_sends_all_post_terms() {
		$post_id = $this->factory->post->create();
		wp_set_object_terms( $post_id, 'tag', 'post_tag' );

		$this->client->do_sync();
		$terms = get_the_terms( $post_id, 'post_tag' );

		$this->assertEquals( $terms, $this->server_replica_storage->get_the_terms( $post_id, 'post_tag' ), 'Initial sync doesn\'t work' );
		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_the_terms( $post_id, 'post_tag' , 'Not empty') );
		$this->full_sync->start();
		$this->client->do_sync();

		$terms = array_map( array( $this, 'upgrade_terms_to_pass_test' ), $terms );
		$this->assertEquals( $terms, $this->server_replica_storage->get_the_terms( $post_id, 'post_tag' ), 'Full sync doesn\'t work' );
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
		$this->assertTrue( $updates->last_checked > strtotime("-10 seconds") );
		
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'plugins' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->client->do_sync();

		$updates = $this->server_replica_storage->get_updates( 'plugins' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime("-10 seconds"), 'Last checked is less then 2 seconds: ' . $updates->last_checked . ' - lest then 10 sec:' . strtotime( "-10 seconds" ) );
	}

	function test_full_sync_sends_theme_updates() {

		wp_update_themes();

		$this->client->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertTrue( $updates->last_checked > strtotime("-2 seconds") );

		// we need to do this because there's a check for elapsed time since last update
		// in the wp_update_themes() function		
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'themes' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->client->do_sync();

		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime("-10 seconds") );
	}

	function test_full_sync_sends_core_updates() {

		_maybe_update_core();

		$this->client->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertTrue( $updates->last_checked > strtotime("-10 seconds") );

		// we need to do this because there's a check for elapsed time since last update
		// in the wp_update_core() function		
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'core' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->client->do_sync();

		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime("-10 seconds") );
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

	function test_full_sync_end_sends_checksums() {
		add_action( 'jetpack_full_sync_end', array( $this, 'record_full_sync_end_checksum' ), 10, 1 );

		$this->full_sync->start();
		$this->client->do_sync();
		$this->client->do_sync();
		$this->client->do_sync();

		$this->assertTrue( isset( $this->full_sync_end_checksum ) );
		$this->assertTrue( isset( $this->full_sync_end_checksum['posts'] ) );
		$this->assertTrue( isset( $this->full_sync_end_checksum['comments'] ) );
	}

	function record_full_sync_end_checksum( $checksum ) {
		$this->full_sync_end_checksum = $checksum;
	}

	function create_dummy_data_and_empty_the_queue() {

		// lets create a bunch of posts
		for ( $i = 0; $i < 20; $i += 1 ) {
			$post = $this->factory->post->create();
		}
		// lets create a bunch of comments
		$this->factory->comment->create_post_comments( $post, 11 );

		// reset the data before the full sync
		$this->client->reset_data();

	}

	function test_full_sync_status_should_be_not_started_after_reset() {
		$this->create_dummy_data_and_empty_the_queue();

		$full_sync_status = $this->full_sync->get_status();
		$this->assertEquals(
			$full_sync_status,
			array(
				'started' => null,
				'queue_finished' => null,
				'sent_started' => null,
				'finished' => null,
				'sent' => array(),
				'queue' => array(),
			)
		);
	}

	function test_full_sync_status_after_start() {
		$this->create_dummy_data_and_empty_the_queue();

		$this->full_sync->start();

		$full_sync_status = $this->full_sync->get_status();

		$should_be_status = array(
			'queue' => array(
				'constants'       => 1,
				'functions'       => 1,
				'options'         => 1,
				'posts'           => 2,
				'comments'        => 2,
				'themes'          => 1,
				'updates'         => 1,
				'users'           => 1,
				'terms'           => 1
			),
		);
		if ( is_multisite() ) {
			$should_be_status['queue']['network_options'] = 1;
		}

		$this->assertEquals( $full_sync_status['queue'], $should_be_status['queue'] );
		$this->assertInternalType( 'int', $full_sync_status['started'] );
		$this->assertInternalType( 'int', $full_sync_status['queue_finished'] );
		$this->assertNull( $full_sync_status['sent_started'] );
		$this->assertNull( $full_sync_status['finished'] );
		$this->assertInternalType( 'array', $full_sync_status['sent'] );
	}

	function test_full_sync_status_after_end() {
		$this->create_dummy_data_and_empty_the_queue();

		$this->full_sync->start();
		$this->client->do_sync();

		$full_sync_status = $this->full_sync->get_status();

		$should_be_status = array(
			'sent' => array(
				'constants'       => 1,
				'functions'       => 1,
				'options'         => 1,
				'posts'           => 2,
				'comments'        => 2,
				'themes'          => 1,
				'updates'         => 1,
				'users'           => 1,
				'terms'           => 1
			),
			'queue' => array(
				'constants'       => 1,
				'functions'       => 1,
				'options'         => 1,
				'posts'           => 2,
				'comments'        => 2,
				'themes'          => 1,
				'updates'         => 1,
				'users'           => 1,
				'terms'           => 1
			)
		);
		if ( is_multisite() ) {
			$should_be_status['queue']['network_options'] = 1;
			$should_be_status['sent']['network_options'] = 1;
		}

		$this->assertEquals( $full_sync_status['queue'], $should_be_status['queue'] );
		$this->assertEquals( $full_sync_status['sent'], $should_be_status['sent'] );
		$this->assertInternalType( 'int', $full_sync_status['started'] );
		$this->assertInternalType( 'int', $full_sync_status['queue_finished'] );
		$this->assertInternalType( 'int', $full_sync_status['sent_started'] );
		$this->assertInternalType( 'int', $full_sync_status['finished'] );

	}

	function upgrade_terms_to_pass_test( $term ) {
		global $wp_version;
		if ( version_compare( $wp_version, '4.4', '<' ) ) {
			unset( $term->filter );
		}
		return $term;
	}
}