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

	function test_white_listed_function_is_synced() {

		$this->client->set_callable_whitelist( array( 'jetpack_foo' => 'jetpack_foo_is_callable' ) );

		$this->client->do_sync();

		$synced_value = $this->server_replica_storage->get_callable( 'jetpack_foo' );
		$this->assertEquals( jetpack_foo_is_callable(), 'bar' );
	}
}