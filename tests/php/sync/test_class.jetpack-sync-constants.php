<?php

/**
 * Testing CRUD on Constants
 */
class WP_Test_Jetpack_New_Constants extends WP_Test_Jetpack_New_Sync_Base {
	protected $post_id;

	public function setUp() {
		parent::setUp();
	}

	// TODO:
	// Add tests for Syncing data on shutdown
	// Add tests that prove that we know constants change
	function test_white_listed_constant_is_synced() {

		$this->client->set_constants_whitelist( array( 'TEST_FOO' ) );

		define( 'TEST_FOO', microtime(true) );
		define( 'TEST_BAR', microtime(true) );

		$this->client->do_sync();

		$synced_foo_value = $this->server_replica_storage->get_constant( 'TEST_FOO' );
		$synced_bar_value = $this->server_replica_storage->get_constant( 'TEST_BAR' );

		$this->assertEquals( TEST_FOO, $synced_foo_value );
		$this->assertNotEquals( TEST_BAR, $synced_bar_value );
	}

	function test_does_not_fire_if_constants_havent_changed() {
		$this->client->set_defaults(); // use the default constants
		
		$this->client->do_sync();

		foreach( Jetpack_Sync_Client::$default_constants_whitelist as $constant ) {
			try {
				$value = constant( $constant );
				$this->assertEquals( $value, $this->server_replica_storage->get_constant( $constant ) );
			} catch( Exception $e ) {
				error_log( "Warning: No such constant: ".$constant );
			}
		}
		
		$this->server_replica_storage->reset();
		$this->client->do_sync();

		foreach( Jetpack_Sync_Client::$default_constants_whitelist as $constant ) {
			$this->assertEquals( null, $this->server_replica_storage->get_constant( $constant ) );
		}
	}
}