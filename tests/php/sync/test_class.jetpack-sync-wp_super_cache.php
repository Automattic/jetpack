<?php

/**
 * Testing WP Super Cache Sync
 */
class WP_Test_Jetpack_Sync_WP_Super_Cache extends WP_Test_Jetpack_Sync_Base {

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		if ( "1" != getenv( 'JETPACK_TEST_WP_SUPER_CACHE' ) ) {
			return; 
		} 
		
		self::$wp_super_cache_enabled = true;
	}

	public function setUp() {
		if ( ! self::$wp_super_cache_enabled ) {
			$this->markTestSkipped();
			return;
		}
		parent::setUp();
		$this->full_sync = Jetpack_Sync_Modules::get_module( 'full-sync' );
	}

	function test_module_is_enabled() {
		$this->assertTrue( !! Jetpack_Sync_Modules::get_module( "wp-super-cache" ) );
	}

	//@todo test functionality
}

