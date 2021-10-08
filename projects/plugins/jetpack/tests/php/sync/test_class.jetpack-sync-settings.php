<?php

use Automattic\Jetpack\Sync\Settings;

class WP_Test_Jetpack_Sync_Settings extends WP_Test_Jetpack_Sync_Base {
	function test_can_write_settings() {
		$settings = Settings::get_settings();
		// store original value.
		$dequeue_max_bytes = $settings['dequeue_max_bytes'];
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
		Settings::update_settings( $settings );

		$updated_settings = Settings::get_settings();

		// reset original value.
		$settings['dequeue_max_bytes'] = $dequeue_max_bytes;
		Settings::update_settings( $settings );

		$this->assertSame( 50, $updated_settings['dequeue_max_bytes'] );
	}

	function test_settings_disable_enqueue_and_clears_queue() {
		$event = $this->server_event_storage->reset();

		// create a post - this will end up in the queue before data is sent
		$post_id = $this->factory->post->create();
		$this->assertTrue( $this->listener->get_sync_queue()->size() > 0 );

		Settings::update_settings( array( 'disable' => 1 ) );

		$this->assertFalse( Settings::is_sync_enabled() );

		// generating posts should no longer affect queue size
		$this->assertEquals( 0, $this->listener->get_sync_queue()->size() );
		$post_id = $this->factory->post->create();
		$this->assertEquals( 0, $this->listener->get_sync_queue()->size() );

		// syncing sends no data
		$this->sender->do_sync();
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'wp_insert_post' ) );

		Settings::update_settings( array( 'disable' => 0 ) );
		$this->assertTrue( Settings::is_sync_enabled() );
	}

	function test_settings_disable_network_enqueue_and_clears_queue() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with single site mode' );
		}

		$event = $this->server_event_storage->reset();

		// create a post - this will end up in the queue before data is sent
		$post_id = $this->factory->post->create();
		$this->assertTrue( $this->listener->get_sync_queue()->has_any_items() );

		Settings::update_settings( array( 'network_disable' => 1 ) );

		// generating posts should no longer affect queue size
		$this->assertEquals( 0, $this->listener->get_sync_queue()->size() );
		$post_id = $this->factory->post->create();
		$this->assertEquals( 0, $this->listener->get_sync_queue()->size() );

		// syncing sends no data
		$this->sender->do_sync();
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'wp_insert_post' ) );

		Settings::update_settings( array( 'network_disable' => 0 ) );
	}

	function test_setting_network_option_on_single_site_does_not_work() {
		if ( is_multisite() ) {
			Settings::update_settings( array( 'network_disable' => 1 ) );
			$this->assertEquals( 1, Settings::get_setting( 'network_disable' ) );
			$this->assertFalse( Settings::is_sync_enabled() );
			Settings::update_settings( array( 'network_disable' => 0 ) ); // reset things
			$this->assertTrue( Settings::is_sync_enabled() );
		} else {
			Settings::update_settings( array( 'network_disable' => 1 ) );
			// Notice that the value is unchanged
			$this->assertEquals( 0, Settings::get_setting( 'network_disable' ) );
			$this->assertTrue( Settings::is_sync_enabled() );
		}
	}

}
