<?php

/**
 * Testing CRUD on Network Options
 * use phpunit --testsuite sync  -c tests/php.multisite.xml --filter WP_Test_Jetpack_Sync_Network_Options
 */
class WP_Test_Jetpack_Sync_Network_Options extends WP_Test_Jetpack_Sync_Base {
	protected $post;
	protected $network_options_module;

	public function setUp() {

		parent::setUp();

		$this->network_options_module = Jetpack_Sync_Modules::get_module( "network_options" );

		$this->network_options_module->set_network_options_whitelist( array( 'test_network_option' ) );
		add_site_option( 'test_network_option', 'foo' );
		$this->sender->do_sync();
	}

	public function tearDown() {
		parent::tearDown();
	}

	function test_white_listed_option_is_synced() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$this->resetCallableAndConstantTimeouts();
		add_site_option('banana', 'phone' );
		add_site_option( 'coffee','white' );

		$helper = new Jetpack_Sync_Test_Helper();
		$helper->array_override = array( 'banana' );
		add_filter( 'jetpack_sync_network_options_whitelist', array( $helper, 'filter_override_array' ) );
		$this->network_options_module->set_defaults(); // Reset the

		$this->sender->do_sync();

		$synced_foo_value = $this->server_replica_storage->get_site_option( 'banana' );
		$synced_bar_value = $this->server_replica_storage->get_site_option( 'coffee' );

		$this->assertEquals( 'phone', $synced_foo_value );
		$this->assertNotEquals( 'white', $synced_bar_value );
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
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertEquals( 'bar', $synced_option_value );
	}

	public function test_deleted_network_option_is_synced() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}
		delete_site_option( 'test_network_option' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertEquals( false, $synced_option_value );
	}

	public function test_don_t_sync_network_option_if_not_on_whitelist() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}
		add_site_option( 'don_t_sync_test_network_option', 'foo' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'don_t_sync_test_network_option' );
		$this->assertEquals( false, $synced_option_value );
	}

}
