<?php

/**
 * Testing WP Super Cache Sync
 */
class WP_Test_Jetpack_Sync_WP_Super_Cache extends WP_Test_Jetpack_Sync_Base {

	static $wp_super_cache_enabled;

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

	function test_constants_are_synced() {
		$this->sender->do_sync();

		//Confirm that constants that aren't synced return null
		$this->assertEquals( null, $this->server_replica_storage->get_constant( 'WP_SUPER_CACHE_NON_EXISTENT_CONSTANT' ) );

		$this->server_replica_storage->reset();
		$this->sender->do_sync();

		foreach ( Jetpack_Sync_Module_WP_Super_Cache::$wp_super_cache_constants as $constant ) {
			$this->assertNotEquals( null, $this->server_replica_storage->get_constant( $constant ) );
		}
	}

	function test_globals_are_synced() {
		$wp_super_cache_globals = Jetpack_Sync_Module_WP_Super_Cache::get_wp_super_cache_globals();
		foreach ( $wp_super_cache_globals as $key => $value ) {
			$GLOBALS[$key] = $key;
		}
		$this->sender->do_sync();

		$synced_values = $this->server_replica_storage->get_callable( 'wp_super_cache_globals' );

		foreach ( $wp_super_cache_globals as $key => $value ) {
			$this->assertEquals( $key, $synced_values[$key] );
		}
	}
}

