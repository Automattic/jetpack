<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-sync-functions.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Functions extends WP_UnitTestCase {


	public function setUp() {
		parent::setUp();
		Jetpack_Sync_Functions::init();
	}

	public function tearDown() {
		parent::tearDown();
	}

	public function test_sync_functions() {
		Jetpack_Sync_Functions::trigger_sync( 'featured_images_enabled' );
		$values = Jetpack_Sync_Functions::sync();

		$this->assertEquals( Jetpack::featured_images_enabled(), $values['featured_images_enabled'] );
	}

	public function test_sync_all_functions() {
		global $wp_version;

		$values = Jetpack_Sync_Functions::sync_all();

		$this->assertEquals( $wp_version, $values['wp_version'] );
		$this->assertEquals( wp_max_upload_size(), $values['wp_max_upload_size'] );
	}

}