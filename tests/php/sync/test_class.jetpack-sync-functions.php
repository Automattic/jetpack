<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-functions.php';


function jetpack_foo_is_callable() {
	return 'bar';
}

/**
 * Testing Functions
 */
class WP_Test_Jetpack_New_Sync_Functions extends WP_Test_Jetpack_New_Sync_Base {
	protected $post;

	public function setUp() {
		parent::setUp();
	}
	// TODO:
	// Add tests for Syncing data on shutdown
	// Add tests that prove that we know constants change
	function test_white_listed_function_is_synced() {

		$this->client->set_callable_whitelist( array( 'jetpack_foo_is_callable' ) );

		$this->client->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo_is_callable' );
		$this->assertEquals( jetpack_foo_is_callable(), $synced_value );
	}
}

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Functions extends WP_UnitTestCase {

	public function test_sync_all_functions() {
		$values = Jetpack_Sync_Functions::get_all();

		$this->assertEquals( network_site_url(), $values['main_network_site'] );
		$this->assertEquals( wp_max_upload_size(), $values['wp_max_upload_size'] );
	}

}