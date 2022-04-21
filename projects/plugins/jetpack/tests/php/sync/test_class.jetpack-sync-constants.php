<?php

use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\Constants;

/**
 * Testing CRUD on Constants
 */
class WP_Test_Jetpack_Sync_Constants extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $constants_module;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->resetCallableAndConstantTimeouts();

		$this->constant_module = Modules::get_module( 'constants' );
	}

	// TODO:
	// Add tests for Syncing data on shutdown
	// Add tests that prove that we know constants change
	public function test_white_listed_constant_is_synced() {
		$helper                 = new Jetpack_Sync_Test_Helper();
		$helper->array_override = array( 'TEST_FOO' );
		add_filter( 'jetpack_sync_constants_whitelist', array( $helper, 'filter_override_array' ) );

		define( 'TEST_FOO', sprintf( '%.8f', microtime( true ) ) );
		define( 'TEST_BAR', sprintf( '%.8f', microtime( true ) ) );

		$this->sender->do_sync();

		$synced_foo_value = $this->server_replica_storage->get_constant( 'TEST_FOO' );
		$synced_bar_value = $this->server_replica_storage->get_constant( 'TEST_BAR' );

		$this->assertEquals( TEST_FOO, $synced_foo_value );
		$this->assertNotEquals( TEST_BAR, $synced_bar_value );
	}

	public function test_does_not_fire_if_constants_havent_changed() {
		$this->constant_module->set_defaults(); // use the default constants
		$this->sender->do_sync();

		foreach ( Defaults::$default_constants_whitelist as $constant ) {
			$value = defined( $constant ) ? constant( $constant ) : null;
			$this->assertSame( $value, $this->server_replica_storage->get_constant( $constant ) );
		}

		$this->server_replica_storage->reset();
		$this->sender->do_sync();

		foreach ( Defaults::$default_constants_whitelist as $constant ) {
			$this->assertNull( $this->server_replica_storage->get_constant( $constant ) );
		}
	}

	public function test_white_listed_constant_doesnt_get_synced_twice() {
		$helper                 = new Jetpack_Sync_Test_Helper();
		$helper->array_override = array( 'TEST_ABC' );
		add_filter( 'jetpack_sync_constants_whitelist', array( $helper, 'filter_override_array' ) );

		define( 'TEST_ABC', 'FOO' );
		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_constant( 'TEST_ABC' );
		$this->assertEquals( 'FOO', $synced_value );

		$this->server_replica_storage->reset();

		delete_transient( Constants::CONSTANTS_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertNull( $this->server_replica_storage->get_constant( 'TEST_ABC' ) );
	}

	/**
	 * Verify that all constants are returned by get_objects_by_id.
	 */
	public function test_get_objects_by_id_all() {
		$module        = Modules::get_module( 'constants' );
		$all_constants = $module->get_objects_by_id( 'constant', array( 'all' ) );
		$this->assertEquals( $module->get_all_constants(), $all_constants );
	}

	/**
	 * Verify that get_object_by_id returns a allowed constant.
	 */
	public function test_get_objects_by_id_singular() {
		$module        = Modules::get_module( 'constants' );
		$constants     = $module->get_all_constants();
		$get_constants = $module->get_objects_by_id( 'constant', array( 'EMPTY_TRASH_DAYS' ) );
		$this->assertEquals( $constants['EMPTY_TRASH_DAYS'], $get_constants['EMPTY_TRASH_DAYS'] );
	}

}
