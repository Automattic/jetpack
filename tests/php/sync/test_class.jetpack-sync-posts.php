<?php

/**
 * Testing CRUD on Posts
 */
class WP_Test_Jetpack_Sync_Post extends WP_Test_Jetpack_Sync_Base {

	protected $post;

	public function setUp() {
		parent::setUp();

		// create a post
		$post_id    = $this->factory->post->create();
		$this->post = get_post( $post_id );

		$this->sender->do_sync();
	}

	public function test_add_post_syncs_event() {
		// event stored by server should event fired by client
		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );

		$this->assertEquals( 'wp_insert_post', $event->action );
		$this->assertEquals( $this->post->ID, $event->args[0] );

		$post_sync_module = Jetpack_Sync_Modules::get_module( "posts" );

		$this->post = $post_sync_module->filter_post_content_and_add_links( $this->post );
		$this->assertEqualsObject( $this->post, $event->args[1] );
	}

	public function test_add_post_syncs_post_data() {
		// post stored by server should equal post in client
		$this->assertEquals( 1, $this->server_replica_storage->post_count() );

		$post_sync_module = Jetpack_Sync_Modules::get_module( "posts" );

		$this->post = $post_sync_module->filter_post_content_and_add_links( $this->post );
		$this->assertEquals( $this->post, $this->server_replica_storage->get_post( $this->post->ID ) );
	}

	public function test_trash_post_trashes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->post_count( 'publish' ) );

		wp_delete_post( $this->post->ID );

		$this->sender->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->post_count( 'publish' ) );
		$this->assertEquals( 1, $this->server_replica_storage->post_count( 'trash' ) );
	}

	public function test_delete_post_deletes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->post_count( 'publish' ) );

		wp_delete_post( $this->post->ID, true );

		$this->sender->do_sync();

		// there should be no posts at all
		$this->assertEquals( 0, $this->server_replica_storage->post_count() );
	}

	public function test_delete_post_syncs_event() {
		wp_delete_post( $this->post->ID, true );

		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event();

		$this->assertEquals( 'deleted_post', $event->action );
		$this->assertEquals( $this->post->ID, $event->args[0] );
	}

	public function test_update_post_updates_data() {
		$this->post->post_content = "foo bar";

		wp_update_post( $this->post );

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( "foo bar", $remote_post->post_content );

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

		wp_update_post( array(
			'ID'          => $this->post->ID,
			'post_status' => 'draft',
		) );

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( 'draft', $remote_post->post_status );

		wp_publish_post( $this->post->ID );

		$this->sender->do_sync();

		$remote_post = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( 'publish', $remote_post->post_status );
	}

	public function test_sync_attachment_is_synced() {
		$filename = dirname( __FILE__ ) . '/../files/jetpack.jpg';

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
			'post_status'    => 'inherit'
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename, $this->post->ID );
		$this->sender->do_sync();

		$this->assertAttachmentSynced( $attach_id );
		// Make sure that this file is included, as wp_generate_attachment_metadata() depends on it.

		require_once( ABSPATH . 'wp-admin/includes/image.php' );
		$attach_data = wp_generate_attachment_metadata( $attach_id, $filename );
		wp_update_attachment_metadata( $attach_id, $attach_data );
		set_post_thumbnail( $this->post->ID, $attach_id );

		// Generate the metadata for the attachment, and update the database record.
		$attach_data = wp_generate_attachment_metadata( $attach_id, $filename );
		wp_update_attachment_metadata( $attach_id, $attach_data );

		$this->sender->do_sync();

		$meta_attachment_metadata = $this->server_replica_storage->get_metadata( 'post', $attach_id, '_wp_attachment_metadata', true );
		$this->assertEqualsObject( get_post_meta( $attach_id, '_wp_attachment_metadata', true ), $meta_attachment_metadata );

		$meta_thumbnail_id = $this->server_replica_storage->get_metadata( 'post', $this->post->ID, '_thumbnail_id', true );
		$this->assertEquals( get_post_meta( $this->post->ID, '_thumbnail_id', true ), $meta_thumbnail_id );

	}

	public function test_sync_attachment_update_is_synced() {
		$filename = dirname( __FILE__ ) . '/../files/jetpack.jpg';

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
			'post_status'    => 'inherit'
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename, $this->post->ID );
		$this->sender->do_sync();

		$this->assertAttachmentSynced( $attach_id );

		// Update attachment
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
			'post_content'   => 'foo',
			'post_status'    => 'inherit',
			'ID' => $attach_id,

		);

		$attach_id = wp_insert_attachment( $attachment, $filename, $this->post->ID );

		$this->sender->do_sync();

		$remote_attachment = $this->server_replica_storage->get_post( $attach_id );
		$attachment = get_post( $attach_id );

		$this->assertEquals( $attachment,  $remote_attachment );

	}

	public function test_sync_attachment_delete_is_synced() {
		$filename = dirname( __FILE__ ) . '/../files/jetpack.jpg';
		$filename_copy = dirname( __FILE__ ) . '/../files/jetpack-copy.jpg';
		@copy( $filename, $filename_copy );

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
			'post_status'    => 'inherit'
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename_copy, $this->post->ID );
		$this->sender->do_sync();

		$this->assertAttachmentSynced( $attach_id );

		// Update attachment
		wp_delete_attachment( $attach_id );

		$this->sender->do_sync();

		$remote_attachment = $this->server_replica_storage->get_post( $attach_id );
		$attachment = get_post( $attach_id );

		$this->assertEquals( $attachment,  $remote_attachment );

	}

	public function test_sync_attachment_force_delete_is_synced() {
		$filename = dirname( __FILE__ ) . '/../files/jetpack.jpg';
		$filename_copy = dirname( __FILE__ ) . '/../files/jetpack-copy.jpg';
		@copy( $filename, $filename_copy );

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
			'post_status'    => 'inherit'
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename_copy, $this->post->ID );
		$this->sender->do_sync();

		$this->assertAttachmentSynced( $attach_id );

		// Update attachment
		wp_delete_attachment( $attach_id, true );

		$this->sender->do_sync();

		$remote_attachment = $this->server_replica_storage->get_post( $attach_id );
		$attachment = get_post( $attach_id );

		$this->assertEquals( $attachment,  $remote_attachment );
	}

	function test_sync_post_filtered_content_was_filtered() {
		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );
		$this->post->post_content = "[foo]";

		wp_update_post( $this->post );
		$this->sender->do_sync();

		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( $post_on_server->post_content, '[foo]' );
		$this->assertEquals( trim( $post_on_server->post_content_filtered ),  'bar' );
	}

	function test_sync_post_filtered_excerpt_was_filtered() {
		add_shortcode( 'foo', array( $this, 'foo_shortcode' ) );
		$this->post->post_excerpt = "[foo]";

		wp_update_post( $this->post );
		$this->sender->do_sync();

		$post_on_server = $this->server_replica_storage->get_post( $this->post->ID );
		$this->assertEquals( $post_on_server->post_excerpt, '[foo]' );
		$this->assertEquals( trim( $post_on_server->post_excerpt_filtered ),  'bar' );
	}

	function test_sync_changed_post_password() {
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

	function test_sync_post_includes_permalink_and_shortlink() {
		$insert_post_event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );
		$post = $insert_post_event->args[1];

		$this->assertObjectHasAttribute( 'permalink', $post );
		$this->assertObjectHasAttribute( 'shortlink', $post );

		$this->assertEquals( $post->permalink, get_permalink( $this->post->ID ) );
		$this->assertEquals( $post->shortlink, wp_get_shortlink( $this->post->ID ) );
	}

	function test_sync_post_includes_dont_email_post_to_subs() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true );

		$this->sender->do_sync();

		$post_on_server = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' )->args[1];

		$this->assertEquals( true, $post_on_server->dont_email_post_to_subs );
	}

	function test_sync_post_jetpack_sync_prevent_sending_post_data_filter() {

		add_filter( 'jetpack_sync_prevent_sending_post_data', '__return_true' );

		$this->server_replica_storage->reset();

		$this->post->post_content = "foo bar";
		wp_update_post( $this->post );

		$this->sender->do_sync();

		remove_filter( 'jetpack_sync_prevent_sending_post_data', '__return_true' );

		$this->assertEquals( 2, $this->server_replica_storage->post_count() ); // the post and its revision
		$insert_post_event = $this->server_event_storage->get_most_recent_event( 'wp_insert_post' );
		$post = $insert_post_event->args[1];
		// Instead of sending all the data we just send the post_id so that we can remove it on our end.

		$this->assertEquals( $this->post->ID, $post->ID );
		$this->assertTrue( strtotime( $this->post->post_modified ) <= strtotime( $post->post_modified ) );
		$this->assertTrue( strtotime( $this->post->post_modified_gmt ) <= strtotime( $post->post_modified_gmt ) );
		$this->assertEquals( 'jetpack_sync_blocked', $post->post_status );
		$this->assertFalse( isset( $post->post_content ) );
		$this->assertFalse( isset( $post->post_excerpt ) );

		// Since the filter is not there any more the sync should happen as expected.
		$this->post->post_content = "foo bar";

		wp_update_post( $this->post );
		$this->sender->do_sync();
		$synced_post = $this->server_replica_storage->get_post( $this->post->ID );
		// no we sync the content and it looks like what we expect to be.
		$this->assertEquals( $this->post->post_content, $synced_post->post_content );
	}

	function assertAttachmentSynced( $attachment_id ) {
		$remote_attachment = $this->server_replica_storage->get_post( $attachment_id );
		$attachment = get_post( $attachment_id );
		$this->assertEquals( $attachment, $remote_attachment );
	}

	function foo_shortcode() {
		return 'bar';
	}
}
