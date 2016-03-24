<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-network-options.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Network_Options extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		Jetpack_Sync_Network_Options::init();
		self::reset_sync();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_add_new_option() {
		$option = 'new_option_0';
		Jetpack_Sync_Network_Options::register( $option );

		add_site_option( $option, 1 );

		$this->assertContains( $option, array_keys( Jetpack_Sync_Network_Options::get_to_sync() ) );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );
	}

	public function test_sync_update_option() {
		$option = 'new_option_1';
		Jetpack_Sync_Network_Options::register( $option );
		add_site_option( $option, 1 );

		self::reset_sync();
		update_site_option( $option, 2 );

		$this->assertContains( $option, array_keys( Jetpack_Sync_Network_Options::get_to_sync() ) );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );
	}

	public function test_sync_delete_option() {
		$option = 'new_option_2';
		Jetpack_Sync_Network_Options::register( $option );
		add_site_option( $option, 1 );

		self::reset_sync();
		delete_site_option( $option );

		$this->assertContains( $option, Jetpack_Sync_Network_Options::get_to_delete() );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );
	}

	public function test_sync_updated_option() {
		$first_option = Jetpack_Sync_Network_Options::$options[0];
		$new_blogname = 'updated first option';

		update_site_option( $first_option, $new_blogname );
		$data_to_sync = Jetpack_Sync_Network_Options::get_to_sync();

		$this->assertContains( $new_blogname, $data_to_sync );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );
	}

	public function test_sync_first_option_all() {
		$first_option = Jetpack_Sync_Network_Options::$options[0];
		$new_blogname = get_site_option( $first_option );

		$data_to_sync = Jetpack_Sync_Network_Options::get_all();
		$this->assertContains( $new_blogname, $data_to_sync );
	}

	private function reset_sync() {
		Jetpack_Sync_Network_Options::$sync   = array();
		Jetpack_Sync_Network_Options::$delete = array();
		Jetpack_Sync::$do_shutdown = false;
	}
}