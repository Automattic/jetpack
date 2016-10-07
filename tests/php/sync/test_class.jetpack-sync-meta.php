<?php

/**
 * Testing CRUD on Meta
 */
class WP_Test_Jetpack_Sync_Meta extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $meta_module;

	public function setUp() {
		parent::setUp();

		// create a post
		$this->meta_module = Jetpack_Sync_Modules::get_module( "meta" );
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key' ) );
		$this->post_id = $this->factory->post->create();
		add_post_meta( $this->post_id, 'test_meta_key', 'foo' );
		$this->sender->do_sync();
	}

	public function test_added_post_meta_is_synced() {

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key' );

		$this->assertEquals( 'foo', $meta_key_value );
		$this->assertEquals( array( 'foo' ), $meta_key_array );
	}

	public function test_added_multiple_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key_array' ) );

		add_post_meta( $this->post_id, 'test_meta_key_array', 'foo' );
		add_post_meta( $this->post_id, 'test_meta_key_array', 'bar' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array' );

		$this->assertEquals( array( 'foo', 'bar' ), $meta_key_array );
	}

	public function test_add_then_updated_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key_array_2' ) );
		add_post_meta( $this->post_id, 'test_meta_key_array_2', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_2', 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_2' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_2' ), $meta_key_array );
	}

	public function test_updated_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key_array_3' ) );
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_3' );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_3' ), $meta_key_array );
	}

	public function test_deleted_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_delete' ) );
		add_post_meta( $this->post_id, 'test_meta_delete', 'foo' );

		delete_post_meta( $this->post_id, 'test_meta_delete', 'foo' );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete', true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete' ), $meta_key_array );
	}

	public function test_delete_all_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_delete_all' ) );
		add_post_meta( $this->post_id, 'test_meta_delete_all', 'foo' );

		delete_metadata( 'post', $this->post_id, 'test_meta_delete_all', '', true );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete_all', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete_all' );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete_all', true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete_all' ), $meta_key_array );
	}

	public function test_doesn_t_sync_private_meta() {
		// $ignore_meta_keys = array( '_edit_lock', '_pingme', '_encloseme' );
		add_post_meta( $this->post_id, '_private_meta', 'foo' );

		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );
	}

	public function test_sync_whitelisted_post_meta() {
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_post_meta = array(
			'_feedback_akismet_values',
			'_feedback_email',
			'_feedback_extra_fields',
			'_g_feedback_shortcode',
			'_jetpack_author',
			'_jetpack_author_email',
			'_jetpack_dont_email_post_to_subs',
			'_jetpack_post_author_external_id',
			'_jetpack_post_thumbnail',
			'_menu_item_classes',
			'_menu_item_menu_item_parent',
			'_menu_item_object',
			'_menu_item_object_id',
			'_menu_item_orphaned',
			'_menu_item_type',
			'_menu_item_xfn',
			'_publicize_done_external',
			'_publicize_facebook_user',
			'_publicize_pending',
			'_publicize_twitter_user',
			'_thumbnail_id',
			'_wp_attached_file',
			'_wp_attachment_backup_sizes',
			'_wp_attachment_backup_sizes',
			'_wp_attachment_context',
			'_wp_attachment_image_alt',
			'_wp_attachment_is_custom_background',
			'_wp_attachment_is_custom_header',
			'_wp_attachment_metadata',
			'_wp_desired_post_slug',
			'_wp_old_slug',
			'_wp_page_template',
			'_wp_trash_meta_comments_status',
			'_wp_trash_meta_status',
			'_wp_trash_meta_time',
			'_wpas_done_all',
			'_wpas_mess',
			'content_width',
			'custom_css_add',
			'custom_css_preprocessor',
			'enclosure',
			'imagedata',
			'nova_price',
			'publicize_results',
			'sharing_disabled',
			'sharing_disabled',
			'switch_like_status',
			'videopress_guid',
			'vimeo_poster_image',
		);



		// update all the opyions.
		foreach ( $white_listed_post_meta as $meta_key ) {
			add_post_meta( $this->post_id, $meta_key, 'foo' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_post_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'post', $this->post_id );
		}
		$whitelist = $this->meta_module->get_post_meta_whitelist();

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_post_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_sync_whitelisted_comment_meta() {
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_comment_meta = array(
			'akismet_result',
			'akismet_error',
			'akismet_user',
			'akismet_user_result',
			'akismet_rechecking',
			'akismet_as_submitted',
			'akismet_delayed_moderation_email',
			'hc_avatar',
			'_wp_trash_meta_time',
			'_wp_trash_meta_status'
		);

		$comment_ids = $this->factory->comment->create_post_comments( $this->post_id );

		// update all the comment meta
		foreach ( $white_listed_comment_meta as $meta_key ) {
			add_comment_meta( $comment_ids[0], $meta_key, 'foo', 'comment' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_comment_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'comment', $comment_ids[0] );
		}
		$whitelist = $this->meta_module->get_comment_meta_whitelist();

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_comment_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	function assertOptionIsSynced( $meta_key, $value, $type, $object_id ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_metadata( $type, $object_id, $meta_key, true ) );
	}

}
