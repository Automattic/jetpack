<?php
require_once 'test_class.jetpack-sync-base.php';

class WP_Test_Jetpack_Full_Sync extends WP_Test_Jetpack_Sync_Base {
	function test_full_sync_sends_post_processed_posts() {
		$post_id = $this->factory->post->create();
		$post = get_post( $post_id );

		Jetpack_Full_Sync::do_sync();

		$post = Jetpack_Sync_Modules::get_module( 'posts' )->filter_post_content_and_add_links( $post );
		$this->assertEquals( $post, $this->server_replica_storage->get_post( $post_id ) );
	}
}
