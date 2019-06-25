<?php

use Automattic\Jetpack\Sync\Defaults;

/**
 * Testing CRUD on Meta
 */

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

require_jetpack_file( 'modules/contact-form/grunion-contact-form.php' );

class WP_Test_Jetpack_Sync_Meta extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $meta_module;

	protected $whitelisted_post_meta = 'foobar';

	public function setUp() {
		parent::setUp();

		// create a post
		$this->meta_module = Modules::get_module( "meta" );
		Settings::update_settings( array( 'post_meta_whitelist' => array( 'foobar' ) ) );
		$this->post_id = $this->factory->post->create();
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );
		$this->sender->do_sync();
	}

	public function test_added_post_meta_is_synced() {

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );

		$this->assertEquals( 'foo', $meta_key_value );
		$this->assertEquals( array( 'foo' ), $meta_key_array );
	}

	public function test_added_multiple_post_meta_is_synced() {

		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo', true );
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'bar' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( array( 'foo', 'bar' ), $meta_key_array );
	}

	public function test_add_then_updated_post_meta_is_synced() {
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );
		update_post_meta( $this->post_id, $this->whitelisted_post_meta, 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_updated_post_meta_is_synced() {
		update_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );
		update_post_meta( $this->post_id, $this->whitelisted_post_meta, 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_deleted_post_meta_is_synced() {
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );

		delete_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );

		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta, true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_delete_all_post_meta_is_synced() {

		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );

		delete_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, '', true );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta, true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_doesn_t_sync_private_meta() {
		add_post_meta( $this->post_id, '_private_meta', 'foo' );

		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );
	}

	public function test_post_meta_whitelist_cab_be_appened_in_settings() {
		add_post_meta( $this->post_id, '_private_meta', 'foo' );
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );

		Settings::update_settings( array( 'post_meta_whitelist' => array( '_private_meta' ) ) );

		add_post_meta( $this->post_id, '_private_meta', 'boo' );

		$this->sender->do_sync();

		$this->assertEquals( 'boo', $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );
	}

	public function test_comment_meta_whitelist_cab_be_appened_in_settings() {
		$comment_ids = $this->factory->comment->create_post_comments( $this->post_id );

		add_comment_meta( $comment_ids[0], '_private_meta', 'foo' );
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'comment', $comment_ids[0], '_private_meta', true ) );

		Settings::update_settings( array( 'comment_meta_whitelist' => array( '_private_meta' ) ) );

		add_comment_meta( $comment_ids[0], '_private_meta', 'boo' );
		$this->sender->do_sync();

		$this->assertEquals( 'boo', $this->server_replica_storage->get_metadata( 'comment', $comment_ids[0], '_private_meta', true ) );
	}

	public function test_sync_whitelisted_post_meta() {
		Settings::update_settings( array( 'post_meta_whitelist' => array() ) );
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_post_meta = Defaults::$post_meta_whitelist;

		// update all the opyions.
		foreach ( $white_listed_post_meta as $meta_key ) {
			add_post_meta( $this->post_id, $meta_key, 'foo' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_post_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'post', $this->post_id );
		}
		$whitelist = Settings::get_setting( 'post_meta_whitelist' );

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_post_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_sync_whitelisted_comment_meta() {
		Settings::update_settings( array( 'comment_meta_whitelist' => array() ) );
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_comment_meta = Defaults::$comment_meta_whitelist;

		$comment_ids = $this->factory->comment->create_post_comments( $this->post_id );

		// update all the comment meta
		foreach ( $white_listed_comment_meta as $meta_key ) {
			add_comment_meta( $comment_ids[0], $meta_key, 'foo', 'comment' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_comment_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'comment', $comment_ids[0] );
		}
		$whitelist = Settings::get_setting( 'comment_meta_whitelist' );

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_comment_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_syncs_wpas_skip_meta() {
		$this->setSyncClientDefaults();
		add_post_meta( $this->post_id, '_wpas_skip_1234', '1' );
		$this->sender->do_sync();

		$this->assertOptionIsSynced( '_wpas_skip_1234', '1', 'post', $this->post_id );
	}

	public function test_sync_daily_akismet_meta_cleanup() {
		$this->sender->do_sync();
		$this->server_event_storage->reset();
		$post_id = wp_insert_post( array( 'post_type' => 'feedback', 'post_title' => 'fun' ) );
		// This event can trigger a deletion of many _feedbacakismet_values terms.
		add_post_meta( $post_id, '_feedback_akismet_values', '1' );

		$grunion = Grunion_Contact_Form_Plugin::init();
		$grunion->daily_akismet_meta_cleanup();

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_post_meta_batch_delete' );

		$this->assertEquals( array( $post_id ), $event->args[0] );
		$this->assertEquals( '_feedback_akismet_values', $event->args[1] );

		$event = $this->server_event_storage->get_most_recent_event( 'deleted_post_meta' );

		$this->assertFalse( $event );
		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $post_id, '_feedback_akismet_values', true );
		$this->assertEquals( get_post_meta( $post_id, '_feedback_akismet_values', true ), $meta_key_value );
	}

	function assertOptionIsSynced( $meta_key, $value, $type, $object_id ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_metadata( $type, $object_id, $meta_key, true ) );
	}

}
