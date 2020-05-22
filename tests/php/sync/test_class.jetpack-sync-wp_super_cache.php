<?php

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\WP_Super_Cache;

/**
 * Testing WP Super Cache Sync
 */
class WP_Test_Jetpack_Sync_WP_Super_Cache extends WP_Test_Jetpack_Sync_Base {

	static $wp_super_cache_enabled;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();
		
		self::$wp_super_cache_enabled = true;
	}

	public function setUp() {
		if ( ! self::$wp_super_cache_enabled ) {
			$this->markTestSkipped();
			return;
		}
		parent::setUp();
		$this->resetCallableAndConstantTimeouts();
		set_current_screen( 'post_user' );
	}

	function define_constants() {
		foreach ( WP_Super_Cache::$wp_super_cache_constants as $constant ) {
			if ( false === defined( $constant ) ) {
				define( $constant, $constant );
			}
		}
	}

	function test_module_is_enabled() {
		$this->assertTrue( !! Modules::get_module( "wp-super-cache" ) );
	}

	function test_constants_are_synced() {
		$this->define_constants();
		$this->sender->do_sync();
		foreach ( WP_Super_Cache::$wp_super_cache_constants as $constant ) {
			$this->assertEquals( constant( $constant ), $this->server_replica_storage->get_constant( $constant ) );
		}
	}

	function test_globals_are_synced() {
		$wp_super_cache_globals = WP_Super_Cache::get_wp_super_cache_globals();
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

