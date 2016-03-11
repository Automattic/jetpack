<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-options-sync.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Options_Sync extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		Jetpack_Options_Sync::init();
		self::reset_sync();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_add_new_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::register( $option );

		add_option( $option, 1 );

		$this->assertContains( $option, Jetpack_Options_Sync::get_options_to_sync() );
	}

	public function test_sync_update_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::register( $option );
		add_option( $option, 1 );

		self::reset_sync();
		update_option( $option, 2 );

		$this->assertContains( $option, Jetpack_Options_Sync::get_options_to_sync() );
	}

	public function test_sync_delete_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::register( $option );
		add_option( $option, 1 );

		self::reset_sync();
		delete_option( $option );

		$this->assertContains( $option, Jetpack_Options_Sync::sync_delete() );
	}

	public function test_sync_updated_option() {
		$first_option = Jetpack_Options_Sync::$options[0];
		$new_blogname = 'updated first option';

		update_option( $first_option, $new_blogname );
		$data_to_sync = Jetpack_Options_Sync::sync();

		$this->assertContains( $new_blogname, $data_to_sync );
	}

	public function test_sync_first_option_sometimes() {
		$first_option = Jetpack_Options_Sync::$options[0];
		$new_blogname = get_option( $first_option );

		$data_to_sync = Jetpack_Options_Sync::sync_sometimes();
		$this->assertContains( $new_blogname, $data_to_sync );

		$new_blogname = 'Another update to the first option';
		update_option( $first_option, $new_blogname );

		$data_to_sync = Jetpack_Options_Sync::sync_sometimes();
		self::reset_sync();
		$this->assertContains( $new_blogname, $data_to_sync );

		// returns a null since we know nothing has changed
		$is_null = Jetpack_Options_Sync::sync_sometimes();
		$this->assertNull( $is_null );
	}


	public function test_sync_first_option_all() {
		$first_option = Jetpack_Options_Sync::$options[0];
		$new_blogname = get_option( $first_option );

		$data_to_sync = Jetpack_Options_Sync::sync_all();
		$this->assertContains( $new_blogname, $data_to_sync );
	}


	private function reset_sync() {
		Jetpack_Options_Sync::$sync   = array();
		Jetpack_Options_Sync::$delete = array();
	}
}