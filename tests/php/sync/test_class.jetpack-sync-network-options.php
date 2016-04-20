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

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-network-options.php';

// phpunit --testsuite sync
//class WP_Test_Jetpack_Sync_Network_Options extends WP_UnitTestCase {
//
//	public function setUp() {
//		parent::setUp();
//
//		Jetpack_Sync_Network_Options::init();
//		self::reset_sync();
//
//		// Set the current user to user_id 1 which is equal to admin.
//		wp_set_current_user( 1 );
//	}
//
//	public function tearDown() {
//		parent::tearDown();
//
//	}
//
//	public function test_sync_add_new_option() {
//		$option = 'new_option_0';
//		Jetpack_Sync_Network_Options::register( $option );
//
//		add_site_option( $option, 1 );
//
//		$this->assertContains( $option, array_keys( Jetpack_Sync_Network_Options::get_to_sync() ) );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_update_option() {
//		$option = 'new_option_1';
//		Jetpack_Sync_Network_Options::register( $option );
//		add_site_option( $option, 1 );
//
//		self::reset_sync();
//		update_site_option( $option, 2 );
//
//		$this->assertContains( $option, array_keys( Jetpack_Sync_Network_Options::get_to_sync() ) );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_delete_option() {
//		$option = 'new_option_2';
//		Jetpack_Sync_Network_Options::register( $option );
//		add_site_option( $option, 1 );
//
//		self::reset_sync();
//		delete_site_option( $option );
//
//		$this->assertContains( $option, Jetpack_Sync_Network_Options::get_to_delete() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_updated_option() {
//		$first_option = Jetpack_Sync_Network_Options::$options[0];
//		$new_blogname = 'updated first option';
//
//		update_site_option( $first_option, $new_blogname );
//		$data_to_sync = Jetpack_Sync_Network_Options::get_to_sync();
//
//		$this->assertContains( $new_blogname, $data_to_sync );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_first_option_all() {
//		$first_option = Jetpack_Sync_Network_Options::$options[0];
//		$new_blogname = get_site_option( $first_option );
//
//		$data_to_sync = Jetpack_Sync_Network_Options::get_all();
//		$this->assertContains( $new_blogname, $data_to_sync );
//	}
//
//	private function reset_sync() {
//		Jetpack_Sync_Network_Options::$sync   = array();
//		Jetpack_Sync_Network_Options::$delete = array();
//		Jetpack_Sync::$do_shutdown = false;
//	}
//}