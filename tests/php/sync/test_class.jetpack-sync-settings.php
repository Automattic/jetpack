<?php

class WP_Test_Jetpack_Sync_Settings extends WP_Test_Jetpack_Sync_Base {
	function test_can_write_settings() {
		$settings = Jetpack_Sync_Settings::get_settings();

		foreach (
			array(
				'dequeue_max_bytes',
				'sync_wait_time',
				'upload_max_bytes',
				'upload_max_rows',
				'max_queue_size',
				'max_queue_lag',
				'disable',
				'render_filtered_content',
			) as $key
		) {
			$this->assertTrue( isset( $settings[ $key ] ) );
		}

		$settings['dequeue_max_bytes'] = 50;
		Jetpack_Sync_Settings::update_settings( $settings );

		$updated_settings = Jetpack_Sync_Settings::get_settings();

		$this->assertSame( 50, $updated_settings['dequeue_max_bytes'] );
	}

	function test_settings_disable_enqueue_and_clears_queue() {
		$event = $this->server_event_storage->reset();

		// create a post - this will end up in the queue before data is sent
		$post_id = $this->factory->post->create();
		$this->assertTrue( $this->listener->get_sync_queue()->size() > 0 );

		Jetpack_Sync_Settings::update_settings( array( 'disable' => 1 ) );

		// generating posts should no longer affect queue size
		$this->assertEquals( 0, $this->listener->get_sync_queue()->size() );
		$post_id = $this->factory->post->create();
		$this->assertEquals( 0, $this->listener->get_sync_queue()->size() );

		// syncing sends no data
		$this->sender->do_sync();
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'wp_insert_post' ) );

		Jetpack_Sync_Settings::update_settings( array( 'disable' => 0 ) );
	}
}
