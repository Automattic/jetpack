<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync.php';
Jetpack_Sync::init();

// phpunit --testsuite sync
//class WP_Test_Jetpack_Syncl extends WP_UnitTestCase {
//
//	public function test_sync_slice_ids() {
//		$ids         = range( 0, 15 );
//		$max         = 10;
//		$name        = 'jetpack_sync_ids';
//		$to_sync_ids = Jetpack_Sync::slice_ids( $ids, $max, $name );
//
//		$this->assertContains( 0, $to_sync_ids );
//		$this->assertContains( 9, $to_sync_ids );
//		$this->assertNotContains( 10, $to_sync_ids );
//
//		$to_sync_ids = Jetpack_Sync::slice_ids( array(), $max, $name );
//		$this->assertContains( 10, $to_sync_ids );
//		$this->assertContains( 15, $to_sync_ids );
//
//		$to_sync_ids = Jetpack_Sync::slice_ids( range( 0, 5 ), $max, $name );
//		$this->assertContains( 0, $to_sync_ids );
//		$this->assertContains( 5, $to_sync_ids );
//	}
//}