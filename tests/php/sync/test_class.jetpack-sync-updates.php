<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-updates.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Updates extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		Jetpack_Sync_Updates::init();
		self::reset_sync();
		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_updated_get_all() {
		$updates_keys         = array( 'plugins', 'themes', 'wordpress', 'translations', 'total' );
		$updates_details_keys = array( 'plugins', 'themes', 'wordpress' );
		$updated_data         = Jetpack_Sync_Updates::get_all();
		foreach ( $updates_keys as $key ) {
			$this->assertArrayHasKey( $key, $updated_data['updates'] );
		}

		foreach ( $updates_details_keys as $key ) {
			$this->assertArrayHasKey( $key, $updated_data['update_details'] );
		}
	}

	public function test_sync_update_plugin() {
		try {
			wp_update_plugins();

			$updated_data = Jetpack_Sync_Updates::get_to_sync();
			$this->assertArrayHasKey( 'plugins', $updated_data['update_details'] );
		} catch ( Exception $e ) {
			$this->markTestSkipped( "Can't connect to wordpress.org" );
		}
	}

	public function test_sync_update_themes() {
		try {
			wp_update_themes();

			$updated_data = Jetpack_Sync_Updates::get_to_sync();
			$this->assertArrayHasKey( 'themes', $updated_data['update_details'] );
		} catch ( Exception $e ) {
			$this->markTestSkipped( "Can't connect to wordpress.org" );
		}
	}

	public function utest_sync_maybe_update_core() {
		try {
			_maybe_update_core();
			$updated_data = Jetpack_Sync_Updates::get_to_sync();
			$this->assertArrayHasKey( 'wordpress', $updated_data['update_details'] );
		} catch ( Exception $e ) {
			$this->markTestSkipped( "Can't connect to wordpress.org" );
		}

	}

	private function reset_sync() {
		Jetpack_Sync_Updates::$sync = array();
	}
}