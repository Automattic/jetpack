<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-functions.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Functions extends WP_UnitTestCase {

	public function test_sync_all_functions() {
		$values = Jetpack_Sync_Functions::get_all();

		$this->assertEquals( network_site_url(), $values['main_network_site'] );
		$this->assertEquals( wp_max_upload_size(), $values['wp_max_upload_size'] );
	}

}