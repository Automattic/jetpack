<?php
require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-themes.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Themes extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();
		Jetpack_Sync_Themes::init();
	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_theme_data_after_theme_switch() {
		$this->assertFalse( Jetpack_Sync_Themes::$sync );
		$this->assertEmpty(Jetpack_Sync_Themes::get_to_sync() );
		switch_theme( 'twentyfourteen' );
		$this->assertTrue( Jetpack_Sync_Themes::$sync );
		$this->assertNotEmpty(Jetpack_Sync_Themes::get_to_sync() );

	}
}