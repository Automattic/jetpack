<?php

class WP_Test_Jetpack_Sync_Settings extends WP_Test_Jetpack_Sync_Base {
	function test_can_write_settings() {
		$settings = Jetpack_Sync_Settings::get_settings();

		foreach( array( 'dequeue_max_bytes', 'sync_wait_time', 'upload_max_bytes', 'upload_max_rows', 'max_queue_size' ) as $key ) {
			$this->assertTrue( isset( $settings[ $key ] ) );
		}

		$settings[ 'dequeue_max_bytes' ] = 50;
		Jetpack_Sync_Settings::update_settings( $settings );

		$updated_settings = Jetpack_Sync_Settings::get_settings();

		$this->assertSame( 50, $updated_settings[ 'dequeue_max_bytes' ] );
	}
}
