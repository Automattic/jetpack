<?php

use Automattic\Jetpack\Sync\Modules;

/**
 * Testing CRUD on Network Options
 * use phpunit --testsuite sync --filter WP_Test_Jetpack_Sync_Network_Options
 */
class WP_Test_Jetpack_Sync_Network_Options extends WP_Test_Jetpack_Sync_Base {
	protected $post;
	protected $network_options_module;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->network_options_module = Modules::get_module( 'network_options' );

		$this->network_options_module->set_network_options_whitelist( array( 'test_network_option' ) );
		add_site_option( 'test_network_option', 'foo' );
		$this->sender->do_sync();
	}

	public function test_added_network_option_is_synced() {
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertEquals( 'foo', $synced_option_value );
	}

	public function test_updated_network_option_is_synced() {
		update_site_option( 'test_network_option', 'bar' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertEquals( 'bar', $synced_option_value );
	}

	public function test_deleted_network_option_is_synced() {
		delete_site_option( 'test_network_option' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'test_network_option' );
		$this->assertFalse( $synced_option_value );
	}

	public function test_don_t_sync_network_option_if_not_on_whitelist() {
		add_site_option( 'don_t_sync_test_network_option', 'foo' );
		$this->sender->do_sync();
		$synced_option_value = $this->server_replica_storage->get_site_option( 'don_t_sync_test_network_option' );
		$this->assertFalse( $synced_option_value );
	}

}
