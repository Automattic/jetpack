<?php

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Modules\Constants;

/**
 * Testing CRUD on Constants
 */
class WP_Test_Jetpack_Sync_Constants extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $constants_module;

	public function setUp() {
		parent::setUp();

		$this->resetCallableAndConstantTimeouts();

		$this->constant_module = Modules::get_module( "constants" );
	}

	/**
	 * TODO:
	 * Add tests for Syncing data on shutdown
	 * Add tests that prove that we know constants change
	 */
	public function test_allowed_constant_is_synced() {
		$helper = new Jetpack_Sync_Test_Helper();
		$helper->array_override = array( 'TEST_FOO' );
		add_filter( 'jetpack_sync_constants_allowlist', array( $helper, 'filter_override_array' ) );

		define( 'TEST_FOO', sprintf( "%.8f", microtime( true ) ) );
		define( 'TEST_BAR', sprintf( "%.8f", microtime( true ) ) );

		$this->sender->do_sync();

		$synced_foo_value = $this->server_replica_storage->get_constant( 'TEST_FOO' );
		$synced_bar_value = $this->server_replica_storage->get_constant( 'TEST_BAR' );

		$this->assertEquals( TEST_FOO, $synced_foo_value );
		$this->assertNotEquals( TEST_BAR, $synced_bar_value );
	}

	/**
	 * Test that we don't sync if the constant hasn't changed.
	 */
	public function test_does_not_fire_if_constants_havent_changed() {
		$this->constant_module->set_defaults(); // use the default constants
		$this->sender->do_sync();

		foreach ( Defaults::$default_constants_allowlist as $constant ) {
			try {
				$value = constant( $constant );
				$this->assertEquals( $value, $this->server_replica_storage->get_constant( $constant ) );
			} catch ( Exception $e ) {
				$this->markTestSkipped( $constant . ' not defined.' );
			}
		}

		$this->server_replica_storage->reset();
		$this->sender->do_sync();

		foreach ( Defaults::$default_constants_allowlist as $constant ) {
			$this->assertEquals( null, $this->server_replica_storage->get_constant( $constant ) );
		}
	}

	/**
	 * Test that an allowed constant does not get synced twice.
	 */
	public function test_allowed_constant_doesnt_get_synced_twice() {
		$helper = new Jetpack_Sync_Test_Helper();
		$helper->array_override = array( 'TEST_ABC' );
		add_filter( 'jetpack_sync_constants_allowlist', array( $helper, 'filter_override_array' ) );

		define( 'TEST_ABC', 'FOO' );
		$this->sender->do_sync();

		$synced_value = $this->server_replica_storage->get_constant( 'TEST_ABC' );
		$this->assertEquals( 'FOO', $synced_value );

		$this->server_replica_storage->reset();

		delete_transient( Constants::CONSTANTS_AWAIT_TRANSIENT_NAME );
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_constant( 'TEST_ABC' ) );
	}
}
