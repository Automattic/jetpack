<?php

$sync_dir = dirname( __FILE__ ) . '/../../../sync/';
require_once $sync_dir . 'class.jetpack-sync-full.php';

class WP_Test_Jetpack_New_Sync_Full extends WP_Test_Jetpack_New_Sync_Base {

	private $full_sync;

	function setUp() {
		parent::setUp();
		$this->full_sync = new Jetpack_Sync_Full(); 
	}

	function test_enqueues_actions_full_all_posts() {

		for( $i = 0; $i < 10; $i += 1 ) {
			$this->factory->post->create();
		}

		// reset the whole shebang
		$this->server_replica_storage->reset();
		$this->client->reset_state();

		$this->full_sync->start();
		$this->client->do_sync();

		$posts = $this->server_replica_storage->get_posts();

		$this->assertEquals( 10, count( $posts ) );
	}

	function test_enqueues_actions_full_all_comments() {

		$post = $this->factory->post->create();

		for( $i = 0; $i < 10; $i += 1 ) {
			$this->factory->comment->create_post_comments( $post );
		}

		$this->server_replica_storage->reset();
		$this->client->reset_state();

		$this->full_sync->start();
		$this->client->do_sync();

		$comments = $this->server_replica_storage->get_comments();

		$this->assertEquals( 10, count( $comments ) );
	}
}