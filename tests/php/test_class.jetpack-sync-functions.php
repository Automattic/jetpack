<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-sync-functions.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Functions extends WP_UnitTestCase {


	public function setUp() {
		parent::setUp();

	}

	public function tearDown() {
		parent::tearDown();
	}

	public function test_sync_functions() {
		global $wp_version;

		Jetpack_Sync_Functions::$functions['wp_version'];
		$values = Jetpack_Sync_Functions::sync_all();

		$this->assertEquals( $wp_version, $values['wp_version'] );

		get_network_option( $this->id, 'site_name', $default );
	}

	public function test_sync_all_functions() {
		global $wp_version;

		Jetpack_Sync_Functions::$functions['wp_version'];
		$values = Jetpack_Sync_Functions::sync_all();

		$this->assertEquals( $wp_version, $values['wp_version'] );
		$this->assertEquals( wp_max_upload_size(), $values['wp_max_upload_size'] );
	}

}