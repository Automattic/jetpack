<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-options.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Options extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		Jetpack_Sync_Options::init();
		self::reset_sync();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_add_new_option() {
		$option = 'new_option_0';
		Jetpack_Sync_Options::register( $option );

		add_option( $option, 1 );

		$this->assertContains( $option, Jetpack_Sync_Options::get_to_sync() );
	}

	public function test_sync_update_option() {
		$option = 'new_option_1';
		Jetpack_Sync_Options::register( $option );
		add_option( $option, 1 );

		self::reset_sync();
		update_option( $option, 2 );

		$this->assertContains( $option, Jetpack_Sync_Options::get_to_sync() );
	}

	public function test_sync_delete_option() {
		$option = 'new_option_2';
		Jetpack_Sync_Options::register( $option );
		add_option( $option, 1 );

		self::reset_sync();
		delete_option( $option );

		$this->assertContains( $option, Jetpack_Sync_Options::get_to_delete() );
	}

	public function test_sync_updated_option() {
		$first_option = Jetpack_Sync_Options::$options[0];
		$new_blogname = 'updated first option';

		update_option( $first_option, $new_blogname );
		$data_to_sync = Jetpack_Sync_Options::get_all();

		$this->assertContains( $new_blogname, $data_to_sync );
	}

	public function test_sync_first_option_sometimes() {
		$first_option = Jetpack_Sync_Options::$options[0];
		$new_blogname = get_option( $first_option );

		$data_to_sync = Jetpack_Sync_Options::get_all();
		$this->assertContains( $new_blogname, $data_to_sync );

		$new_blogname = 'Another update to the first option';
		update_option( $first_option, $new_blogname );

		$data_to_sync = Jetpack_Sync_Options::get_all();
		self::reset_sync();
		$this->assertContains( $new_blogname, $data_to_sync );

		// returns a null since we know nothing has changed
		$is_null = Jetpack_Sync_Options::get_all();
		$this->assertNull( $is_null );
	}


	public function test_sync_first_option_all() {
		$first_option = Jetpack_Sync_Options::$options[0];
		$new_blogname = get_option( $first_option );

		$data_to_sync = Jetpack_Sync_Options::get_all();
		$this->assertContains( $new_blogname, $data_to_sync );
	}


	private function reset_sync() {
		Jetpack_Sync_Options::$sync   = array();
		Jetpack_Sync_Options::$delete = array();
	}
}