<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync.php';
Jetpack_Sync_All::init();
// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_All extends WP_UnitTestCase {

	public function test_sync_all() {
	}
}