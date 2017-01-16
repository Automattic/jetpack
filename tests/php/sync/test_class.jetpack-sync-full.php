<?php

function jetpack_foo_full_sync_callable() {
	return 'the value';
}

class WP_Test_Jetpack_Sync_Full extends WP_Test_Jetpack_Sync_Base {
	private $full_sync;

	private $full_sync_end_checksum;
	private $full_sync_start_config;
	private $synced_user_ids;

	public function setUp() {
		parent::setUp();
		$this->full_sync = Jetpack_Sync_Modules::get_module( 'full-sync' );
	}

	function test_enqueues_sync_start_action() {
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$start_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_start' );
		$this->assertTrue( $start_event !== false );
	}

	// this only applies to the test replicastore - in production we overlay data
	function test_sync_start_resets_storage() {
		$this->factory->post->create();
		$this->sender->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->post_count() );

		do_action( 'jetpack_full_sync_start' );
		$this->sender->do_full_sync();

		$this->assertEquals( 0, $this->server_replica_storage->post_count() );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 1, $this->server_replica_storage->post_count() );
	}

	function test_sync_start_resets_previous_sync_and_sends_full_sync_cancelled() {
		$this->factory->post->create();
		$this->full_sync->start();

		$initial_full_sync_queue_size = $this->sender->get_full_sync_queue()->size();

		// if we start again, it should reset the queue back to its original state,
		// plus a "full_sync_cancelled" action
		$this->full_sync->start();

		$this->assertEquals( $initial_full_sync_queue_size + 1, $this->sender->get_full_sync_queue()->size() );
		$this->sender->do_full_sync();

		$cancelled_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_cancelled' );

		$this->assertTrue( $cancelled_event !== false );
	}

	function test_full_sync_lock_has_one_hour_timeout() {
		$this->started_sync_count = 0;

		add_action( 'jetpack_full_sync_start', array( $this, 'count_full_sync_start' ) );

		$this->full_sync->start();

		$this->assertEquals( 1, $this->started_sync_count );

		// fake the last sync being over an hour ago
		$prefix = Jetpack_Sync_Module_Full_Sync::STATUS_OPTION_PREFIX;
		update_option( "{$prefix}_started", time() - 3700 );

		$this->full_sync->start();

		$this->assertEquals( 2, $this->started_sync_count );
	}

	function count_full_sync_start() {
		$this->started_sync_count += 1;
	}

	function test_full_sync_can_select_modules() {
		$this->server_replica_storage->reset();
		$this->sender->reset_data();
		$this->factory->post->create();

		$this->full_sync->start( array( 'options' => true ) );

		$this->sender->do_full_sync();

		$start_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_start' );

		$options_full_sync_actions = Jetpack_Sync_Modules::get_module( 'options' )->get_full_sync_actions();
		$options_event             = $this->server_event_storage->get_most_recent_event( $options_full_sync_actions[0] );

		$posts_full_sync_actions = Jetpack_Sync_Modules::get_module( 'posts' )->get_full_sync_actions();
		$posts_event             = $this->server_event_storage->get_most_recent_event( $posts_full_sync_actions[0] );

		$this->assertTrue( $start_event !== false );
		$this->assertTrue( $options_event !== false );
		$this->assertTrue( $posts_event === false );
	}

	function test_full_sync_sends_wp_version() {
		$this->server_replica_storage->reset();
		$this->sender->reset_data();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		global $wp_version;
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_callable( 'wp_version' ) );
	}

	function test_sync_post_filtered_content_was_filtered_when_syncing_all() {
		$post_id = $this->factory->post->create();
		$post    = get_post( $post_id );
		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );
		$post->post_content = "[foo]";
		wp_update_post( $post );
		$this->server_replica_storage->reset();
		$this->sender->reset_data();
		// this only applies to rendered content, which is off by default
		Jetpack_Sync_Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$post_on_server = $this->server_replica_storage->get_post( $post->ID );
		$this->assertEquals( $post_on_server->post_content, '[foo]' );
		$this->assertEquals( trim( $post_on_server->post_content_filtered ), 'bar' );
	}

	function foo_shortcode() {
		return 'bar';
	}

	function test_full_sync_sends_all_comments() {
		$post = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post, 11 );

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->sender->reset_data();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$comments = $this->server_replica_storage->get_comments();
		$this->assertEquals( 11, count( $comments ) );
	}

	function test_full_sync_sends_all_terms() {

		for ( $i = 0; $i < 11; $i += 1 ) {
			wp_insert_term( 'term' . $i, 'post_tag' );
		}

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->sender->reset_data();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$terms = $this->server_replica_storage->get_terms( 'post_tag' );
		$this->assertEquals( 11, count( $terms ) );
	}

	function test_full_sync_sends_all_users() {
		for ( $i = 0; $i < 10; $i += 1 ) {
			$user_id = $this->factory->user->create();
		}

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->sender->reset_data();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$users = get_users();
		// 10 + 1 = 1 users gets always created.


		$this->assertEquals( 11, $this->server_replica_storage->user_count() );
		$user = $this->server_replica_storage->get_user( $user_id );
		$this->assertEquals( get_allowed_mime_types( $user_id ), $this->server_replica_storage->get_allowed_mime_types( $user_id ) );
		// Lets make sure that we don't send users passwords around.
		$this->assertFalse( isset( $user->data->user_pass ) );
	}

	// phpunit -c tests/php.multisite.xml --filter test_full_sync_sends_only_current_blog_users_in_multisite
	function test_full_sync_sends_only_current_blog_users_in_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$original_blog_id = get_current_blog_id();

		$user_id = $this->factory->user->create();

		// NOTE this is necessary because WPMU causes certain assumptions about transients
		// to be wrong, and tests to explode. @see: https://github.com/sheabunge/WordPress/commit/ff4f1bb17095c6af8a0f35ac304f79074f3c3ff6
		global $wpdb;

		$suppress      = $wpdb->suppress_errors();
		$other_blog_id = wpmu_create_blog( 'foo.com', '', "My Blog", $this->user_id );
		$wpdb->suppress_errors( $suppress );

		// let's create some users on the other blog
		switch_to_blog( $other_blog_id );
		$mu_blog_user_id       = $this->factory->user->create();
		$added_mu_blog_user_id = $this->factory->user->create();
		restore_current_blog();

		// add one of the users to our current blog
		add_user_to_blog( $original_blog_id, $added_mu_blog_user_id, 'administrator' );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();
		$this->sender->get_sync_queue()->reset();

		// let's register a listener that asserts that only our intended users get enqueued
		add_filter( 'jetpack_sync_before_enqueue_jetpack_full_sync_users', array( $this, 'record_full_synced_users' ) );

		$this->full_sync->start();

		// let's make sure we've only enqueued users from the current blog too
		$this->assertTrue( in_array( $added_mu_blog_user_id, $this->synced_user_ids ) );
		$this->assertTrue( in_array( $user_id, $this->synced_user_ids ) );
		$this->assertFalse( in_array( $mu_blog_user_id, $this->synced_user_ids ) );

		$this->sender->do_full_sync();

		// admin user, our current-blog-created user and our "added" user
		$this->assertEquals( 3, $this->server_replica_storage->user_count() );

		$this->assertNotNull( $this->server_replica_storage->get_user( $user_id ) );
		$this->assertNotNull( $this->server_replica_storage->get_user( $added_mu_blog_user_id ) );
		$this->assertNull( $this->server_replica_storage->get_user( $mu_blog_user_id ) );

		// now switch to the other site and sync, and ensure that only that site's users get synced
		switch_to_blog( $other_blog_id );
		$this->server_replica_storage->reset();
		$this->sender->get_sync_queue()->reset();
		$this->synced_user_ids = null;

		$this->full_sync->start();

		// first user should be synced, as it's a member of both
		$this->assertTrue( in_array( $added_mu_blog_user_id, $this->synced_user_ids ) );
		// second should NOT be synced, as it's only a member of original blog
		$this->assertFalse( in_array( $user_id, $this->synced_user_ids ) );
		// third should be synced, as it's a member of created blog
		$this->assertTrue( in_array( $mu_blog_user_id, $this->synced_user_ids ) );

		$this->sender->do_full_sync();

		$this->assertEquals( 2, $this->server_replica_storage->user_count() );

		// again, opposite users from previous sync
		$this->assertNotNull( $this->server_replica_storage->get_user( $added_mu_blog_user_id ) );
		$this->assertNull( $this->server_replica_storage->get_user( $user_id ) );
		$this->assertNotNull( $this->server_replica_storage->get_user( $mu_blog_user_id ) );
	}

	function record_full_synced_users( $user_ids ) {
		$this->synced_user_ids = $user_ids;
	}

	function test_full_sync_sends_all_constants() {
		define( 'TEST_SYNC_ALL_CONSTANTS', 'foo' );

		Jetpack_Sync_Modules::get_module( "constants" )->set_constants_whitelist( array( 'TEST_SYNC_ALL_CONSTANTS' ) );
		$this->sender->do_sync();

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_constant( 'TEST_SYNC_ALL_CONSTANTS' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_constant( 'TEST_SYNC_ALL_CONSTANTS' ) );
	}

	function test_full_sync_sends_all_functions() {
		Jetpack_Sync_Modules::get_module( "functions" )->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_full_sync_callable' ) );
		$this->sender->do_sync();

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'jetpack_foo' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'the value', $this->server_replica_storage->get_callable( 'jetpack_foo' ) );
	}

	function test_full_sync_sends_all_options() {
		Jetpack_Sync_Modules::get_module( "options" )->set_options_whitelist( array( 'my_option', 'my_prefix_value' ) );
		update_option( 'my_option', 'foo' );
		update_option( 'my_prefix_value', 'bar' );
		update_option( 'my_non_synced_option', 'baz' );

		$this->sender->do_sync();

		// confirm sync worked as expected
		$this->assertEquals( 'foo', $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_non_synced_option' ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_prefix_value' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_non_synced_option' ) );
	}

	// to test run phpunit -c tests/php.multisite.xml --filter test_full_sync_sends_all_network_options
	function test_full_sync_sends_all_network_options() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		Jetpack_Sync_Modules::get_module( "network_options" )->set_network_options_whitelist( array(
			'my_option',
			'my_prefix_value'
		) );
		update_site_option( 'my_option', 'foo' );
		update_site_option( 'my_prefix_value', 'bar' );
		update_site_option( 'my_non_synced_option', 'baz' );

		$this->sender->do_sync();

		// confirm sync worked as expected
		$this->assertEquals( 'foo', $this->server_replica_storage->get_site_option( 'my_option' ), '' );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_site_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_non_synced_option' ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_option' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_prefix_value' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_site_option( 'my_option' ), 'Network options not synced during full sync' );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_site_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_site_option( 'my_non_synced_option' ) );
	}

	function test_full_sync_sends_all_post_meta() {
		$post_id = $this->factory->post->create();

		Jetpack_Sync_Settings::update_settings( array( 'post_meta_whitelist' => array( 'test_meta_key', 'test_meta_array' ) ) );

		add_post_meta( $post_id, 'test_meta_key', 'foo' );
		add_post_meta( $post_id, 'test_meta_array', array( 'foo', 'bar' ) );

		$this->sender->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );
		$this->assertEquals( array( 'foo', 'bar' ), $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_array', true ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_array', true ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );
		$this->assertEquals( array( 'foo', 'bar' ), $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_array', true ) );
	}

	function test_full_sync_doesnt_sends_forbiden_private_or_public_post_meta() {
		$post_id = $this->factory->post->create();
		
		$meta_module = Jetpack_Sync_Modules::get_module( "meta" );
		Jetpack_Sync_Settings::update_settings( array( 'post_meta_whitelist' => array( 'a_public_meta' ) ) );

		// forbidden private meta
		add_post_meta( $post_id, '_test_meta_key', 'foo1' );
		add_post_meta( $post_id, '_test_meta_array', array( 'foo2', 'bar' ) );
		// forbidden public meta
		add_post_meta( $post_id, 'snapTW', 'foo3' );
		// ok private meta
		add_post_meta( $post_id, '_wp_attachment_metadata', 'foo4' );
		// ok public meta
		add_post_meta( $post_id, 'a_public_meta', 'foo5' );

		$this->sender->do_sync();
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, '_test_meta_key', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, '_test_meta_array', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'snapTW', true ) );
		$this->assertEquals( 'foo4', $this->server_replica_storage->get_metadata( 'post', $post_id, '_wp_attachment_metadata', true ) );
		$this->assertEquals( 'foo5', $this->server_replica_storage->get_metadata( 'post', $post_id, 'a_public_meta', true ) );
		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, '_test_meta_key', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, '_test_meta_array', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'snapTW', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, '_wp_attachment_metadata', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'a_public_meta', true ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, '_test_meta_key', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, '_test_meta_array', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'snapTW', true ) );
		$this->assertEquals( 'foo4', $this->server_replica_storage->get_metadata( 'post', $post_id, '_wp_attachment_metadata', true ) );
		$this->assertEquals( 'foo5', $this->server_replica_storage->get_metadata( 'post', $post_id, 'a_public_meta', true ) );
	}

	function test_full_sync_sends_all_post_terms() {
		$post_id = $this->factory->post->create();
		wp_set_object_terms( $post_id, 'tag', 'post_tag' );

		$this->sender->do_sync();
		$terms = get_the_terms( $post_id, 'post_tag' );

		$this->assertEqualsObject( $terms, $this->server_replica_storage->get_the_terms( $post_id, 'post_tag' ), 'Initial sync doesn\'t work' );
		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_the_terms( $post_id, 'post_tag', 'Not empty' ) );
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$terms = array_map( array( $this, 'upgrade_terms_to_pass_test' ), $terms );
		$this->assertEqualsObject( $terms, $this->server_replica_storage->get_the_terms( $post_id, 'post_tag' ), 'Full sync doesn\'t work' );
	}

	function test_full_sync_sends_all_comment_meta() {
		$post_id     = $this->factory->post->create();
		$comment_ids = $this->factory->comment->create_post_comments( $post_id );
		$comment_id  = $comment_ids[0];

		Jetpack_Sync_Settings::update_settings( array( 'comment_meta_whitelist' => array( 'test_meta_key' ) ) );

		add_comment_meta( $comment_id, 'test_meta_key', 'foo' );

		$this->sender->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'comment', $comment_id, 'test_meta_key', true ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'comment', $comment_id, 'test_meta_key', true ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'comment', $comment_id, 'test_meta_key', true ) );
	}

	function test_full_sync_sends_theme_info() {
		// make sure we don't already use this theme
		$this->assertNotEquals( 'twentyfourteen', get_option( 'stylesheet' ) );

		switch_theme( 'twentyfourteen' );
		set_theme_mod( 'foo', 'bar' );
		$this->sender->do_sync();

		$this->assertEquals( 'twentyfourteen', $this->server_replica_storage->get_option( 'stylesheet' ) );

		// now reset the storage and confirm the value is reset
		$this->server_replica_storage->reset();
		$this->assertNotEquals( 'twentyfourteen', $this->server_replica_storage->get_option( 'stylesheet' ) );

		// full sync should restore the value
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'twentyfourteen', $this->server_replica_storage->get_option( 'stylesheet' ) );
		$local_option = get_option( 'theme_mods_twentyfourteen' );
		$remote_option = $this->server_replica_storage->get_option( 'theme_mods_twentyfourteen' );

		if ( isset( $local_option[0] ) ) {
			// this is a spurious value that sometimes gets set during tests, and is
			// actively removed before sending to WPCOM
			// it appears to be due to a bug which sets array( false ) as the default value for theme_mods
			unset( $local_option[0] );
		}

		$this->assertEquals( $local_option, $remote_option );

		$synced_theme_caps_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_theme_data' );
		$synced_theme_caps = $synced_theme_caps_event->args[0];

		$this->assertTrue( $synced_theme_caps['post-thumbnails'] );

		$this->assertTrue( $this->server_replica_storage->current_theme_supports( 'post-thumbnails' ) );
	}

	function test_full_sync_sends_plugin_updates() {

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_plugins();

		$this->sender->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'plugins' );
		$this->assertTrue( $updates->last_checked > strtotime( "-10 seconds" ) );

		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'plugins' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$updates = $this->server_replica_storage->get_updates( 'plugins' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime( "-10 seconds" ), 'Last checked is less then 2 seconds: ' . $updates->last_checked . ' - lest then 10 sec:' . strtotime( "-10 seconds" ) );
	}

	function test_full_sync_sends_theme_updates() {

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_themes();

		$this->sender->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertTrue( $updates->last_checked > strtotime( "-2 seconds" ) );

		// we need to do this because there's a check for elapsed time since last update
		// in the wp_update_themes() function
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'themes' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime( "-10 seconds" ) );
	}

	function test_full_sync_sends_core_updates() {

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		_maybe_update_core();

		$this->sender->do_sync();

		// check that an update just finished
		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertTrue( $updates->last_checked > strtotime( "-10 seconds" ) );

		// we need to do this because there's a check for elapsed time since last update
		// in the wp_update_core() function
		$this->server_replica_storage->reset();

		$this->assertNull( $this->server_replica_storage->get_updates( 'core' ) );

		// full sync should re-check for plugin updates
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertNotNull( $updates );
		$this->assertTrue( $updates->last_checked > strtotime( "-10 seconds" ) );
	}

	function test_full_sync_start_sends_configuration() {
		$post_ids = $this->factory->post->create_many( 3 );

		// this is so that on WPCOM we can tell what has been synchronized in the past
		add_action( 'jetpack_full_sync_start', array( $this, 'record_full_sync_start_config' ), 10, 1 );

		$standard_config = array( 
			'constants' => true,
			'functions' => true,
			'options' => true,
			'terms' => true,
			'themes' => true,
			'users' => true,
			'updates' => true,
			'posts' => true
		);

		if ( is_multisite() ) {
			$standard_config['network_options'] = true;
		}

		$this->full_sync->start();

		$this->assertEquals( $standard_config, $this->full_sync_start_config );

		$custom_config = array( 'posts' => $post_ids );

		$this->full_sync->start( $custom_config );

		$this->assertEquals( $custom_config, $this->full_sync_start_config );
	}

	function test_full_sync_end_sends_checksums() {
		$this->markTestSkipped( "We don't send checksums in this version" );
		add_action( 'jetpack_full_sync_end', array( $this, 'record_full_sync_end_checksum' ), 10, 1 );

		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->sender->do_full_sync();
		$this->sender->do_full_sync();

		$this->assertTrue( isset( $this->full_sync_end_checksum ) );
		$this->assertTrue( isset( $this->full_sync_end_checksum['posts'] ) );
		$this->assertTrue( isset( $this->full_sync_end_checksum['comments'] ) );
	}

	function record_full_sync_end_checksum( $checksum ) {
		$this->full_sync_end_checksum = $checksum;
	}

	function record_full_sync_start_config( $modules ) {
		$this->full_sync_start_config = $modules;
	}

	function create_dummy_data_and_empty_the_queue() {
		// lets create a bunch of posts
		for ( $i = 0; $i < 20; $i += 1 ) {
			$post = $this->factory->post->create();
		}
		// lets create a bunch of comments
		$this->factory->comment->create_post_comments( $post, 11 );

		// reset the data before the full sync
		$this->sender->reset_data();

	}

	function test_full_sync_status_should_be_not_started_after_reset() {
		$this->create_dummy_data_and_empty_the_queue();

		$full_sync_status = $this->full_sync->get_status();
		$this->assertEquals(
			$full_sync_status,
			array(
				'started'        => null,
				'queue_finished' => null,
				'send_started'   => null,
				'finished'       => null,
				'total'          => array(),
				'sent'           => array(),
				'queue'          => array(),
				'config'         => null,
			)
		);
	}

	function test_full_sync_status_after_start() {
		$this->create_dummy_data_and_empty_the_queue();

		$this->full_sync->start();

		$full_sync_status = $this->full_sync->get_status();

		$should_be_status = array(
			'queue' => array(
				'constants' => 1,
				'functions' => 1,
				'options'   => 1,
				'posts'     => 2,
				'comments'  => 2,
				'themes'    => 1,
				'updates'   => 1,
				'users'     => 1,
				'terms'     => 1,
			),
			'config' => null
		);
		if ( is_multisite() ) {
			$should_be_status['queue']['network_options'] = 1;
		}

		$this->assertEquals( $should_be_status['queue'], $full_sync_status['queue'] );
		$this->assertEquals( $should_be_status['config'], $full_sync_status['config'] );
		$this->assertInternalType( 'int', $full_sync_status['started'] );
		$this->assertInternalType( 'int', $full_sync_status['queue_finished'] );
		$this->assertNull( $full_sync_status['send_started'] );
		$this->assertNull( $full_sync_status['finished'] );
		$this->assertInternalType( 'array', $full_sync_status['sent'] );
	}

	function test_full_sync_status_after_end() {
		$this->create_dummy_data_and_empty_the_queue();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$full_sync_status = $this->full_sync->get_status();

		$should_be_status = array(
			'sent'  => array(
				'constants' => 1,
				'functions' => 1,
				'options'   => 1,
				'posts'     => 2,
				'comments'  => 2,
				'themes'    => 1,
				'updates'   => 1,
				'users'     => 1,
				'terms'     => 1
			),
			'queue' => array(
				'constants' => 1,
				'functions' => 1,
				'options'   => 1,
				'posts'     => 2,
				'comments'  => 2,
				'themes'    => 1,
				'updates'   => 1,
				'users'     => 1,
				'terms'     => 1
			)
		);
		if ( is_multisite() ) {
			$should_be_status['queue']['network_options'] = 1;
			$should_be_status['sent']['network_options']  = 1;
		}

		$this->assertEquals( $full_sync_status['queue'], $should_be_status['queue'] );
		$this->assertEquals( $full_sync_status['sent'], $should_be_status['sent'] );
		$this->assertInternalType( 'int', $full_sync_status['started'] );
		$this->assertInternalType( 'int', $full_sync_status['queue_finished'] );
		$this->assertInternalType( 'int', $full_sync_status['send_started'] );
		$this->assertInternalType( 'int', $full_sync_status['finished'] );
	}

	function test_full_sync_respects_post_and_comment_filters() {
		add_filter( 'jetpack_sync_prevent_sending_comment_data', '__return_true' );
		add_filter( 'jetpack_sync_prevent_sending_post_data', '__return_true' );

		$post_id = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post_id, 3 );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		remove_filter( 'jetpack_sync_prevent_sending_comment_data', '__return_true' );
		remove_filter( 'jetpack_sync_prevent_sending_post_data', '__return_true' );

		$this->assertEquals( 3, $this->server_replica_storage->comment_count( 'jetpack_sync_blocked' ) );
		$blocked_post = $this->server_replica_storage->get_post( $post_id );
		$this->assertEquals( 'jetpack_sync_blocked', $blocked_post->post_status );
	}

	function test_full_sync_do_not_sync_events_if_no_data_to_sync() {
		$non_existent_id      = 123123123123123213;
		$non_existent_post    = get_post( $non_existent_id );
		$non_existent_comment = get_comment( $non_existent_id );
		$non_existent_user    = get_user_by( 'id', $non_existent_id );

		$this->assertTrue( empty( $non_existent_post ) );
		$this->assertTrue( empty( $non_existent_comment ) );
		$this->assertTrue( empty( $non_existent_user ) );

		$this->full_sync->start( array( 'posts' => array( $non_existent_id ), 'comments' => array( $non_existent_id ), 'users' => array( $non_existent_id ) )  );
		$this->sender->do_full_sync();

		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_posts' ) );
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_comments' ) );
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_users' ) );
	}

	function test_full_sync_can_sync_individual_posts() {
		$sync_post_id    = $this->factory->post->create();
		$sync_post_id_2  = $this->factory->post->create();
		$no_sync_post_id = $this->factory->post->create();

		$this->full_sync->start( array( 'posts' => array( $sync_post_id, $sync_post_id_2 ) ) );
		$this->sender->do_full_sync();

		$synced_posts_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_posts' );

		$posts = $synced_posts_event->args[0];

		$this->assertEquals( 2, count( $posts ) );
		$this->assertEquals( $sync_post_id_2, $posts[0]->ID );
		$this->assertEquals( $sync_post_id, $posts[1]->ID );

		$sync_status = $this->full_sync->get_status();
		$this->assertEquals( array( $sync_post_id, $sync_post_id_2 ), $sync_status['config']['posts'] );
	}

	function test_full_sync_can_sync_individual_comments() {
		if ( version_compare( phpversion(), '5.3.0', '<' ) ) {
			$this->markTestSkipped( 'This test fails in PHP 5.2.' );
		}

		$post_id = $this->factory->post->create();
		list( $sync_comment_id, $no_sync_comment_id, $sync_comment_id_2 ) = $this->factory->comment->create_post_comments( $post_id, 3 );

		$this->full_sync->start( array( 'comments' => array( $sync_comment_id, $sync_comment_id_2 ) ) );
		$this->sender->do_full_sync();

		$synced_comments_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_comments' );

		$comments = $synced_comments_event->args[0];

		$this->assertEquals( 2, count( $comments ) );
		$comment_IDs = array( $comments[0]->comment_ID, $comments[1]->comment_ID );

		$this->assertContains( $sync_comment_id, $comment_IDs );
		$this->assertContains( $sync_comment_id_2, $comment_IDs );

		$sync_status = $this->full_sync->get_status();
		$this->assertEquals( array( $sync_comment_id, $sync_comment_id_2 ), $sync_status['config']['comments'] );
	}

	function test_full_sync_can_sync_individual_users() {
		$sync_user_id = $this->factory->user->create();
		$sync_user_id_2 = $this->factory->user->create();
		$no_sync_user_id = $this->factory->user->create();

		$this->full_sync->start( array( 'users' => array( $sync_user_id, $sync_user_id_2) ) );
		$this->sender->do_full_sync();

		$synced_users_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_users' );

		$users = $synced_users_event->args;

		$this->assertEquals( 2, count( $users ) );
		$this->assertEquals( $sync_user_id, $users[0]->ID );
		$this->assertEquals( $sync_user_id_2, $users[1]->ID );

		$sync_status = $this->full_sync->get_status();
		$this->assertEquals( array( $sync_user_id, $sync_user_id_2 ), $sync_status['config']['users'] );
	}

	function test_full_sync_doesnt_send_deleted_posts() {
		// previously, the behaviour was to send false or throw errors - we
		// should actively detect false values and remove them
		$keep_post_id = $this->factory->post->create();
		$delete_post_id = $this->factory->post->create();

		$this->full_sync->start();

		wp_delete_post( $delete_post_id, true );

		$this->sender->do_full_sync();

		$synced_posts_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_posts' );

		$posts = $synced_posts_event->args[0];
		$this->assertEquals( 1, count( $posts ) );
		$this->assertEquals( $keep_post_id, $posts[0]->ID );
	}

	function test_full_sync_doesnt_send_deleted_comments() {
		// previously, the behaviour was to send false or throw errors - we
		// should actively detect false values and remove them
		$post_id     = $this->factory->post->create();
		list( $keep_comment_id, $delete_comment_id ) = $this->factory->comment->create_post_comments( $post_id, 2 );

		$this->full_sync->start();

		wp_delete_comment( $delete_comment_id, true );

		$this->sender->do_full_sync();

		$synced_comments_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_comments' );

		$comments = $synced_comments_event->args[0];
		$this->assertEquals( 1, count( $comments ) );
		$this->assertEquals( $keep_comment_id, $comments[0]->comment_ID );
	}

	function test_full_sync_doesnt_send_deleted_users() {
		$user_counts = count_users();
		$existing_user_count = $user_counts['total_users'];

		// previously, the behaviour was to send false or throw errors - we
		// should actively detect false values and remove them
		$keep_user_id = $this->factory->user->create();
		$delete_user_id = $this->factory->user->create();

		$this->full_sync->start();

		wp_delete_user( $delete_user_id );

		$this->sender->do_full_sync();

		$synced_users_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_users' );
		$users = $synced_users_event->args;

		$this->assertEquals( $existing_user_count+1, count( $users ) );
		$this->assertEquals( $keep_user_id, $users[ $existing_user_count ]->ID );
	}

	function test_full_sync_has_correct_sent_count_even_if_some_actions_unsent() {
		// if actions get filtered out after dequeue, this can lead to the sent count 
		// not matching the queued count - we should make sure the count is incremented even for late-deleted items

		$this->sender->do_sync();

		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_users', array( $this, 'dont_sync_users' ) );

		foreach( range( 1, 3 ) as $i ) {
			$this->factory->user->create();
		}

		$this->full_sync->start( array( 'users' => true ) );

		$this->sender->do_full_sync();
		$this->sender->do_full_sync();
		$this->sender->do_full_sync();

		$full_sync_status = $this->full_sync->get_status();

		$this->assertEquals( $full_sync_status['sent']['users'], $full_sync_status['queue']['users'] );
	}

	function dont_sync_users( $args ) {
		return false;
	}

	function test_full_sync_status_with_a_small_queue() {
		if ( version_compare( phpversion(), '5.3.0', '<' ) ) {
			$this->markTestSkipped( 'This test fails in PHP 5.2.' );
		}

		$this->sender->set_dequeue_max_bytes( 750 ); // process 0.00075MB of items at a time

		$this->create_dummy_data_and_empty_the_queue();

		$this->full_sync->start();

		$this->sender->do_full_sync();
		$full_sync_status = $this->full_sync->get_status();
		$this->assertSame( null, $full_sync_status['finished'] );

		$this->sender->do_full_sync();
		$full_sync_status = $this->full_sync->get_status();
		$this->assertSame( null, $full_sync_status['finished'] );

		$this->sender->do_full_sync();
		$this->sender->do_full_sync(); // juuuust in case - otherwise we use too many bytes for multisite

		$full_sync_status = $this->full_sync->get_status();

		$should_be_status = array(
			'sent'  => array(
				'constants' => 1,
				'functions' => 1,
				'options'   => 1,
				'posts'     => 2,
				'comments'  => 2,
				'themes'    => 1,
				'updates'   => 1,
				'users'     => 1,
				'terms'     => 1
			),
			'queue' => array(
				'constants' => 1,
				'functions' => 1,
				'options'   => 1,
				'posts'     => 2,
				'comments'  => 2,
				'themes'    => 1,
				'updates'   => 1,
				'users'     => 1,
				'terms'     => 1
			),
			'total' => array(
				'constants' => 1,
				'functions' => 1,
				'options'   => 1,
				'posts'     => 2,
				'comments'  => 2,
				'themes'    => 1,
				'updates'   => 1,
				'users'     => 1,
				'terms'     => 1
			)
		);
		if ( is_multisite() ) {
			$should_be_status['queue']['network_options'] = 1;
			$should_be_status['sent']['network_options']  = 1;
			$should_be_status['total']['network_options'] = 1;
		}

		$this->assertEquals( $full_sync_status['queue'], $should_be_status['queue'] );
		$this->assertEquals( $full_sync_status['sent'], $should_be_status['sent'] );
		$this->assertEquals( $full_sync_status['total'], $should_be_status['total'] );
		$this->assertInternalType( 'int', $full_sync_status['started'] );
		$this->assertInternalType( 'int', $full_sync_status['queue_finished'] );
		$this->assertInternalType( 'int', $full_sync_status['send_started'] );
		$this->assertInternalType( 'int', $full_sync_status['finished'] );

		// Reset all the defaults
		$this->setSyncClientDefaults();
	}

	function test_sync_modules_can_estimate_total_actions() {

		// make some stuff
		foreach( range( 0, 25 ) as $number ) {
			$post_id = $this->factory->post->create();
			$this->factory->user->create();
			$this->factory->comment->create_post_comments( $post_id, 2 );
		}

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name            = $module->name();
			$estimate               = $module->estimate_full_sync_actions( true );
			list( $actual, $state ) = $module->enqueue_full_sync_actions( true, 100, false );

			$this->assertSame( $estimate, $actual );
		}
	}

	function test_sync_call_ables_does_not_modify_globals() {
		global $wp_taxonomies;
		// assert that $wp_taxonomy object stays an array. 
		$this->assertTrue( is_array( $wp_taxonomies['category']->rewrite ) );
		$this->setSyncClientDefaults();
		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->assertTrue( is_array( $wp_taxonomies['category']->rewrite ) );
	}

	function test_initial_sync_doesnt_sync_subscribers() {
		$this->factory->user->create( array( 'user_login' => 'theauthor', 'role' => 'author' ) );
		$this->factory->user->create( array( 'user_login' => 'theadmin', 'role' => 'administrator' ) );
		foreach( range( 1, 10 ) as $i ) {
			$this->factory->user->create( array( 'role' => 'subscriber' ) );
		}
		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->assertEquals( 13, $this->server_replica_storage->user_count() );
		$this->server_replica_storage->reset();
		$this->assertEquals( 0, $this->server_replica_storage->user_count() );
		$user_ids = Jetpack_Sync_Modules::get_module( 'users' )->get_initial_sync_user_config();
		$this->assertEquals( 3, count( $user_ids ) );
		$this->full_sync->start( array( 'users' => 'initial' ) );
		$this->sender->do_full_sync();
		$this->assertEquals( 3, $this->server_replica_storage->user_count() );
		// finally, let's make sure that the initial sync method actually invokes our initial sync user config
		Jetpack_Sync_Actions::do_initial_sync( '4.2', '4.1' );

		$expected_sync_config = array( 
			'options' => true, 
			'network_options' => true,
			'functions' => true, 
			'constants' => true, 
			'users' => 'initial'
		);

		$full_sync_status = $this->full_sync->get_status();
		$this->assertEquals(
			$expected_sync_config,
			$full_sync_status[ 'config' ]
		);
	}

	function test_full_sync_enqueues_limited_number_of_items() {
		Jetpack_Sync_Settings::update_settings( array( 'max_enqueue_full_sync' => 2 ) );

		global $wpdb;

		// enough posts for three queue items
		$synced_post_ids = $this->factory->post->create_many( 25 );

		$this->full_sync->start( array( 'posts' => true ) );

		// test number of items in full sync queue - should be 4 (= full_sync_start + 2xposts + full_sync_end)
		$this->assertEquals( 3, $this->sender->get_full_sync_queue()->size() );

		$this->full_sync->continue_enqueuing();

		$this->assertEquals( 5, $this->sender->get_full_sync_queue()->size() );

		// should not keep adding full_sync_end or other items afterward
		$queue_size = $this->sender->get_full_sync_queue()->size();

		// continuing to enqueue shouldn't add more items
		$this->full_sync->continue_enqueuing();
		$this->assertEquals( $queue_size, $this->sender->get_full_sync_queue()->size() );
		$this->full_sync->continue_enqueuing();
		$this->assertEquals( $queue_size, $this->sender->get_full_sync_queue()->size() );
		$this->full_sync->continue_enqueuing();
		$this->assertEquals( $queue_size, $this->sender->get_full_sync_queue()->size() );
	}

	function test_full_sync_continue_does_nothing_if_no_sync_started() {
		$full_sync_queue_size_before = $this->sender->get_full_sync_queue()->size();
		
		$this->full_sync->continue_enqueuing();

		$this->assertEquals( $full_sync_queue_size_before, $this->sender->get_full_sync_queue()->size() );
	}

	function test_full_sync_stops_enqueuing_at_max_queue_size() {
		Jetpack_Sync_Settings::update_settings( array( 'max_queue_size_full_sync' => 2, 'max_enqueue_full_sync' => 10 ) );

		// this should become three items
		$synced_post_ids = $this->factory->post->create_many( 25 );

		$this->full_sync->start( array( 'posts' => true ) );

		// full_sync_start plus 10 posts
		$this->assertEquals( 2, $this->sender->get_full_sync_queue()->size() );

		// attempting to continue enqueuing shouldn't work because the queue is at max size
		$this->full_sync->continue_enqueuing();
		$this->assertEquals( 2, $this->sender->get_full_sync_queue()->size() );

		// flush the queue
		$this->sender->do_full_sync();

		$this->assertEquals( 0, $this->sender->get_full_sync_queue()->size() );

		// continue enqueuing and hit the limit again - 2 more sets of posts (10 and 5)
		$this->full_sync->continue_enqueuing();
		$this->assertEquals( 2, $this->sender->get_full_sync_queue()->size() );

		$this->sender->do_full_sync();

		// last one - this time just sending full_sync_end
		$this->full_sync->continue_enqueuing();
		$this->assertEquals( 1, $this->sender->get_full_sync_queue()->size() );

		$this->sender->do_full_sync();

		// full sync is done, continuing should do nothing
		$this->full_sync->continue_enqueuing();
		$this->assertEquals( 0, $this->sender->get_full_sync_queue()->size() );		
	}

	function _do_cron() {
		$_GET['check'] = wp_hash( '187425' );
		require( ABSPATH . '/wp-cron.php' );
	}

	function upgrade_terms_to_pass_test( $term ) {
		global $wp_version;
		if ( version_compare( $wp_version, '4.4', '<' ) ) {
			unset( $term->filter );
		}

		return $term;
	}
}
