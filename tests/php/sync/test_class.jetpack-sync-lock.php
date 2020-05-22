<?php
/**
 * Tests for the Lock class.
 *
 * @package automattic/jetpack-sync
 */

use Automattic\Jetpack\Sync\Lock;

/**
 * WP_Test_Jetpack_Sync_Lock class
 */
class WP_Test_Jetpack_Sync_Lock extends WP_Test_Jetpack_Sync_Base {

	/**
	 * Test request lock twice
	 */
	public function test_request_lock_twice() {
		$this->assertTrue( ( new Lock() )->attempt( 'test' ) );
		$this->assertFalse( ( new Lock() )->attempt( 'test' ) );
	}

	/**
	 * Test remove lock
	 */
	public function test_remove_lock() {
		$this->assertTrue( ( new Lock() )->attempt( 'test' ) );
		( new Lock() )->remove( 'test' );
		$this->assertTrue( ( new Lock() )->attempt( 'test' ) );
	}

	/**
	 * Test two locks with different name
	 */
	public function test_two_locks_different_name() {
		$this->assertTrue( ( new Lock() )->attempt( 'test' ) );
		$this->assertTrue( ( new Lock() )->attempt( 'test2' ) );
	}

	/**
	 * Test two locks with different name remove one lock
	 */
	public function test_two_locks_different_name_remove_one_lock() {
		$this->assertTrue( ( new Lock() )->attempt( 'test' ) );
		$this->assertTrue( ( new Lock() )->attempt( 'test2' ) );
		( new Lock() )->remove( 'test' );
		$this->assertFalse( ( new Lock() )->attempt( 'test2' ) );
		$this->assertTrue( ( new Lock() )->attempt( 'test' ) );
	}
}
