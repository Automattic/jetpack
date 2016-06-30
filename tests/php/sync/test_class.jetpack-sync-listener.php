<?php

class WP_Test_Jetpack_Sync_Listener extends WP_Test_Jetpack_Sync_Base {
	function test_never_queues_if_development() {
		$this->markTestIncomplete( "We now check this during 'init', so testing is pretty hard" );
		
		add_filter( 'jetpack_development_mode', '__return_true' );

		$queue = $this->listener->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		$this->factory->post->create();

		$this->assertEquals( 0, $queue->size() );
	}

	function test_never_queues_if_staging() {
		$this->markTestIncomplete( "We now check this during 'init', so testing is pretty hard" );

		add_filter( 'jetpack_is_staging_site', '__return_true' );

		$queue = $this->listener->get_sync_queue();
		$queue->reset(); // remove any actions that already got queued

		$this->factory->post->create();

		$this->assertEquals( 0, $queue->size() );
	}

	// function test_detects_if_exceeded_queue_size_limit() {
	// 	$queue = $this->sender->get_sync_queue();
	// 	$queue->set_size_limit( 2 );
	// }
}