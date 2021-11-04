<?php

use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\Full_Sync;
use Automattic\Jetpack\Sync\Settings;
use Automattic\Jetpack\Sync\Health;

if ( ! function_exists( 'jetpack_foo_full_sync_callable' ) ) {
	function jetpack_foo_full_sync_callable() {
		return 'the value';
	}
}

class WP_Test_Jetpack_Sync_Full_Immediately extends WP_Test_Jetpack_Sync_Base {

	private $full_sync;

	private $full_sync_end_checksum;
	private $full_sync_start_config;
	private $synced_user_ids;

	private $test_posts_count = 20;
	private $test_comments_count = 11;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		Settings::reset_data();

		$this->full_sync = Modules::get_module( 'full-sync' );

		$this->server_replica_storage->reset();
		$this->sender->reset_data();
		$this->sender->set_enqueue_wait_time( 0 );

	}

	function test_sync_start_action_with_ranges() {
		$post = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post, 11 );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$start_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_start' );
		$this->assertTrue( $start_event !== false );

		list( $config, $range ) = $start_event->args;

		$this->assertTrue( $config !== false );

		$this->assertTrue( isset( $range['posts']->max ) );
		$this->assertTrue( isset( $range['posts']->min ) );
		$this->assertTrue( isset( $range['posts']->count ) );

		$this->assertTrue( isset( $range['comments']->max ) );
		$this->assertTrue( isset( $range['comments']->min ) );
		$this->assertTrue( isset( $range['comments']->count ) );
	}

	function test_sync_health_in_sync_on_full_sync_end() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );
		$this->assertEquals( Health::get_status(), Health::STATUS_OUT_OF_SYNC );
		$post = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post, 11 );

		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->assertEquals( Health::get_status(), Health::STATUS_IN_SYNC );
	}

	// this only applies to the test replicastore - in production we overlay data
	function test_sync_start_resets_storage() {
		$this->factory->post->create();
		$this->sender->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->post_count() );

		$this->sender->send_action( 'jetpack_full_sync_start' );
		$this->assertEquals( 0, $this->server_replica_storage->post_count() );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 1, $this->server_replica_storage->post_count() );
	}

	function test_sync_start_resets_previous_sync_and_sends_full_sync_cancelled() {
		$this->factory->post->create();
		$this->full_sync->start();

		// if we start again, it should reset the status back to its original state,
		// plus a "full_sync_cancelled" action
		$this->full_sync->start();

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
		$prefix = Full_Sync::STATUS_OPTION_PREFIX;
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

		$options_full_sync_actions = Modules::get_module( 'options' )->get_full_sync_actions();
		$options_event             = $this->server_event_storage->get_most_recent_event( $options_full_sync_actions[0] );

		$posts_full_sync_actions = Modules::get_module( 'posts' )->get_full_sync_actions();
		$posts_event             = $this->server_event_storage->get_most_recent_event( $posts_full_sync_actions[0] );

		$this->assertNotFalse( $start_event );
		$this->assertNotFalse( $options_event );
		$this->assertFalse( $posts_event );
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
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

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
		$NUMBER_OF_TERMS_TO_CREATE = 11;
		$this->server_replica_storage->reset();
		$this->sender->reset_data();
		for ( $i = 0; $i < $NUMBER_OF_TERMS_TO_CREATE; $i += 1 ) {
			wp_insert_term( 'category ' . $i, 'category' );
			wp_insert_term( 'term ' . $i, 'post_tag' );
		}

		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->sender->reset_data();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$terms = $this->server_replica_storage->get_terms( 'post_tag' );
		$this->assertEquals( $NUMBER_OF_TERMS_TO_CREATE, count( $terms ) );

		$terms = $this->server_replica_storage->get_terms( 'category' );
		$this->assertEquals( $NUMBER_OF_TERMS_TO_CREATE + 1, count( $terms ) ); // 11 + 1 (for uncategorized term)
	}

	function test_full_sync_sends_all_terms_with_previous_interval_end() {
		Settings::update_settings( array( 'max_full_sync_terms' => 1 ) );

		for ( $i = 0; $i < 25; $i += 1 ) {
			wp_insert_term( 'term' . $i, 'post_tag' );
		}

		// The first event is for full sync start.
		$this->full_sync->start( array( 'terms' => true ) );
		$this->sender->do_full_sync();

		$event                 = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_terms' );
		$previous_interval_end = $event->args['previous_end'];
		// The first batch has the previous_min_is not set.
		// We user ~0 to denote that the previous min id unknown.
		$this->assertEquals( '~0', $previous_interval_end );

		$this->full_sync->reset_data();
	}

	function test_full_sync_send_immediately_skips_queue() {
		$posts_count = 100;
		$this->factory->post->create_many( $posts_count );

		$this->full_sync->start( [ 'posts' => true ] );
		$this->sender->do_full_sync();
		// $this->sender->do_full_sync() is not necessary!

		$this->assertEquals( $posts_count, count( $this->server_replica_storage->get_posts() ) );
	}

	function test_full_sync_sends_all_term_relationships() {
		global $wpdb;
		$this->sender->reset_data();

		$post_ids = $this->factory->post->create_many( 20 );

		foreach ( $post_ids as $post_id ) {
			wp_set_object_terms( $post_id, array( 'cat1', 'cat2', 'cat3' ), 'category', true );
			wp_set_object_terms( $post_id, array( 'tag1', 'tag2', 'tag3' ), 'post_tag', true );
		}

		$original_number_of_term_relationships = $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->term_relationships" );

		// simulate emptying the server storage
		$this->server_replica_storage->reset();

		$this->full_sync->start( array( 'term_relationships' => true ) );
		$this->sender->do_full_sync();

		$replica_number_of_term_relationships = count( $this->server_replica_storage->get_term_relationships() );
		$this->assertEquals( $original_number_of_term_relationships, $replica_number_of_term_relationships );
	}

	function test_full_sync_sends_all_term_relationships_with_previous_interval_end() {
		$post_id = $this->factory->post->create();

		$terms = array();
		for ( $i = 0; $i < 25; $i += 1 ) {
			$terms[] = wp_insert_term( 'term ' . $i, 'category' );
		}

		// Sync the posts and terms first.
		$this->full_sync->start( array( 'posts' => true, 'terms' => true ) );
		$this->sender->do_full_sync();

		// Simulate emptying the server storage.
		$this->server_replica_storage->reset();
		$this->sender->reset_data();

		Settings::update_settings(
			array(
				'term_relationships_full_sync_item_size' => 10
			)
		);

		foreach ( $terms as $term ) {
			wp_set_object_terms( $post_id, array( $term['term_id'] ), 'category', true );
		}

		// The first event is for full sync start.
		$this->full_sync->start( array( 'term_relationships' => 1 ) );
		$this->sender->do_full_sync();

		$event                 = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_term_relationships' );
		$previous_interval_end = $event->args['previous_end'];

		$this->assertEquals( $previous_interval_end, array(
			'object_id'        => Modules\Term_Relationships::MAX_INT,
			'term_taxonomy_id' => Modules\Term_Relationships::MAX_INT,
		) );
	}

	/**
	 * Full Sync is limited to contributor and above users based on wp_user_level.
	 * This test verifies only contributors are sent.
	 */
	function test_full_sync_sends_all_users() {
		$this->factory->user->create( array( 'role' => 'subscriber' ) );
		$first_user_id = $this->factory->user->create( array( 'role' => 'contributor' ) );
		for ( $i = 0; $i < 9; $i += 1 ) {
			$user_id = $this->factory->user->create( array( 'role' => 'contributor' ) );
		}

		update_user_meta( $user_id, 'locale', 'en_GB' );
		// simulate emptying the server storage
		$this->server_replica_storage->reset();
		$this->sender->reset_data();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		// 10 + 1 = 1 users gets always created.
		$this->assertEquals( 11, $this->server_replica_storage->user_count() );
		$user = $this->server_replica_storage->get_user( $user_id );
		$this->assertEquals( get_allowed_mime_types( $user_id ), $this->server_replica_storage->get_allowed_mime_types( $user_id ) );

		$this->assertEquals( get_user_locale( $user_id ), $this->server_replica_storage->get_user_locale( $user_id ) );
		$this->assertNull( $this->server_replica_storage->get_user_locale( $first_user_id ) );

		// Lets make sure that we don't send users passwords around.
		$this->assertFalse( isset( $user->data->user_pass ) );
	}

	function test_full_sync_sends_previous_interval_end_for_users() {
		for ( $i = 0; $i < 45; $i += 1 ) {
			$user_ids[] = $this->factory->user->create();
		}

		// The first event is for full sync start.
		$this->full_sync->start( array( 'users' => true ) );
		$this->sender->do_full_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_full_sync_users' );
		$previous_interval_end = $events[0]->args['previous_end'];

		// The first batch has the previous_min_is not set.
		// We user ~0 to denote that the previous min id unknown.
		$this->assertEquals( '~0', $previous_interval_end );
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
		$mu_blog_user_id       = $this->factory->user->create( array( 'role' => 'contributor' ) );
		$added_mu_blog_user_id = $this->factory->user->create( array( 'role' => 'contributor' ) );
		restore_current_blog();

		// add one of the users to our current blog
		add_user_to_blog( $original_blog_id, $added_mu_blog_user_id, 'administrator' );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();
		$this->full_sync->start();
		$this->sender->do_full_sync();

		// admin user, our current-blog-created user and our "added" user
		$this->assertEquals( 3, $this->server_replica_storage->user_count() );

		$this->assertNotNull( $this->server_replica_storage->get_user( $user_id ) );
		$this->assertNotNull( $this->server_replica_storage->get_user( $added_mu_blog_user_id ) );
		$this->assertNull( $this->server_replica_storage->get_user( $mu_blog_user_id ) );

		// now switch to the other site and sync, and ensure that only that site's users get synced.
		switch_to_blog( $other_blog_id );
		$this->server_replica_storage->reset();
		$this->synced_user_ids = null;

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$user_count             = $this->server_replica_storage->user_count();
		$srs_added_mu_blog_user = $this->server_replica_storage->get_user( $added_mu_blog_user_id );
		$srs_user               = $this->server_replica_storage->get_user( $user_id );
		$srs_mu_blog_user       = $this->server_replica_storage->get_user( $mu_blog_user_id );

		// restore context then run assertions.
		restore_current_blog();

		$this->assertEquals( 2, $user_count );

		// again, opposite users from previous sync.
		$this->assertNotNull( $srs_added_mu_blog_user );
		$this->assertNull( $srs_user );
		$this->assertNotNull( $srs_mu_blog_user );

	}

	function record_full_synced_users( $user_ids ) {
		$this->synced_user_ids = $user_ids;
	}

	function test_full_sync_sends_all_constants() {
		define( 'TEST_SYNC_ALL_CONSTANTS', 'foo' );

		$helper                 = new Jetpack_Sync_Test_Helper();
		$helper->array_override = array( 'TEST_SYNC_ALL_CONSTANTS' );
		add_filter( 'jetpack_sync_constants_whitelist', array( $helper, 'filter_override_array' ) );

		$this->sender->do_sync();

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_constant( 'TEST_SYNC_ALL_CONSTANTS' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_constant( 'TEST_SYNC_ALL_CONSTANTS' ) );
	}

	function test_full_sync_constants_updates_checksums() {
		define( 'FOO_SYNC_ALL_CONSTANTS', 'foo' );
		$this->resetCallableAndConstantTimeouts();
		$helper                 = new Jetpack_Sync_Test_Helper();
		$helper->array_override = array( 'FOO_SYNC_ALL_CONSTANTS' );
		add_filter( 'jetpack_sync_constants_whitelist', array( $helper, 'filter_override_array' ) );
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_constant( 'FOO_SYNC_ALL_CONSTANTS' ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();
		$this->server_event_storage->reset();
		// Do Sync shouldn't send anything becuase the checksums are up to date.
		$this->sender->do_sync();
		$this->assertEquals( null, $this->server_replica_storage->get_constant( 'FOO_SYNC_ALL_CONSTANTS' ) );
		$events = $this->server_event_storage->get_all_events( 'jetpack_sync_constant' );
		$this->assertTrue( empty( $events ) );
	}

	function test_full_sync_sends_all_functions() {
		Modules::get_module( "functions" )->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_full_sync_callable' ) );
		$this->sender->do_sync();

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'jetpack_foo' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'the value', $this->server_replica_storage->get_callable( 'jetpack_foo' ) );
	}

	function test_full_sync_sends_all_functions_inverse() {
		Modules::get_module( "functions" )->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_full_sync_callable' ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'jetpack_foo' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->server_replica_storage->reset();
		$this->server_event_storage->reset();

		$this->resetCallableAndConstantTimeouts();
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_callable( 'jetpack_foo' ) );
		$events = $this->server_event_storage->get_all_events( 'jetpack_sync_callable' );
		$this->assertTrue( empty( $events ) );

	}

	function test_full_sync_sends_all_options() {
		delete_option( 'non_existant' );
		Modules::get_module( "options" )->set_options_whitelist( array(
			'my_option',
			'my_prefix_value',
			'non_existant'
		) );
		update_option( 'my_option', 'foo' );
		update_option( 'my_prefix_value', 'bar' );
		update_option( 'my_non_synced_option', 'baz' );

		$this->sender->do_sync();

		// confirm sync worked as expected
		$this->assertEquals( 'foo', $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_non_synced_option' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'non_existant' ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'non_existant' ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$synced_options_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_options' );
		$this->assertEquals( sizeof( $synced_options_event->args ), 2, 'Size of synced options not as expected' );
		$this->assertEquals( 'foo', $synced_options_event->args['my_option'] );
		$this->assertEquals( 'bar', $synced_options_event->args['my_prefix_value'] );

		$this->assertEquals( 'foo', $this->server_replica_storage->get_option( 'my_option' ) );
		$this->assertEquals( 'bar', $this->server_replica_storage->get_option( 'my_prefix_value' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'my_non_synced_option' ) );
		$this->assertEquals( null, $this->server_replica_storage->get_option( 'non_existant' ) );
	}

	// to test run phpunit -c tests/php.multisite.xml --filter test_full_sync_sends_all_network_options
	function test_full_sync_sends_all_network_options() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		Modules::get_module( "network_options" )->set_network_options_whitelist( array(
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

		Settings::update_settings( array( 'post_meta_whitelist' => array( 'test_meta_key', 'test_meta_array' ) ) );

		add_post_meta( $post_id, 'test_meta_key', 'foo' );
		add_post_meta( $post_id, 'test_meta_array', array( 'foo', 'bar' ) );

		$this->sender->do_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );
		$this->assertEquals( array(
			'foo',
			'bar'
		), $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_array', true ) );

		// reset the storage, check value, and do full sync - storage should be set!
		$this->server_replica_storage->reset();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );
		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_array', true ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 'foo', $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_key', true ) );
		$this->assertEquals( array(
			'foo',
			'bar'
		), $this->server_replica_storage->get_metadata( 'post', $post_id, 'test_meta_array', true ) );
	}

	function test_full_sync_doesnt_sends_forbiden_private_or_public_post_meta() {
		$post_id = $this->factory->post->create();

		$meta_module = Modules::get_module( "meta" );
		Settings::update_settings( array( 'post_meta_whitelist' => array( 'a_public_meta' ) ) );

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

		$this->assertEqualsObject( $terms, $this->server_replica_storage->get_the_terms( $post_id, 'post_tag' ), 'Full sync doesn\'t work' );
	}

	function test_full_sync_sends_all_comment_meta() {
		$post_id     = $this->factory->post->create();
		$comment_ids = $this->factory->comment->create_post_comments( $post_id );
		$comment_id  = $comment_ids[0];

		Settings::update_settings( array( 'comment_meta_whitelist' => array( 'test_meta_key' ) ) );

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
		$local_option  = get_option( 'theme_mods_twentyfourteen' );
		$remote_option = $this->server_replica_storage->get_option( 'theme_mods_twentyfourteen' );

		if ( isset( $local_option[0] ) ) {
			// this is a spurious value that sometimes gets set during tests, and is
			// actively removed before sending to WPCOM
			// it appears to be due to a bug which sets array( false ) as the default value for theme_mods
			unset( $local_option[0] );
		}

		$this->assertEquals( $local_option, $remote_option );

		$synced_theme_caps_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_theme_data' );
		$synced_theme_info       = $synced_theme_caps_event->args[0];

		$this->assertTrue( isset( $synced_theme_info['name'] ) );
		$this->assertTrue( isset( $synced_theme_info['slug'] ) );
		$this->assertTrue( isset( $synced_theme_info['uri'] ) );
		$this->assertTrue( isset( $synced_theme_info['version'] ) );

		$theme_support = $this->server_replica_storage->get_callable( 'theme_support' );
		$this->assertTrue( isset( $theme_support['post-thumbnails'] ) );

		$this->assertTrue( $theme_support['post-thumbnails'] );

		$this->assertTrue( $this->server_replica_storage->current_theme_supports( 'post-thumbnails' ) );
	}

	function test_full_sync_sends_plugin_updates() {

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_plugins();
		$this->check_for_updates_to_sync();
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

	function check_for_updates_to_sync() {
		$updates_module = Modules::get_module( 'updates' );
		$updates_module->sync_last_event();
	}

	function test_full_sync_sends_theme_updates() {

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_themes();
		$this->check_for_updates_to_sync();
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

	function test_full_sync_start_sends_configuration() {
		$post_ids = $this->factory->post->create_many( 3 );

		// this is so that on WPCOM we can tell what has been synchronized in the past
		add_action( 'jetpack_full_sync_start', array( $this, 'record_full_sync_start_config' ), 10, 1 );

		$standard_config = array(
			'constants'          => 1,
			'functions'          => 1,
			'options'            => 1,
			'terms'              => 1,
			'term_relationships' => 1,
			'themes'             => 1,
			'users'              => 1,
			'updates'            => 1,
			'posts'              => 1,
			'comments'           => 1,
		);

		if ( is_multisite() ) {
			$standard_config['network_options'] = 1;
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

	function test_full_sync_end_sends_range() {
		$this->create_dummy_data_and_reset_sync_status();
		add_action( 'jetpack_full_sync_end', array( $this, 'record_full_sync_end_checksum' ), 10, 2 );

		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->sender->do_full_sync();
		$this->sender->do_full_sync();

		$this->assertTrue( isset( $this->full_sync_end_range ) );
		$this->assertTrue( isset( $this->full_sync_end_range['posts']->max ) );
		$this->assertTrue( isset( $this->full_sync_end_range['posts']->min ) );
		$this->assertTrue( isset( $this->full_sync_end_range['posts']->count ) );

		$this->assertTrue( isset( $this->full_sync_end_range['comments']->max ) );
		$this->assertTrue( isset( $this->full_sync_end_range['comments']->min ) );
		$this->assertTrue( isset( $this->full_sync_end_range['comments']->count ) );

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_end' );

		list( $checksum, $range ) = $event->args;
		$this->assertTrue( isset( $range['posts']->max ) );
		$this->assertTrue( isset( $range['posts']->min ) );
		$this->assertTrue( isset( $range['posts']->count ) );

		$this->assertTrue( isset( $range['comments']->max ) );
		$this->assertTrue( isset( $range['comments']->min ) );
		$this->assertTrue( isset( $range['comments']->count ) );
	}

	function create_dummy_data_and_reset_sync_status() {
		// lets create a bunch of posts
		for ( $i = 0; $i < $this->test_posts_count; $i += 1 ) {
			$post = $this->factory->post->create();
		}
		// lets create a bunch of comments
		$this->factory->comment->create_post_comments( $post, $this->test_comments_count );

		// reset the data before the full sync
		$this->sender->reset_data();
	}

	function record_full_sync_end_checksum( $checksum, $range ) {
		// $checksum  has been deprecated...
		$this->full_sync_end_range = $range;
	}

	function record_full_sync_start_config( $modules ) {
		$this->full_sync_start_config = $modules;
	}

	function test_full_sync_status_should_be_not_started_after_reset() {
		$this->create_dummy_data_and_reset_sync_status();

		$full_sync_status = $this->full_sync->get_status();

		$this->assertEquals(
			$full_sync_status,
			array(
				'started'  => false,
				'finished' => false,
				'progress' => [],
				'config'   => [],
			)
		);
	}

	function test_full_sync_status_after_start() {
		$this->create_dummy_data_and_reset_sync_status();

		$this->full_sync->start();

		$full_sync_status = $this->full_sync->get_status();

		$this->assertIsInt( $full_sync_status['started'] );
		$this->assertFalse( $full_sync_status['finished'] );
		$this->assertIsArray( $full_sync_status['progress'] );
		$this->assertEquals( count( \Automattic\Jetpack\Sync\Defaults::get_constants_whitelist() ), $full_sync_status['progress']['constants']['total'] );
	}

	function test_full_sync_status_after_end() {
		$this->create_dummy_data_and_reset_sync_status();

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$status = $this->full_sync->get_status();

		foreach( $status['progress'] as $module_status ) {
			if ( isset( $module_status['total'] ) ) {
				$this->assertEquals( $module_status['total'], $module_status['sent'] );
			}
			$this->assertTrue( $module_status['finished'] ); // TODO: this could be a timestamp
		}

		$this->assertIsInt( $status['finished'] );
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

		$this->full_sync->start( array(
			'posts'    => array( $non_existent_id ),
			'comments' => array( $non_existent_id ),
			'users'    => array( $non_existent_id )
		) );
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
		$post_id = $this->factory->post->create();
		list( $sync_comment_id, $no_sync_comment_id, $sync_comment_id_2 ) = $this->factory->comment->create_post_comments( $post_id, 3 );

		$this->full_sync->start( array( 'comments' => array( $sync_comment_id, $sync_comment_id_2 ) ) );
		$this->sender->do_full_sync();

		$synced_comments_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_comments' );

		$comments = $synced_comments_event->args[0];

		$this->assertEquals( 2, count( $comments ) );
		$comment_ids = array( (int) $comments[0]->comment_ID, (int) $comments[1]->comment_ID );

		$this->assertContains( $sync_comment_id, $comment_ids );
		$this->assertContains( $sync_comment_id_2, $comment_ids );

		$sync_status = $this->full_sync->get_status();
		$this->assertEquals( array( $sync_comment_id, $sync_comment_id_2 ), $sync_status['config']['comments'] );
	}

	function test_full_sync_can_sync_individual_users() {
		$sync_user_id   = $this->factory->user->create( array( 'role' => 'editor' ) );
		$sync_user_id_2 = $this->factory->user->create( array( 'role' => 'editor' ) );
		$this->factory->user->create( array( 'role' => 'editor' ) );

		$this->full_sync->start( array( 'users' => array( $sync_user_id, $sync_user_id_2 ) ) );
		$this->sender->do_full_sync();

		$synced_users_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_users' );

		$users = $synced_users_event->args['users'];

		$this->assertEquals( 2, count( $users ) );
		// The users are ordered in reverse order now.
		$this->assertEquals( $sync_user_id_2, $users[0]->ID );
		$this->assertEquals( $sync_user_id, $users[1]->ID );

		$sync_status = $this->full_sync->get_status();
		$this->assertEquals( array( $sync_user_id, $sync_user_id_2 ), $sync_status['config']['users'] );
	}

	function test_full_sync_doesnt_send_deleted_posts() {
		// previously, the behavior was to send false or throw errors - we
		// should actively detect false values and remove them
		$keep_post_id   = $this->factory->post->create( array( 'role' => 'editor' ) );
		$delete_post_id = $this->factory->post->create( array( 'role' => 'editor' ) );

		$this->full_sync->start();

		wp_delete_post( $delete_post_id, true );

		$this->sender->do_full_sync();

		$synced_posts_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_posts' );

		$posts = $synced_posts_event->args[0];
		$this->assertEquals( 1, count( $posts ) );
		$this->assertEquals( $keep_post_id, $posts[0]->ID );
	}

	function test_full_sync_doesnt_send_deleted_comments() {
		// previously, the behavior was to send false or throw errors - we
		// should actively detect false values and remove them
		$post_id = $this->factory->post->create();
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
		$user_counts         = count_users();
		$existing_user_count = $user_counts['total_users'];

		// previously, the behavior was to send false or throw errors - we
		// should actively detect false values and remove them
		$keep_user_id   = $this->factory->user->create( array( 'role' => 'contributor' ) );
		$delete_user_id = $this->factory->user->create( array( 'role' => 'contributor' ) );

		$this->full_sync->start();

		wp_delete_user( $delete_user_id );

		$this->sender->do_full_sync();

		$synced_users_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_users' );
		$users              = $synced_users_event->args['users'];

		$this->assertEquals( $existing_user_count + 1, count( $users ) );
		// the last created user should be the fist sent out.
		$this->assertEquals( $keep_user_id, $users[0]->ID );
	}

	function test_full_sync_has_correct_sent_count_even_if_some_actions_unsent() {
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_users', array( $this, 'dont_sync_users' ) );

		foreach ( range( 1, 3 ) as $i ) {
			$this->factory->user->create();
		}

		$this->full_sync->start( array( 'users' => true ) );

		$this->sender->do_full_sync();
		$this->sender->do_full_sync();
		$this->sender->do_full_sync();

		$full_sync_status = $this->full_sync->get_status();

		$this->assertEquals( $full_sync_status['progress']['users']['total'], $full_sync_status['progress']['users']['sent'] );
	}

	function dont_sync_users( $args ) {
		return false;
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
		foreach ( range( 1, 10 ) as $i ) {
			$this->factory->user->create( array( 'role' => 'subscriber' ) );
		}
		$this->full_sync->start();
		$this->sender->do_full_sync();
		$this->assertEquals( 3, $this->server_replica_storage->user_count() );
		$this->server_replica_storage->reset();
		$this->assertEquals( 0, $this->server_replica_storage->user_count() );
		$user_ids = Modules::get_module( 'users' )->get_initial_sync_user_config();
		$this->assertEquals( 3, count( $user_ids ) );
		$this->full_sync->start( array( 'users' => 'initial' ) );
		$this->sender->do_full_sync();
		$this->assertEquals( 3, $this->server_replica_storage->user_count() );
		// finally, let's make sure that the initial sync method actually invokes our initial sync user config
		Actions::do_initial_sync();
		$current_user = wp_get_current_user();

		$expected_sync_config = array(
			'options'         => true,
			'functions'       => true,
			'constants'       => true,
			'users'           => array( $current_user->ID ),
			'network_options' => true,
		);

		$full_sync_status = $this->full_sync->get_status();
		$this->assertEquals(
			$expected_sync_config,
			$full_sync_status['config']
		);
	}


	function test_full_sync_sends_previous_interval_end_on_posts() {
		$this->factory->post->create_many( 25 );

		// The first event is for full sync start.
		$this->full_sync->start( array( 'posts' => true ) );
		$this->sender->do_full_sync();

		$this->full_sync->continue_sending();
		$this->sender->do_full_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_full_sync_posts' );
		list( $posts, $meta, $taxonomy, $previous_interval_end ) = $events[0]->args;

		// The first batch has the previous_min_is not set.
		// We user ~0 to denote that the previous min id unknown.
		$this->assertEquals( '~0', $previous_interval_end );
	}

	function test_full_sync_sends_previous_interval_end_on_comments() {
		$this->post_id = $this->factory->post->create();
		for ( $i = 0; $i < 25; $i ++ ) {
			$this->factory->comment->create_post_comments( $this->post_id );
		}
		// The first event is for full sync start.
		$this->full_sync->start( array( 'comments' => true ) );
		$this->sender->do_full_sync();

		$this->full_sync->continue_sending();
		$this->sender->do_full_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_full_sync_comments' );
		list( $comments, $meta, $previous_interval_end ) = $events[0]->args;

		// The first batch has the previous_min_is not set.
		// We user ~0 to denote that the previous min id unknown.
		$this->assertEquals( $previous_interval_end, '~0' );
	}

	function test_disable_sending_full_sync() {
		$this->factory->post->create_many( 2 );

		$this->sender->reset_data();
		$this->server_event_storage->reset();

		Settings::update_settings( array( 'full_sync_sender_enabled' => 0 ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$start_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_start' );
		$this->assertTrue( ! $start_event );
	}

	function test_full_sync_send_max_chunks() {
		$this->factory->post->create_many( 10 );

		$this->sender->reset_data();
		$this->server_event_storage->reset();

		$limits = \Automattic\Jetpack\Sync\Defaults::$default_full_sync_limits;
		$limits['posts'] = array(
			'chunk_size' => 1,
			'max_chunks' => 5,
		);

		Settings::update_settings( array( 'full_sync_limits' => $limits ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$this->assertEquals( 5, $this->server_replica_storage->post_count() );
	}

	function test_enable_sending_full_sync() {
		$this->factory->post->create_many( 2 );

		$this->sender->reset_data();
		$this->server_event_storage->reset();

		Settings::update_settings( array( 'full_sync_sender_enabled' => 1 ) );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$start_event = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_start' );
		$this->assertTrue( ! empty( $start_event ) );
	}

	function _do_cron() {
		$_GET['check'] = wp_hash( '187425' );
		require( ABSPATH . '/wp-cron.php' );
	}
}
