<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-all.php';
Jetpack_Sync_All::init();
// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_All extends WP_UnitTestCase {

	public function setUp() {

		parent::setUp();


	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_all() {
		// error_log( json_encode( Jetpack_Sync_All::all() ) );
	}
}