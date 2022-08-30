<?php

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

/**
 * Testing CRUD on Posts
 *
 * @group jetpack-sync
 */
class WP_Test_Jetpack_Sync_Post extends WP_Test_Jetpack_Sync_Base {

	protected $post;
	protected $test_already = false;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$user_id = $this->factory->user->create();

		// create a post
		$post_id    = $this->factory->post->create( array( 'post_author' => $user_id ) );
		$this->post = get_post( $post_id );

		$this->sender->do_sync();
	}

	/**
	 * Verify post_content is limited based on MAX_POST_CONTENT_LENGTH.
	 */
	public function test_post_content_limit() {

		$post_sync_module = Modules::get_module( 'posts' );

		$this->post->post_content = str_repeat( 'X', Automattic\Jetpack\Sync\Modules\Posts::MAX_POST_CONTENT_LENGTH - 1 );
		$filtered_post            = $post_sync_module->filter_post_content_and_add_links( $this->post );
		$this->assertNotEmpty( $filtered_post->post_content, 'Filtered post content is empty for stings of allowed length.' );

		$this->post->post_content = str_repeat( 'X', Automattic\Jetpack\Sync\Modules\Posts::MAX_POST_CONTENT_LENGTH );
		$filtered_post            = $post_sync_module->filter_post_content_and_add_links( $this->post );
		$this->assertEmpty( $filtered_post->post_content, 'Filtered post content is not truncated (empty) for stings larger than allowed length.' );

	}

	public function test_add_post_syncs_event() {
		// event stored by server should event fired by client
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$this->assertEquals( $this->post->ID, $event->args[0] );

		$post_sync_module = Modules::get_module( 'posts' );

		$this->post = $post_sync_module->filter_post_content_and_add_links( $this->post );
		$this->assertEqualsObject( $this->post, $event->args[1], 'Synced post does not match local post.' );
	}

	public function test_add_post_syncs_post_data() {
		// post stored by server should equal post in client
		$this->assertSame( 1, $this->server_replica_storage->post_count() );

		$post_sync_module = Modules::get_module( 'posts' );

		$this->post = $post_sync_module->filter_post_content_and_add_links( $this->post );
		$this->assertEquals( $this->post, $this->server_replica_storage->get_post( $this->post->ID ) );
	}

	public function test_add_post_syncs_request_is_auto_save() {
		// Sync from setup should not be auto save.
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$this->assertFalse( $event->args[3]['is_auto_save'] );

		Constants::set_constant( 'DOING_AUTOSAVE', true );

		// Performing sync here (even though set_up() does it) to sync REQUEST_URI.
		$user_id = $this->factory->user->create();
		$this->factory->post->create( array( 'post_author' => $user_id ) );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$this->assertTrue( $event->args[3]['is_auto_save'] );
	}

	public function test_trash_post_trashes_data() {
		$this->assertSame( 1, $this->server_replica_storage->post_count( 'publish' ) );
		$this->server_event_storage->reset();
		wp_delete_post( $this->post->ID );

		$this->sender->do_sync();
		$insert_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );

		$this->assertEquals( 'trash', $insert_event->args[1]->post_status );
		$this->assertEquals( $insert_event->args[0], $this->post->ID );

		$this->server_event_storage->reset();

		$this->assertSame( 0, $this->server_replica_storage->post_count( 'publish' ) );
		$this->assertSame( 1, $this->server_replica_storage->post_count( 'trash' ) );
		wp_delete_post( $this->post->ID );
		$this->sender->do_sync();

		// Since the post status is not changing here we don't expect the post to be trashed again.
		$delete_event = $this->server_event_storage->get_most_recent_event( 'deleted_post' );
		$save_event   = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$this->assertFalse( $save_event );
		$this->assertTrue( (bool) $delete_event );
	}

	public function test_sync_post_event_includes_previous_state() {
		$this->assertSame( 1, $this->server_replica_storage->post_count( 'publish' ) );
		$this->server_event_storage->reset();
		wp_delete_post( $this->post->ID );
		$this->sender->do_sync();
		$insert_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$this->assertEquals( 'trash', $insert_event->args[1]->post_status );
		$this->assertEquals( 'publish', $insert_event->args[3]['previous_status'] );
	}

	public function test_delete_post_deletes_data() {
		$this->assertSame( 1, $this->server_replica_storage->post_count( 'publish' ) );

		wp_delete_post( $this->post->ID, true );

		$this->sender->do_sync();

		// there should be no posts at all
		$this->assertSame( 0, $this->server_replica_storage->post_count() );
	}

	public function test_delete_post_syncs_event() {
		wp_delete_post( $this->post->ID, true );

		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event();

		$this->assertEquals( 'deleted_post', $event->action );
		$this->assertEquals( $this->post->ID, $event->args[0] );
	}

	public function test_update_post_includes_gutenberg_info_in_state() {
		$this->post->post_content = 'Updated using classic editor';

		wp_update_post( $this->post );

		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );

		$this->assertFalse( $event->args[3]['is_gutenberg_meta_box_update'] );
	}

	public function test_update_post_updates_data() {
		$this->post->post_content = 'foo bar';

		wp_update_post( $this->post );

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( 'foo bar', $remote_post->post_content );

		$this->assertDataIsSynced();
	}

	public function test_sync_new_page() {
		$this->post->post_type = 'page';
		$this->post_id         = wp_insert_post( $this->post );

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( 'page', $remote_post->post_type );
	}

	public function test_sync_post_status_change() {

		$this->assertNotEquals( 'draft', $this->post->post_status );

		wp_update_post(
			array(
				'ID'          => $this->post->ID,
				'post_status' => 'draft',
			)
		);

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( 'draft', $remote_post->post_status );

		wp_publish_post( $this->post->ID );

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( 'publish', $remote_post->post_status );
	}

	public function test_sync_attachment_is_synced() {
		$filename = __DIR__ . '/../files/jetpack.jpg';

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( basename( $filename ), null );

		// Get the path to the upload directory.
		$wp_upload_dir = wp_upload_dir();

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename, $this->post->ID );
		$this->sender->do_sync();

		$this->assertAttachmentSynced( $attach_id );
		// Make sure that this file is included, as wp_generate_attachment_metadata() depends on it.

		require_once ABSPATH . 'wp-admin/includes/image.php';
		$attach_data = wp_generate_attachment_metadata( $attach_id, $filename );
		wp_update_attachment_metadata( $attach_id, $attach_data );
		set_post_thumbnail( $this->post->ID, $attach_id );

		// Generate the metadata for the attachment, and update the database record.
		$attach_data = wp_generate_attachment_metadata( $attach_id, $filename );
		wp_update_attachment_metadata( $attach_id, $attach_data );

		$this->sender->do_sync();

		$meta_attachment_metadata = $this->server_replica_storage->get_metadata( 'post', $attach_id, '_wp_attachment_metadata', true );
		$this->assertEqualsObject( get_post_meta( $attach_id, '_wp_attachment_metadata', true ), $meta_attachment_metadata, 'Synced meta does not match local meta.' );

		$meta_thumbnail_id = $this->server_replica_storage->get_metadata( 'post', $this->post->ID, '_thumbnail_id', true );
		$this->assertEquals( get_post_meta( $this->post->ID, '_thumbnail_id', true ), $meta_thumbnail_id );
	}

	public function test_sync_attachment_update_is_synced() {
		$filename = __DIR__ . '/../files/jetpack.jpg';

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( basename( $filename ), null );

		// Get the path to the upload directory.
		$wp_upload_dir = wp_upload_dir();

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename, $this->post->ID );

		$this->sender->do_sync();

		// Test that the first event is add_attachment
		$update_attachment_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_update_attachment' );
		$add_attachment_event    = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_add_attachment' );
		$this->assertTrue( (bool) $add_attachment_event );
		$this->assertFalse( (bool) $update_attachment_event );

		$this->server_event_storage->reset();

		$this->assertAttachmentSynced( $attach_id );

		// Update attachment
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
			'post_content'   => 'foo',
			'post_status'    => 'inherit',
			'ID'             => $attach_id,

		);

		$attach_id = wp_insert_attachment( $attachment, $filename, $this->post->ID );

		$this->sender->do_sync();

		$remote_attachment = $this->server_replica_storage->get_post( $attach_id );
		$attachment        = get_post( $attach_id );

		$this->assertEquals( $attachment, $remote_attachment );

		$update_attachment_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_update_attachment' );
		$add_attachment_event    = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_add_attachment' );
		$this->assertTrue( (bool) $update_attachment_event );
		$this->assertFalse( (bool) $add_attachment_event );
	}

	public function test_sync_attach_attachment_to_post() {
		$filename = __DIR__ . '/../files/jetpack.jpg';

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( basename( $filename ), null );

		// Get the path to the upload directory.
		$wp_upload_dir = wp_upload_dir();

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Give attachment a parent id
		$post_id          = wp_insert_attachment( $attachment, __DIR__ . '/../files/jetpack.jpg' );
		$attachment['ID'] = $post_id;

		$this->sender->do_sync();
		$this->server_event_storage->reset();

		$post_id = wp_insert_attachment( $attachment, __DIR__ . '/../files/jetpack.jpg', 1000 );

		$this->sender->do_sync();

		$remote_attachment = $this->server_replica_storage->get_post( $post_id );
		$attachment        = get_post( $post_id );

		$this->assertEquals( $attachment, $remote_attachment );

		$attach_attachment_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_attach_attachment' );
		$update_attachment_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_update_attachment' );
		$add_attachment_event    = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_add_attachment' );

		$this->assertTrue( (bool) $attach_attachment_event );
		$this->assertFalse( (bool) $update_attachment_event );
		$this->assertFalse( (bool) $add_attachment_event );
	}

	public function test_broken_do_wp_insert_post_does_not_break_sync() {
		// Some plugins do unexpected things see pet-manager
		$this->server_event_storage->reset();
		do_action( 'wp_insert_post', 'wp_insert_post' );
		$this->sender->do_sync();

		$should_not_be_there = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );
		$this->assertFalse( (bool) $should_not_be_there );

	}

	public function test_sync_attachment_delete_is_synced() {
		$filename      = __DIR__ . '/../files/jetpack.jpg';
		$filename_copy = __DIR__ . '/../files/jetpack-copy.jpg';
		@copy( $filename, $filename_copy ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( basename( $filename_copy ), null );

		// Get the path to the upload directory.
		$wp_upload_dir = wp_upload_dir();

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename_copy ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename_copy ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename_copy, $this->post->ID );
		$this->sender->do_sync();

		$this->assertAttachmentSynced( $attach_id );

		// Update attachment
		wp_delete_attachment( $attach_id );

		$this->sender->do_sync();

		$remote_attachment = $this->server_replica_storage->get_post( $attach_id );
		$attachment        = get_post( $attach_id );

		$this->assertEquals( $attachment, $remote_attachment );

	}

	public function test_sync_attachment_force_delete_is_synced() {
		$filename      = __DIR__ . '/../files/jetpack.jpg';
		$filename_copy = __DIR__ . '/../files/jetpack-copy.jpg';
		@copy( $filename, $filename_copy ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( basename( $filename_copy ), null );

		// Get the path to the upload directory.
		$wp_upload_dir = wp_upload_dir();

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename_copy ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename_copy ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename_copy, $this->post->ID );
		$this->sender->do_sync();

		$this->assertAttachmentSynced( $attach_id );

		// Update attachment
		wp_delete_attachment( $attach_id, true );

		$this->sender->do_sync();

		$remote_attachment = $this->server_replica_storage->get_post( $attach_id );
		$attachment        = get_post( $attach_id );

		$this->assertEquals( $attachment, $remote_attachment );
	}

	public function test_sync_post_filtered_content_was_filtered() {
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );
		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );
		$this->post->post_content = '[foo]';

		wp_update_post( $this->post );
		$this->sender->do_sync();

		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( '[foo]', $post_on_server->post_content );
		$this->assertEquals( trim( $post_on_server->post_content_filtered ), 'bar' );
	}

	public function test_sync_disabled_post_filtered_content() {
		Settings::update_settings( array( 'render_filtered_content' => 0 ) );

		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );
		$this->post->post_content = '[foo]';

		wp_update_post( $this->post );
		$this->sender->do_sync();

		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( '[foo]', $post_on_server->post_content );
		$this->assertEmpty( $post_on_server->post_content_filtered );

		Settings::update_settings( array( 'render_filtered_content' => 1 ) );
	}

	public function test_sync_post_filtered_excerpt_was_filtered() {
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );
		$this->post->post_excerpt = '[foo]';

		wp_update_post( $this->post );
		$this->sender->do_sync();

		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( '[foo]', $post_on_server->post_excerpt );
		// The excerpt by default should not contain shortcodes so we do not expand them.
		$this->assertEquals( trim( $post_on_server->post_excerpt_filtered ), '[foo]' );
	}

	public function test_sync_post_filter_do_not_expand_jetpack_shortcodes() {
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		add_filter( 'jetpack_sync_do_not_expand_shortcodes', array( $this, 'do_not_expand_shortcode' ) );
		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );

		$this->post->post_content = '[foo]';

		wp_update_post( $this->post );
		$this->sender->do_sync();

		remove_filter( 'jetpack_sync_do_not_expand_shortcode', array( $this, 'do_not_expand_shortcode' ) );

		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( '[foo]', $post_on_server->post_content );
		$this->assertEquals( trim( $post_on_server->post_content_filtered ), '<p>[foo]</p>' );
	}

	public function do_not_expand_shortcode( $shortcodes ) {
		$shortcodes[] = 'foo';
		return $shortcodes;
	}

	public function test_sync_changed_post_password() {
		// Don't set the password if there is non.
		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEmpty( $post_on_server->post_password );

		$this->post->post_password = 'bob';
		wp_update_post( $this->post );
		$this->sender->do_sync();

		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		// Change the password from the original
		$this->assertNotEquals( $post_on_server->post_password, 'bob' );
		// Make sure it is not empty
		$this->assertNotEmpty( $post_on_server->post_password );

	}

	public function test_sync_post_includes_permalink_and_shortlink() {
		$insert_post_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$post              = $insert_post_event->args[1];

		$this->assertObjectHasAttribute( 'permalink', $post );
		$this->assertObjectHasAttribute( 'shortlink', $post );

		$this->assertEquals( $post->permalink, get_permalink( $this->post->ID ) );
		$this->assertEquals( $post->shortlink, wp_get_shortlink( $this->post->ID ) );
	}

	public function test_sync_post_includes_amp_permalink() {
		$insert_post_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$post              = $insert_post_event->args[1];

		$this->assertObjectNotHasAttribute( 'amp_permalink', $post );

		function amp_get_permalink( $post_id ) { // phpcs:ignore MediaWiki.Usage.NestedFunctions.NestedFunction
			return "http://example.com/?p=$post_id&amp";
		}

		wp_update_post( $this->post );
		$this->sender->do_sync();
		$insert_post_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$post              = $insert_post_event->args[1];

		$this->assertObjectHasAttribute( 'amp_permalink', $post );
		$this->assertEquals( $post->amp_permalink, "http://example.com/?p={$post->ID}&amp" );
	}

	public function test_sync_post_includes_feature_image_meta_when_featured_image_set() {
		$post_id       = $this->factory->post->create();
		$attachment_id = $this->factory->post->create(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/png',
			)
		);
		add_post_meta( $attachment_id, '_wp_attached_file', '2016/09/test_image.png' );
		set_post_thumbnail( $post_id, $attachment_id );

		$this->sender->do_sync();

		$post_on_server = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' )->args[1];
		$this->assertObjectHasAttribute( 'featured_image', $post_on_server );
		$this->assertIsString( $post_on_server->featured_image );
		$this->assertStringContainsString( 'test_image.png', $post_on_server->featured_image );
	}

	public function test_sync_post_not_includes_feature_image_meta_when_featured_image_not_set() {
		$post_id = $this->factory->post->create(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		$this->sender->do_sync();

		$post_on_server = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' )->args[1];
		$this->assertObjectNotHasAttribute( 'featured_image', $post_on_server );
	}

	public function test_do_not_sync_non_existant_post_types() {
		$args = array(
			'public' => true,
			'label'  => 'unregister post type',
		);
		register_post_type( 'unregister_post_type', $args );
		$post_id = $this->factory->post->create( array( 'post_type' => 'unregister_post_type' ) );
		unregister_post_type( 'unregister_post_type' );

		$this->sender->do_sync();
		$synced_post = $this->server_replica_storage->get_post( $post_id );

		$this->assertEquals( 'jetpack_sync_non_registered_post_type', $synced_post->post_status );
		$this->assertSame( '', $synced_post->post_content_filtered );
		$this->assertSame( '', $synced_post->post_excerpt_filtered );

		$this->assertEquals( 'unregister_post_type', $synced_post->post_type );

		// Also works for post type that was never registed
		$post_id = $this->factory->post->create( array( 'post_type' => 'does_not_exist' ) );
		$this->sender->do_sync();
		$synced_post = $this->server_replica_storage->get_post( $post_id );

		$this->assertEquals( 'jetpack_sync_non_registered_post_type', $synced_post->post_status );
		$this->assertSame( '', $synced_post->post_content_filtered );
		$this->assertSame( '', $synced_post->post_excerpt_filtered );
		$this->assertEquals( 'does_not_exist', $synced_post->post_type );
	}

	public function test_sync_post_jetpack_sync_prevent_sending_post_data_filter() {

		add_filter( 'jetpack_sync_prevent_sending_post_data', '__return_true' );

		$this->server_replica_storage->reset();

		$this->post->post_content = 'foo bar';
		wp_update_post( $this->post );

		$this->sender->do_sync();

		remove_filter( 'jetpack_sync_prevent_sending_post_data', '__return_true' );

		$this->assertEquals( 2, $this->server_replica_storage->post_count() ); // the post and its revision
		$insert_post_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$post              = $insert_post_event->args[1];
		// Instead of sending all the data we just send the post_id so that we can remove it on our end.

		$this->assertEquals( $this->post->ID, $post->ID );
		$this->assertTrue( strtotime( $this->post->post_modified ) <= strtotime( $post->post_modified ) );
		$this->assertTrue( strtotime( $this->post->post_modified_gmt ) <= strtotime( $post->post_modified_gmt ) );
		$this->assertEquals( 'jetpack_sync_blocked', $post->post_status );
		$this->assertEquals( 'post', $post->post_type );

		// Since the filter is not there any more the sync should happen as expected.
		$this->post->post_content = 'foo bar';

		wp_update_post( $this->post );
		$this->sender->do_sync();
		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );
		// no we sync the content and it looks like what we expect to be.
		$this->assertEquals( $this->post->post_content, $synced_post->post_content );
	}

	/**
	 * Tests that jetpack_sync_save_post events are not sent for blacklisted post_types
	 */
	public function test_filters_out_blacklisted_post_types() {
		$args = array(
			'public' => true,
			'label'  => 'Snitch',
		);
		register_post_type( 'snitch', $args );
		$this->server_event_storage->reset();

		$post_id = $this->factory->post->create( array( 'post_type' => 'snitch' ) );

		$this->sender->do_sync();

		// Clean up.
		unregister_post_type( 'snitch' );

		$this->assertNull( $this->server_replica_storage->get_post( $post_id ) );
		$sync_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$this->assertFalse( $sync_event );
	}

	/**
	 * Tests that jetpack_published_post events are not sent for blacklisted post_types.
	 */
	public function test_filters_out_blacklisted_post_types_jetpack_published_post() {
		$args = array(
			'public' => true,
			'label'  => 'Snitch',
		);
		register_post_type( 'snitch', $args );
		$this->server_event_storage->reset();

		$post_id = $this->factory->post->create( array( 'post_type' => 'snitch' ) );

		$this->sender->do_sync();

		// Clean up.
		unregister_post_type( 'snitch' );

		$this->assertNull( $this->server_replica_storage->get_post( $post_id ) );
		$sync_event = $this->server_event_storage->get_most_recent_event( 'jetpack_published_post' );
		$this->assertFalse( $sync_event );
	}

	/**
	 * Tests that deleted_post events are not sent for blacklisted post_types.
	 */
	public function test_filters_out_blacklisted_post_types_deleted_posts() {
		$args = array(
			'public' => true,
			'label'  => 'Snitch',
		);
		register_post_type( 'snitch', $args );
		$this->server_event_storage->reset();

		$post_id = $this->factory->post->create( array( 'post_type' => 'snitch' ) );
		wp_delete_post( $post_id, true );

		$this->sender->do_sync();
		$deleted_event = $this->server_event_storage->get_most_recent_event( 'deleted_post' );

		// Clean up.
		unregister_post_type( 'snitch' );

		$this->assertFalse( $deleted_event );
	}

	public function test_filters_out_blacklisted_post_types_and_their_post_meta() {
		$args = array(
			'public' => true,
			'label'  => 'Snitch',
		);
		register_post_type( 'snitch', $args );

		$post_id = $this->factory->post->create( array( 'post_type' => 'snitch' ) );
		add_post_meta( $post_id, 'hello', 123 );

		$this->sender->do_sync();

		// Clean up.
		unregister_post_type( 'snitch' );

		$this->assertNull( $this->server_replica_storage->get_post( $post_id ) );

		$this->assertSame( '', $this->server_replica_storage->get_metadata( 'post', $post_id, 'hello', true ) );
	}

	public function test_post_types_blacklist_can_be_appended_in_settings() {
		register_post_type(
			'filter_me',
			array(
				'public' => true,
				'label'  => 'Filter Me',
			)
		);
		$post_id = $this->factory->post->create( array( 'post_type' => 'filter_me' ) );
		$this->sender->do_sync();
		unregister_post_type( 'filter_me' );

		// first, show that post is being synced
		$this->assertTrue( (bool) $this->server_replica_storage->get_post( $post_id ) );

		Settings::update_settings( array( 'post_types_blacklist' => array( 'filter_me' ) ) );

		register_post_type(
			'filter_me',
			array(
				'public' => true,
				'label'  => 'Filter Me',
			)
		);
		$post_id = $this->factory->post->create( array( 'post_type' => 'filter_me' ) );
		$this->sender->do_sync();
		unregister_post_type( 'filter_me' );

		$this->assertNull( $this->server_replica_storage->get_post( $post_id ) );

		// also assert that the post types blacklist still contains the hard-coded values
		$setting = Settings::get_setting( 'post_types_blacklist' );

		$this->assertContains( 'filter_me', $setting );

		foreach ( Defaults::$blacklisted_post_types as $hardcoded_blacklist_post_type ) {
			$this->assertContains( $hardcoded_blacklist_post_type, $setting );
		}
	}

	public function test_does_not_publicize_blacklisted_post_types() {
		register_post_type(
			'dont_publicize_me',
			array(
				'public' => true,
				'label'  => 'Filter Me',
			)
		);
		$post_id = $this->factory->post->create( array( 'post_type' => 'dont_publicize_me' ) );

		// Clean up.
		unregister_post_type( 'dont_publicize_me' );

		$this->assertTrue( apply_filters( 'publicize_should_publicize_published_post', true, get_post( $post_id ) ) );

		Settings::update_settings( array( 'post_types_blacklist' => array( 'dont_publicize_me' ) ) );

		$this->assertFalse( apply_filters( 'publicize_should_publicize_published_post', true, get_post( $post_id ) ) );

		$good_post_id = $this->factory->post->create( array( 'post_type' => 'post' ) );

		$this->assertTrue( apply_filters( 'publicize_should_publicize_published_post', true, get_post( $good_post_id ) ) );
	}

	public function test_returns_post_object_by_id() {
		$post_sync_module = Modules::get_module( 'posts' );

		$post_id = $this->factory->post->create();

		$this->sender->do_sync();

		// get the synced object
		$event       = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_post' );
		$synced_post = $event->args[1];

		// grab the codec - we need to simulate the stripping of types that comes with encoding/decoding
		$codec = $this->sender->get_codec();

		$retrieved_post = $codec->decode(
			$codec->encode(
				$post_sync_module->get_object_by_id( 'post', $post_id )
			)
		);

		$this->assertEquals( $synced_post, $retrieved_post );
	}

	public function test_remove_contact_form_shortcode_from_filtered_content() {
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		require_once JETPACK__PLUGIN_DIR . 'modules/contact-form/grunion-contact-form.php';

		$this->post->post_content = '<p>This post has a contact form:[contact-form][contact-field label=\'Name\' type=\'name\' required=\'1\'/][/contact-form]</p>';

		Grunion_Contact_Form_Plugin::init();

		wp_update_post( $this->post );

		$this->assertStringContainsString( '<form action=', apply_filters( 'the_content', $this->post->post_content ) );

		$this->sender->do_sync();

		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );

		$this->assertEquals( "<p>This post has a contact form:</p>\n", $synced_post->post_content_filtered );
	}

	public function test_remove_likes_from_filtered_content() {
		// this only applies to rendered content, which is off by default
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		// initial sync sets the screen to 'sync', then `is_admin` returns `true`
		set_current_screen( 'front' );

		// force likes to be appended to the_content
		add_filter( 'wpl_is_likes_visible', '__return_true' );

		require_once JETPACK__PLUGIN_DIR . 'modules/likes.php';
		$jpl = Jetpack_Likes::init();
		$jpl->action_init();

		$this->post->post_content = 'The new post content';

		wp_update_post( $this->post );

		$this->assertStringContainsString( 'div class=\'sharedaddy', apply_filters( 'the_content', $this->post->post_content ) );

		$this->sender->do_sync();

		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );

		$this->assertEquals( '<p>' . $synced_post->post_content . "</p>\n", $synced_post->post_content_filtered );
	}

	public function test_remove_sharedaddy_from_filtered_content() {
		// this only applies to rendered content, which is off by default
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		if ( class_exists( 'Sharing_Service' ) ) {
			Sharing_Service::init();
		} else {
			require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing.php';
			require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php';
		}

		set_current_screen( 'front' );
		add_filter( 'sharing_show', '__return_true' );
		add_filter( 'sharing_enabled', array( $this, 'enable_services' ) );
		$this->post->post_content = 'The new post content';

		wp_update_post( $this->post );

		$this->assertStringContainsString( 'class="sharedaddy sd-sharing-enabled"', apply_filters( 'the_content', $this->post->post_content ) );

		$this->sender->do_sync();

		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );

		$this->assertEquals( '<p>' . $synced_post->post_content . "</p>\n", $synced_post->post_content_filtered );
	}

	public function enable_services() {
		return array(
			'all'     => array( 'print' => new Share_Print( 'print', array() ) ),
			'visible' => array( 'print' => new Share_Print( 'print', array() ) ),
			'hidden'  => array(),
		);
	}

	public function test_remove_related_posts_from_filtered_content() {
		// this only applies to rendered content, which is off by default
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		require_once JETPACK__PLUGIN_DIR . 'modules/related-posts.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/related-posts/jetpack-related-posts.php';

		// Make sure that the related posts show up.
		add_filter( 'jetpack_relatedposts_filter_enabled_for_request', '__return_true', 99999 );
		add_filter( 'jetpack_is_fse_theme', '__return_false' );
		Jetpack_RelatedPosts::init()->action_frontend_init();

		$this->post->post_content = 'hello';

		wp_update_post( $this->post );

		$this->assertStringContainsString( '<div id=\'jp-relatedposts\'', apply_filters( 'the_content', $this->post->post_content ) );

		$this->sender->do_sync();

		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( "<p>hello</p>\n\n", $synced_post->post_content_filtered );

		remove_filter( 'jetpack_is_fse_theme', '__return_false' );
	}

	public function test_remove_related_posts_shortcode_from_filtered_content() {
		// this only applies to rendered content, which is off by default
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		require_once JETPACK__PLUGIN_DIR . 'modules/related-posts.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/related-posts/jetpack-related-posts.php';

		Jetpack_RelatedPosts::init()->action_frontend_init();

		$this->post->post_content = '[jetpack-related-posts]';

		wp_update_post( $this->post );

		$this->assertStringContainsString( '<!-- Jetpack Related Posts is not supported in this context. -->', apply_filters( 'the_content', $this->post->post_content ) );

		$this->sender->do_sync();

		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );

		$this->assertEquals( "\n", $synced_post->post_content_filtered );
	}

	public function test_customizer_changeset_to_widget_edited() {
		$post_content = <<<POST_CONTENT
{
    "widget_archives[2]": {
        "value": {
            "encoded_serialized_instance": "YTozOntzOjU6InRpdGxlIjtzOjg6IkkgbG92ZSBDIjtzOjU6ImNvdW50IjtpOjA7czo4OiJkcm9wZG93biI7aTowO30=",
            "title": "I am an Archive widget",
            "is_widget_customizer_js_value": true,
            "instance_hash_key": "cada21c4bae5635f7943a0c6cf41e5c3"
        },
        "type": "option",
        "user_id": 1,
        "date_modified_gmt": "2018-06-18 19:42:36"
    },
    "widget_search[2]": {
        "value": {
            "encoded_serialized_instance": "YToyOntzOjU6InRpdGxlIjtzOjg6IkkgbG92ZSBEIjtzOjEwOiJjb25kaXRpb25zIjthOjM6e3M6NjoiYWN0aW9uIjtzOjQ6ImhpZGUiO3M6OToibWF0Y2hfYWxsIjtzOjE6IjAiO3M6NToicnVsZXMiO2E6MTp7aTowO2E6Mzp7czo1OiJtYWpvciI7czo4OiJsb2dnZWRpbiI7czo1OiJtaW5vciI7czowOiIiO3M6MTI6Imhhc19jaGlsZHJlbiI7YjowO319fX0=",
            "title": "I am a Search widget",
            "is_widget_customizer_js_value": true,
            "instance_hash_key": "20bf20f6d7d4ecae9092f7d3850387f1"
        },
		"type": "option",
        "user_id": 1,
        "date_modified_gmt": "2018-06-18 19:42:36"
	}
}
POST_CONTENT;

		// Mock registered widgets to get widget Name from.
		global $wp_registered_widgets;
		$original_registered_widgets = $wp_registered_widgets;
		$wp_registered_widgets       = array(
			'archives-2' => array(
				'name' => 'Archives',
			),
			'search-2'   => array(
				'name' => 'Search',
			),
		);

		// create a post.
		$user_id = $this->factory->user->create();
		$this->factory->post->create(
			array(
				'post_author'  => $user_id,
				'post_type'    => 'customize_changeset',
				'post_content' => $post_content,
			)
		);

		$this->sender->do_sync();
		$events = $this->server_event_storage->get_all_events( 'jetpack_widget_edited' );

		$this->assertEquals( 'jetpack_widget_edited', $events[0]->action );
		$this->assertEquals( 'Archives', $events[0]->args[0]['name'] );
		$this->assertEquals( 'archives-2', $events[0]->args[0]['id'] );
		$this->assertEquals( 'I am an Archive widget', $events[0]->args[0]['title'] );
		$this->assertEquals( 'jetpack_widget_edited', $events[1]->action );
		$this->assertEquals( 'Search', $events[1]->args[0]['name'] );
		$this->assertEquals( 'search-2', $events[1]->args[0]['id'] );
		$this->assertEquals( 'I am a Search widget', $events[1]->args[0]['title'] );

		$wp_registered_widgets = $original_registered_widgets;
	}

	public function test_that_we_apply_the_right_filters_to_post_content_and_excerpt() {
		// this only applies to rendered content, which is off by default
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		add_filter( 'the_content', array( $this, 'the_content_filter' ), 1000 );
		add_filter( 'the_excerpt', array( $this, 'the_excerpt_filter' ), 1000 );

		$this->post->post_content = 'hello';
		$this->post->post_excerpt = 'world';

		wp_update_post( $this->post );

		$this->sender->do_sync();

		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );

		$this->assertEquals( 'the_content', $synced_post->post_content_filtered );
		$this->assertEquals( 'the_excerpt', $synced_post->post_excerpt_filtered );

		add_filter( 'the_content', array( $this, 'the_content_filter' ) );
		add_filter( 'the_excerpt', array( $this, 'the_excerpt_filter' ) );
	}

	public function the_content_filter() {
		return 'the_content';
	}

	public function the_excerpt_filter() {
		return 'the_excerpt';
	}

	public function test_do_not_sync_non_public_post_types_filtered_post_content() {
		$args = array(
			'public' => false,
			'label'  => 'Non Public',
		);
		register_post_type( 'non_public', $args );

		$post_id = $this->factory->post->create( array( 'post_type' => 'non_public' ) );
		// This below is needed since Core inserts "loading=lazy" right after the iframe opener.
		add_filter( 'wp_lazy_loading_enabled', '__return_false' );
		$this->sender->do_sync();
		$synced_post = $this->server_replica_storage->get_post( $post_id );

		// Clean up.
		remove_all_filters( 'wp_lazy_loading_enabled' );
		unregister_post_type( 'non_public' );

		$this->assertSame( '', $synced_post->post_content_filtered );
		$this->assertSame( '', $synced_post->post_excerpt_filtered );
	}

	public function test_embed_shortcode_is_disabled_on_the_content_filter_during_sync() {
		$this->markTestSkipped( 'Skipping to be able to merge #21030. Needs a proper fix anyway.' );
		// this only applies to rendered content, which is off by default
		Settings::update_settings( array( 'render_filtered_content' => 1 ) );

		$content =
			'Check out this cool video:

[embed width="123" height="456"]http://www.youtube.com/watch?v=dQw4w9WgXcQ[/embed]

That was a cool video.';

		$oembeded =
			'<p>Check out this cool video:</p>
<p><iframe title="Rick Astley - Never Gonna Give You Up (Official Music Video)" #DIMENSIONS# src="https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></p>
<p>That was a cool video.</p>' . "\n";

		$filtered = '<p>Check out this cool video:</p>
<p>[embed width=&#8221;123&#8243; height=&#8221;456&#8243;]http://www.youtube.com/watch?v=dQw4w9WgXcQ[/embed]</p>
<p>That was a cool video.</p>' . "\n";

		$this->post->post_content = $content;

		wp_update_post( $this->post );

		$oembeded = explode( '#DIMENSIONS#', $oembeded );

		// This below is needed since Core inserts "loading=lazy" right after the iframe opener.
		add_filter( 'wp_lazy_loading_enabled', '__return_false' );

		$this->assertStringContainsString(
			$oembeded[0],
			apply_filters( 'the_content', $this->post->post_content ),
			'$oembeded is NOT the same as filtered $this->post->post_content'
		);
		$this->assertStringContainsString(
			$oembeded[1],
			apply_filters( 'the_content', $this->post->post_content ),
			'$oembeded is NOT the same as filtered $this->post->post_content'
		);

		$this->sender->do_sync();

		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals(
			$filtered,
			$synced_post->post_content_filtered,
			'$filtered is NOT the same as $synced_post->post_content_filtered'
		);

		// do we get the same result after the sync?
		$this->assertStringContainsString(
			$oembeded[0],
			apply_filters( 'the_content', $filtered ),
			'$oembeded is NOT the same as filtered $filtered'
		);
		$this->assertStringContainsString(
			$oembeded[1],
			apply_filters( 'the_content', $filtered ),
			'$oembeded is NOT the same as filtered $filtered'
		);

		remove_all_filters( 'wp_lazy_loading_enabled' );
	}

	public function assertAttachmentSynced( $attachment_id ) {
		$remote_attachment = $this->server_replica_storage->get_post( $attachment_id );
		$attachment        = get_post( $attachment_id );
		$this->assertEquals( $attachment, $remote_attachment );
	}

	public function foo_shortcode() {
		return 'bar';
	}

	public function test_sync_jetpack_published_post_raw() {
		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$user_id = $this->factory->user->create();

		$post              = get_post( $post_id );
		$post->post_author = $user_id;
		wp_update_post( $post ); // Make sure that the author is set.

		$author = get_user_by( 'id', $user_id );
		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $post_id );
		$this->assertEquals( 'draft', $remote_post->post_status );

		wp_publish_post( $post_id );

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $post_id );
		$this->assertEquals( 'publish', $remote_post->post_status );

		$event = $this->server_event_storage->get_most_recent_event();

		$this->assertEquals( 'jetpack_published_post', $event->action );
		$this->assertEquals( $post_id, $event->args[0] );
		$this->assertEquals( 'post', $event->args[1]['post_type'] );
		// We add the author information to this so that we know who the author is
		// This information is useful when the post gets published via cron.
		$this->assertEquals( $author->display_name, $event->args[1]['author']['display_name'] ); // since 5.4 ?
		$this->assertEquals( $author->ID, $event->args[1]['author']['id'] ); // since 5.4 ?
		$this->assertEquals( $author->user_email, $event->args[1]['author']['email'] ); // since 5.4 ?
		$roles = new Roles();
		$this->assertEquals( $roles->translate_user_to_role( $author ), $event->args[1]['author']['translated_role'] ); // since 5.4 ?
		$this->assertTrue( isset( $event->args[1]['author']['wpcom_user_id'] ) );
	}

	public function test_sync_jetpack_update_post_to_draft_shouldnt_publish() {
		$this->server_event_storage->reset();

		wp_update_post(
			array(
				'ID'          => $this->post->ID,
				'post_status' => 'draft',
			)
		);

		$this->sender->do_sync();

		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'jetpack_published_post' ) );
	}

	public function test_sync_jetpack_published_post_should_set_send_subscription_to_false() {
		Jetpack_Options::update_option( 'active_modules', array( 'subscriptions' ) );
		require_once JETPACK__PLUGIN_DIR . '/modules/subscriptions.php';
		new Jetpack_Subscriptions(); // call instead of Jetpack_Subscriptions::init() so that actions get reinitialized

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );

		update_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', 1 );

		wp_publish_post( $post_id );

		$this->sender->do_sync();

		$post_flags = $this->server_event_storage->get_most_recent_event( 'jetpack_published_post' )->args[1];

		$this->assertFalse( $post_flags['send_subscription'] );
	}

	public function test_sync_jetpack_published_post_should_set_set_send_subscription_to_true() {
		$this->server_event_storage->reset();
		Jetpack_Options::update_option( 'active_modules', array( 'subscriptions' ) );
		require_once JETPACK__PLUGIN_DIR . '/modules/subscriptions.php';
		new Jetpack_Subscriptions(); // call instead of Jetpack_Subscriptions::init() so that actions get reinitialized

		wp_update_post(
			array(
				'ID'          => $this->post->ID,
				'post_status' => 'draft',
			)
		);

		wp_publish_post( $this->post->ID );

		wp_update_post(
			array(
				'ID'           => $this->post->ID,
				'post_content' => 'content',
			)
		);

		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_published_post' );
		$this->assertCount( 1, $events );

		$post_flags = $events[0]->args[1];
		$this->assertTrue( $post_flags['send_subscription'] );
	}

	public function test_sync_jetpack_published_post_should_set_set_send_subscription_to_false_for_post_type_other_than_post() {
		$this->server_event_storage->reset();
		Jetpack_Options::update_option( 'active_modules', array( 'subscriptions' ) );
		require_once JETPACK__PLUGIN_DIR . '/modules/subscriptions.php';
		new Jetpack_Subscriptions(); // call instead of Jetpack_Subscriptions::init() so that actions get reinitialized

		$nav_menu_id = wp_insert_post(
			array(
				'post_type'   => 'nav_menu_item',
				'post_status' => 'draft',
			)
		);

		wp_publish_post( $nav_menu_id );

		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_published_post' );
		$this->assertCount( 1, $events );

		$post_flags = $events[0]->args[1];
		$this->assertFalse( $post_flags['send_subscription'] );
	}

	public function test_sync_jetpack_publish_post_works_with_interjecting_plugins() {
		$this->server_event_storage->reset();
		$this->test_already = false;
		add_action( 'wp_insert_post', array( $this, 'add_a_hello_post_type' ), 9 );
		$this->factory->post->create( array( 'post_type' => 'post' ) );
		remove_action( 'wp_insert_post', array( $this, 'add_a_hello_post_type' ), 9 );

		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events();

		$events = array_slice( $events, -6 );

		$this->assertEquals( $events[0]->args[0], $events[2]->args[0] );
		$this->assertEquals( 'jetpack_sync_save_post', $events[0]->action );
		$this->assertEquals( 'jetpack_published_post', $events[2]->action );

		$this->assertEquals( $events[3]->args[0], $events[5]->args[0] );
		$this->assertEquals( 'jetpack_sync_save_post', $events[3]->action );
		$this->assertEquals( 'jetpack_published_post', $events[5]->action );
	}

	/**
	 * Data Provider for test_sync_jetpack_published_post_no_action test.
	 *
	 * @return array[] Test parameters.
	 */
	public function provider_jetpack_published_post_no_action() {
		return array(
			array( null, $this->post ),
			array( 'alpha', $this->post ),
			array( $this->post_id, null ),
			array( -1111, $this->post ),
		);
	}

	/**
	 * Verify no `jetpack_published_post` action is triggerd with invalid $post_ID or $post provided.
	 *
	 * @dataProvider provider_jetpack_published_post_no_action
	 * @param int      $post_ID Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public function test_sync_jetpack_published_post_no_action( $post_ID, $post ) {
		$this->server_event_storage->reset();
		do_action( 'wp_after_insert_post', $post_ID, $post, false );

		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_published_post' );
		$this->assertCount( 0, $events );
	}

	/**
	 * Test if `Modules\Posts\daily_akismet_meta_cleanup_before` will properly chunk it's parameters in chunks of 100
	 *
	 * @throws ReflectionException Throw if Reflection fails to initialize.
	 */
	public function test_sync_jetpack_posts_akismet_post_meta_delete_is_chunked() {
		$ids = array_fill( 0, 1450, 1234 );

		$mocked = $this->getMockBuilder( stdClass::class )
						->setMethods( array( 'chunked_call' ) )
						->getMock();

		$mocked->expects( $this->exactly( 15 ) )
				->method( 'chunked_call' );

		add_action( 'jetpack_post_meta_batch_delete', array( $mocked, 'chunked_call' ), 10, 2 );

		/**
		 * Override `action_handler` private property as it's used directly in the method and it's not initialized
		 * to a function during method call, without calling `Modules\Posts\init_listeners()` to set it.
		 */
		$test_instance = new Modules\Posts();
		$test_ref      = new ReflectionObject( $test_instance );
		$property_ref  = $test_ref->getProperty( 'action_handler' );
		$property_ref->setAccessible( true );
		$property_ref->setValue( $test_instance, function () {} );

		$test_instance->daily_akismet_meta_cleanup_before( $ids );
	}

	/**
	 * Test if `Modules\Posts\daily_akismet_meta_cleanup_before` will properly return with invalid input
	 *
	 * @throws ReflectionException Throw if Reflection fails to initialize.
	 */
	public function test_sync_jetpack_posts_akismet_post_meta_delete_invalid_data() {
		$ids = 'test_invalid_value';

		$mocked = $this->getMockBuilder( stdClass::class )
						->setMethods( array( 'chunked_call' ) )
						->getMock();

		$mocked->expects( $this->never() )
				->method( 'chunked_call' );

		add_action( 'jetpack_post_meta_batch_delete', array( $mocked, 'chunked_call' ), 10, 2 );

		/**
		 * Override `action_handler` private property as it's used directly in the method and it's not initialized
		 * to a function during method call, without calling `Modules\Posts\init_listeners()` to set it.
		 */
		$test_instance = new Modules\Posts();
		$test_ref      = new ReflectionObject( $test_instance );
		$property_ref  = $test_ref->getProperty( 'action_handler' );
		$property_ref->setAccessible( true );
		$property_ref->setValue( $test_instance, function () {} );

		$test_instance->daily_akismet_meta_cleanup_before( $ids );
	}

	/**
	 * Test if `Modules\Posts\daily_akismet_meta_cleanup_before` will properly return with empty input
	 *
	 * @throws ReflectionException Throw if Reflection fails to initialize.
	 */
	public function test_sync_jetpack_posts_akismet_post_meta_delete_empty() {
		$ids = array();

		$mocked = $this->getMockBuilder( stdClass::class )
						->setMethods( array( 'chunked_call' ) )
						->getMock();

		$mocked->expects( $this->never() )
			->method( 'chunked_call' );

		add_action( 'jetpack_post_meta_batch_delete', array( $mocked, 'chunked_call' ), 10, 2 );

		/**
		 * Override `action_handler` private property as it's used directly in the method and it's not initialized
		 * to a function during method call, without calling `Modules\Posts\init_listeners()` to set it.
		 */
		$test_instance = new Modules\Posts();
		$test_ref      = new ReflectionObject( $test_instance );
		$property_ref  = $test_ref->getProperty( 'action_handler' );
		$property_ref->setAccessible( true );
		$property_ref->setValue( $test_instance, function () {} );

		$test_instance->daily_akismet_meta_cleanup_before( $ids );
	}

	public function add_a_hello_post_type() {
		if ( ! $this->test_already ) {
			$this->test_already = true;
			$this->factory->post->create( array( 'post_type' => 'hello' ) );
			return;
		}
	}
}
