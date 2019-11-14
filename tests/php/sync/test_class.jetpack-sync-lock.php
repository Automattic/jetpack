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
		$this->assertTrue( Lock::attempt_lock( 'test' ) );
		$this->assertFalse( Lock::attempt_lock( 'test' ) );
	}

	/**
	 * Test remove lock
	 */
	public function test_remove_lock() {
		$this->assertTrue( Lock::attempt_lock( 'test' ) );
		Lock::remove_lock( 'test' );
		$this->assertTrue( Lock::attempt_lock( 'test' ) );
	}
}
