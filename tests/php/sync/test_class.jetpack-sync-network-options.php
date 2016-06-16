<?php

/**
 * Testing CRUD on Network Options
 * use phpunit --testsuite sync  -c tests/php.multisite.xml --filter WP_Test_Jetpack_New_Sync_Network_Options
 */
class WP_Test_Jetpack_New_Sync_Network_Options extends WP_Test_Jetpack_New_Sync_Base {
	protected $post;

	public function setUp() {

		parent::setUp();

		$this->client->set_network_options_whitelist( array( 'test_network_option' ) );
		add_site_option( 'test_network_option', 'foo' );
		$this->client->do_sync();
	}
	public function tearDown() {
		parent::tearDown();
	}

	public function test_added_network_option_is_synced() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multisite mode' );
		}
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertEquals( 'foo', $synced_option_value );
	}

	public function test_updated_network_option_is_synced() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}
		update_site_option( 'test_network_option', 'bar' );
		$this->client->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertEquals( 'bar', $synced_option_value );
	}

	public function test_deleted_network_option_is_synced() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}
		delete_site_option( 'test_network_option' );
		$this->client->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertEquals( false, $synced_option_value );
	}

	public function test_don_t_sync_network_option_if_not_on_whitelist() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}
		add_site_option( 'don_t_sync_test_network_option', 'foo' );
		$this->client->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'don_t_sync_test_network_option' );
		$this->assertEquals( false, $synced_option_value );
	}

}