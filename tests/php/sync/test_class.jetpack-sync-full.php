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

		$this->full_sync->start();
		$this->client->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jp_full_sync_post' );

		$this->assertEquals( 10, count( $events ) );
	}
}