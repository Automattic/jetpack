<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync.php';
Jetpack_Sync::init();
// phpunit --testsuite sync
class WP_Test_Jetpack_Syncl extends WP_UnitTestCase {

	public function test_sync() {
	}
}