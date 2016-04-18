<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-functions.php';


function jetpack_foo_is_callable() {
	return 'bar';
}
$rand_jetpack_test = rand(0, 999 );
function jetpack_foo_is_callable_random() {
	global $rand_jetpack_test;
	return $rand_jetpack_test;
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

	function test_maybe_sync_function_is_synced() {
		$function_output = jetpack_foo_is_callable_random();
		// build a codec
		$sync_queue = $this->getMockBuilder( 'Jetpack_Sync_Queue' )
		                   ->disableOriginalConstructor()
		                   ->setMethods( array( 'add' ) )
		                   ->getMock();

		// Set up the expectation for the update() method
		// to be called only once and with the string 'something'
		// as its parameter.
		$sync_queue->expects( $this->once() )
		           ->method( 'add' )
		           ->with( $this->equalTo(
			           array(
				           'jetpack_sync_current_callables',
				           array( array( 'jetpack_foo_is_callable_random' => $function_output ) )
			           )
		           ) );

		// set sync queue
		$this->client->set_sync_queue( $sync_queue );
		$this->client->set_callable_whitelist( array( 'jetpack_foo_is_callable_random' ) );

		$this->client->do_sync();

		// Since no changed we expect no data to be synced
		$this->client->do_sync();

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